import math


def _sigmoid(value: float) -> float:
    return 1 / (1 + math.exp(-value))


def predict_module_risks(features: list[dict]) -> dict[str, float]:
    if not features:
        return {}

    # Lightweight, deterministic ML-style scoring for environments
    # where binary wheels are unavailable.
    risks: dict[str, float] = {}
    for feature in features:
        linear_score = (
            (0.08 * feature["in_degree"])
            + (0.09 * feature["out_degree"])
            + (1.7 * feature["betweenness"])
            + (0.25 * feature["cycle_count"])
            + (0.0035 * feature["loc_proxy"])
            - 1.5
        )
        risks[feature["module"]] = round(_sigmoid(linear_score), 4)
    return risks

