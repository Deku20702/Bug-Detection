import math


def sigmoid(value: float) -> float:
    return 1 / (1 + math.exp(-value))


def score_module(feature_row: list[float]) -> float:
    in_degree, out_degree, betweenness, cycle_count, loc_proxy = feature_row
    linear_score = (
        (0.08 * in_degree)
        + (0.09 * out_degree)
        + (1.7 * betweenness)
        + (0.25 * cycle_count)
        + (0.0035 * loc_proxy)
        - 1.5
    )
    return sigmoid(linear_score)


def main() -> None:
    sample_rows = [
        [0, 1, 0.0, 0, 20],
        [1, 2, 0.01, 0, 30],
        [4, 7, 0.13, 1, 120],
        [7, 10, 0.25, 3, 220],
    ]
    print("Heuristic risk model scores:")
    for row in sample_rows:
        print(f"features={row} -> risk={round(score_module(row), 4)}")
    print("No binary model artifact required for this environment.")


if __name__ == "__main__":
    main()
