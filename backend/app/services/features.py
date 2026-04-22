from dataclasses import asdict, dataclass
import networkx as nx


@dataclass
class ModuleFeatures:
    module: str

    # Graph features
    in_degree: int
    out_degree: int
    betweenness: float
    cycle_count: int
    loc_proxy: int

    # ML-compatible features (mapped)
    lines_of_code: int
    code_churn: int
    num_developers: int
    commit_frequency: float
    bug_fix_commits: int
    past_defects: int


def extract_features(graph: nx.DiGraph) -> list[dict]:
    betweenness = nx.betweenness_centrality(graph) if graph.number_of_nodes() else {}

    cycle_map = {node: 0 for node in graph.nodes}
    for cycle in nx.simple_cycles(graph):
        for node in cycle:
            cycle_map[node] += 1

    features = []

    for node in graph.nodes:
        in_deg = graph.in_degree(node)
        out_deg = graph.out_degree(node)

        loc_proxy = max(20, (in_deg + out_deg) * 12)

        row = ModuleFeatures(
            module=node,

            # Graph features
            in_degree=in_deg,
            out_degree=out_deg,
            betweenness=round(betweenness.get(node, 0.0), 5),
            cycle_count=cycle_map.get(node, 0),
            loc_proxy=loc_proxy,

            # ML mapping (approximation)
            lines_of_code=loc_proxy,
            code_churn=out_deg * 10,
            num_developers=1,
            commit_frequency=0.1,
            bug_fix_commits=0,
            past_defects=0,
        )

        features.append(asdict(row))

    return features