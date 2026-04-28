import pandas as pd
import xgboost as xgb
import joblib
import os


def main():
    # 📂 1. Load dataset
    DATA_PATH = os.path.join(os.path.dirname(__file__), "software_defect_prediction_dataset.csv")
    df = pd.read_csv(DATA_PATH)

    print(f"Dataset loaded with shape: {df.shape}")

    # 🧠 2. Define features (ALL 22)
    features = [
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
        'lack_of_cohesion',   # ⚠️ make sure spelling matches CSV
        'build_failures',
        'static_analysis_warnings',
        'security_vulnerabilities',
        'performance_issues'
    ]

    target = 'defect'

    # 🧪 3. Split features and target
    X = df[features]
    y = df[target]

    print("Features and target prepared")

    # ⚙️ 4. Initialize XGBoost model
    model = xgb.XGBClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=6,
        use_label_encoder=False,
        eval_metric='logloss'
    )

    print("Training model... ⏳")
    model.fit(X, y)

    # 💾 5. Save model
    MODEL_PATH = os.path.join(os.path.dirname(__file__), "defect_model_xgboost.pkl")
    joblib.dump(model, MODEL_PATH)

    print(f"✅ Model saved at: {MODEL_PATH}")


if __name__ == "__main__":
    main()