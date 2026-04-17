from dataclasses import asdict, dataclass

import networkx as nx


@dataclass
class ModuleFeatures:
    module: str
    in_degree: int
    out_degree: int
    betweenness: float
    cycle_count: int
    loc_proxy: int


def extract_features(graph: nx.DiGraph) -> list[dict]:
    betweenness = nx.betweenness_centrality(graph) if graph.number_of_nodes() else {}
    cycle_map: dict[str, int] = {node: 0 for node in graph.nodes}
    for cycle in nx.simple_cycles(graph):
        for node in cycle:
            cycle_map[node] = cycle_map.get(node, 0) + 1

    features: list[dict] = []
    for node in graph.nodes:
        row = ModuleFeatures(
            module=node,
            in_degree=graph.in_degree(node),
            out_degree=graph.out_degree(node),
            betweenness=round(betweenness.get(node, 0.0), 5),
            cycle_count=cycle_map.get(node, 0),
            loc_proxy=max(20, (graph.in_degree(node) + graph.out_degree(node)) * 12),
        )
        features.append(asdict(row))
    return features

