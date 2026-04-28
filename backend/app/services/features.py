from dataclasses import asdict, dataclass
import networkx as nx


@dataclass
class ModuleFeatures:
    module: str
    lines_of_code: int
    cyclomatic_complexity: float
    num_functions: int
    num_classes: int
    comment_density: float
    code_churn: int
    developer_experience_years: float
    num_developers: int
    commit_frequency: float
    bug_fix_commits: int
    past_defects: int
    test_coverage: float
    duplication_percentage: float
    avg_function_length: float
    depth_of_inheritance: int
    response_for_class: int
    coupling_between_objects: int
    lack_of_cohesion: float
    build_failures: int
    static_analysis_warnings: int
    security_vulnerabilities: int
    performance_issues: int


def extract_features(graph: nx.DiGraph) -> list[dict]:
    features = []

    for node in graph.nodes:
        row = ModuleFeatures(
            module=node,
            lines_of_code=120,
            cyclomatic_complexity=3.5,
            num_functions=5,
            num_classes=1,
            comment_density=0.2,
            code_churn=10,
            developer_experience_years=2.0,
            num_developers=2,
            commit_frequency=0.5,
            bug_fix_commits=1,
            past_defects=0,
            test_coverage=0.6,
            duplication_percentage=5.0,
            avg_function_length=25.0,
            depth_of_inheritance=2,
            response_for_class=10,
            coupling_between_objects=3,
            lack_of_cohesion=0.3,
            build_failures=0,
            static_analysis_warnings=2,
            security_vulnerabilities=0,
            performance_issues=1,
        )
        features.append(asdict(row))

    return features