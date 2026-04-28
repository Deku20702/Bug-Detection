import joblib
import os
import pandas as pd

# Path to your trained model
MODEL_PATH = "/ml/defect_model_xgboost.pkl"

# Load model once (efficient 🚀)
model = joblib.load(MODEL_PATH)


def predict_defects(features: list[dict]):
    if not features:
        return {}

    # Convert list of dict → DataFrame
    df = pd.DataFrame(features)

    # IMPORTANT: ensure correct column order
    expected_columns = [
    'lines_of_code',
    'cyclomatic_complexity',
    'num_functions',
    'num_classes',
    'comment_density',
    'code_churn',
    'developer_experience_years',
    'num_developers',
    'commit_frequency',
    'bug_fix_commits',
    'past_defects',
    'test_coverage',
    'duplication_percentage',
    'avg_function_length',
    'depth_of_inheritance',
    'response_for_class',
    'coupling_between_objects',
    'lack_of_cohesion',
    'build_failures',
    'static_analysis_warnings',
    'security_vulnerabilities',
    'performance_issues'
]

    df = df[expected_columns]

    predictions = model.predict(df)
    probabilities = model.predict_proba(df)[:, 1]

    results = {}
    for i, feature in enumerate(features):
        module_name = feature.get("module", f"module_{i}")
        results[module_name] = round(float(probabilities[i]), 4)

    return results