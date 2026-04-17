import ast
from pathlib import Path

import networkx as nx


def parse_python_imports(file_path: Path) -> tuple[set[str], bool]:
    content = file_path.read_text(encoding="utf-8", errors="ignore")
    try:
        tree = ast.parse(content)
    except SyntaxError:
        # Skip non-parseable files (e.g. Python2 code) without failing full scan.
        return set(), False
    imports: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for name in node.names:
                imports.add(name.name.split(".")[0])
        elif isinstance(node, ast.ImportFrom) and node.module:
            imports.add(node.module.split(".")[0])
    return imports, True


def build_dependency_graph(repo_path: Path) -> tuple[nx.DiGraph, dict[str, int]]:
    graph = nx.DiGraph()
    modules: dict[str, Path] = {}
    parseable_files = 0
    skipped_files = 0
    for py_file in repo_path.rglob("*.py"):
        rel = py_file.relative_to(repo_path).as_posix().replace("/", ".")
        module_name = rel.removesuffix(".py")
        modules[module_name] = py_file
        graph.add_node(module_name)

    for module, file_path in modules.items():
        imports, ok = parse_python_imports(file_path)
        if ok:
            parseable_files += 1
        else:
            skipped_files += 1
        for imported in imports:
            matches = [m for m in modules if m.endswith(imported) or m == imported]
            for target in matches:
                if target != module:
                    graph.add_edge(module, target)
    stats = {
        "total_python_files": len(modules),
        "parseable_python_files": parseable_files,
        "skipped_python_files": skipped_files,
    }
    return graph, stats


def detect_anti_patterns(graph: nx.DiGraph) -> list[str]:
    issues: list[str] = []
    cycles = list(nx.simple_cycles(graph))
    if cycles:
        issues.append(f"Circular dependencies detected: {len(cycles)} cycle(s)")
    high_out_degree = [n for n, d in graph.out_degree() if d >= 8]
    if high_out_degree:
        issues.append(f"Tight coupling hotspot modules: {', '.join(high_out_degree[:5])}")
    high_in_degree = [n for n, d in graph.in_degree() if d >= 8]
    if high_in_degree:
        issues.append(f"God-like utility modules (high fan-in): {', '.join(high_in_degree[:5])}")
    if not issues:
        issues.append("No major anti-patterns detected with current heuristics.")
    return issues

