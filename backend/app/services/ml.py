import joblib
import os

MODEL_PATH = "models/defect_model.pkl"

model = None

# Load model once
if os.path.exists(MODEL_PATH):
    try:
        model = joblib.load(MODEL_PATH)
        print("ML model loaded")
    except Exception as e:
        print("❌ Model load failed:", e)
        model = None


def predict_module_risks(features: list[dict]) -> dict[str, float]:
    if model is None:
        return {f["module"]: 0.5 for f in features}

    try:
        # ⚠️ MUST match training columns
        feature_cols = [
            "lines_of_code",
            "code_churn",
            "num_developers",
            "commit_frequency",
            "bug_fix_commits",
            "past_defects"
        ]

        X = []
        for f in features:
            row = [f.get(col, 0) for col in feature_cols]
            X.append(row)

        probs = model.predict_proba(X)[:, 1]

        return {
            f["module"]: float(round(p, 4))
            for f, p in zip(features, probs)
        }

    except Exception as e:
        print("❌ ML prediction failed:", e)
        return {f["module"]: 0.5 for f in features}