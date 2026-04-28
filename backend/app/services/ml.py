import joblib
import pandas as pd

# Correct path inside Docker
MODEL_PATH = "/ml/defect_model_xgboost.pkl"

# Load model once
model = joblib.load(MODEL_PATH)


def predict_defects(features: list[dict]):
    if not features:
        return {}

    # Convert to DataFrame
    df = pd.DataFrame(features)

    # Fill missing values (important)
    df = df.fillna(0)

    # ✅ MATCHES YOUR CURRENT MODEL (11 features ONLY)
    expected_columns = [
        'lines_of_code',
        'cyclomatic_complexity',
        'num_functions',
        'num_classes',
        'comment_density',
        'code_churn',
        'num_developers',
        'commit_frequency',
        'avg_function_length',
        'bug_fix_commits',
        'past_defects'
    ]

    # Keep only required columns
    df = df[expected_columns]

    # Predict
    predictions = model.predict(df)
    probabilities = model.predict_proba(df)[:, 1]

    # Format results
    results = {}
    for i, feature in enumerate(features):
        module_name = feature.get("module", f"module_{i}")
        results[module_name] = round(float(probabilities[i]), 4)

    return results