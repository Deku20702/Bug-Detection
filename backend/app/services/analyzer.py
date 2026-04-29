import ast
from pathlib import Path
import networkx as nx


def parse_python_imports(file_path: Path) -> tuple[list[dict], bool]:
    content = file_path.read_text(encoding="utf-8", errors="ignore")
    lines = content.splitlines()

    try:
        tree = ast.parse(content)
    except SyntaxError:
        return [], False

    imports = []

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for name in node.names:
                imports.append({
                    "module": name.name,
                    "line": getattr(node, "lineno", 1),
                    "code": lines[node.lineno - 1].strip() if node.lineno <= len(lines) else ""
                })

        elif isinstance(node, ast.ImportFrom):
            base = node.module or ""

            for name in node.names:
                full_import = f"{base}.{name.name}" if base else name.name

                imports.append({
                    "module": full_import,
                    "line": getattr(node, "lineno", 1),
                    "code": lines[node.lineno - 1].strip() if node.lineno <= len(lines) else ""
                })

    return imports, True


def build_dependency_graph(repo_path: Path) -> tuple[nx.DiGraph, dict[str, int]]:
    graph = nx.DiGraph()
    modules: dict[str, Path] = {}

    parseable_files = 0
    skipped_files = 0

    # 🔹 Register modules
    for py_file in repo_path.rglob("*.py"):
        rel = py_file.relative_to(repo_path).as_posix().replace("/", ".")
        module_name = rel.removesuffix(".py")
        modules[module_name] = py_file
        graph.add_node(module_name)

    # 🔹 Build edges
    for module, file_path in modules.items():
        imports_data, ok = parse_python_imports(file_path)

        if ok:
            parseable_files += 1
        else:
            skipped_files += 1

        for imp in imports_data:
            imported_name = imp["module"]

            # normalize
            imported_name = imported_name.lstrip(".").strip()
            if not imported_name:
                continue

            # skip external libs
            top_level = imported_name.split(".")[0]
            if not any(m.startswith(top_level) for m in modules):
                continue

            matches = []

            for m in modules:
                if m == imported_name:
                    matches.append(m)
                elif m.split(".")[-1] == imported_name.split(".")[-1]:
                    matches.append(m)
                elif imported_name in m:
                    matches.append(m)

            # debug unmatched imports
            if not matches:
                print(f"[UNMATCHED] {module} -> {imported_name}")

            # add edges
            for target in matches:
                if target != module:
                    if graph.has_edge(module, target):
                        graph[module][target].setdefault("evidence", []).append({
                            "line": imp["line"],
                            "code": imp["code"]
                        })
                    else:
                        graph.add_edge(module, target, evidence=[{
                            "line": imp["line"],
                            "code": imp["code"]
                        }])

    # 🔥 DEBUG (important)
    print("Nodes:", graph.number_of_nodes())
    print("Edges:", graph.number_of_edges())

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