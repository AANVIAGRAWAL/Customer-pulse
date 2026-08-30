import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

def train_churn_model():
    print("--- Starting ML Churn Prediction Pipeline ---")
    
    # 1. Load Dataset
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    data_path = os.path.join(backend_dir, 'data', 'processed', 'customer_data_processed.csv')
    df = pd.read_csv(data_path)
    
    # 2. Define Features and Target
    # Exclude IDs, Targets, and derived features that could leak or overlap heavily with the target.
    target_col = 'Churn_Label'
    drop_cols = ['customerID', 'Churn', 'Churn_Label', 'HighRisk_Heuristic', 'TenureGroup']
    
    X = df.drop(columns=drop_cols)
    y = df[target_col]
    
    # 3. Train/Test Split (Stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training records: {X_train.shape[0]}")
    print(f"Testing records: {X_test.shape[0]}")
    print(f"Class balance (Train Churn Rate): {y_train.mean():.4f}")
    
    # 4. Preprocessing Pipeline
    # Convert SeniorCitizen to string to treat it as categorical explicitly
    X_train.loc[:, 'SeniorCitizen'] = X_train['SeniorCitizen'].astype(str)
    X_test.loc[:, 'SeniorCitizen'] = X_test['SeniorCitizen'].astype(str)
    
    numeric_features = ['tenure', 'MonthlyCharges', 'TotalCharges', 'AvgMonthlyCharge', 'TotalServices']
    categorical_features = ['gender', 'SeniorCitizen', 'Partner', 'Dependents', 'PhoneService', 
                            'MultipleLines', 'InternetService', 'OnlineSecurity', 'OnlineBackup', 
                            'DeviceProtection', 'TechSupport', 'StreamingTV', 'StreamingMovies', 
                            'Contract', 'PaperlessBilling', 'PaymentMethod']
    
    numeric_transformer = StandardScaler()
    categorical_transformer = OneHotEncoder(handle_unknown='ignore', drop='if_binary')
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])
        
    # 5. Baseline Model: Logistic Regression
    print("\n--- Training Logistic Regression ---")
    lr_pipeline = Pipeline(steps=[('preprocessor', preprocessor),
                                  ('classifier', LogisticRegression(random_state=42, max_iter=1000))])
    
    lr_pipeline.fit(X_train, y_train)
    
    lr_preds = lr_pipeline.predict(X_test)
    lr_probs = lr_pipeline.predict_proba(X_test)[:, 1]
    
    print("Logistic Regression Metrics:")
    print(f"Accuracy: {accuracy_score(y_test, lr_preds):.4f}")
    print(f"Precision: {precision_score(y_test, lr_preds):.4f}")
    print(f"Recall: {recall_score(y_test, lr_preds):.4f}")
    print(f"F1-score: {f1_score(y_test, lr_preds):.4f}")
    print(f"ROC-AUC: {roc_auc_score(y_test, lr_probs):.4f}")
    print(f"Confusion Matrix:\n{confusion_matrix(y_test, lr_preds)}")
    
    # 6. Comparison Model: Random Forest
    print("\n--- Training Random Forest ---")
    rf_pipeline = Pipeline(steps=[('preprocessor', preprocessor),
                                  ('classifier', RandomForestClassifier(random_state=42, n_estimators=100))])
    
    rf_pipeline.fit(X_train, y_train)
    
    rf_preds = rf_pipeline.predict(X_test)
    rf_probs = rf_pipeline.predict_proba(X_test)[:, 1]
    
    print("Random Forest Metrics:")
    print(f"Accuracy: {accuracy_score(y_test, rf_preds):.4f}")
    print(f"Precision: {precision_score(y_test, rf_preds):.4f}")
    print(f"Recall: {recall_score(y_test, rf_preds):.4f}")
    print(f"F1-score: {f1_score(y_test, rf_preds):.4f}")
    print(f"ROC-AUC: {roc_auc_score(y_test, rf_probs):.4f}")
    print(f"Confusion Matrix:\n{confusion_matrix(y_test, rf_preds)}")
    
    # 7. Model Selection & Risk Scoring
    print("\n--- Risk Scoring (Using Logistic Regression) ---")
    # LogReg is slightly more robust to overfitting and highly interpretable. 
    
    # Apply identical SeniorCitizen string cast for full inference
    X.loc[:, 'SeniorCitizen'] = X['SeniorCitizen'].astype(str)
    all_probs = lr_pipeline.predict_proba(X)[:, 1]
    df['churn_probability'] = all_probs
    df['risk_level'] = np.where(df['churn_probability'] >= 0.7, 'High', 
                                np.where(df['churn_probability'] >= 0.4, 'Medium', 'Low'))
    
    print("Risk Level Distribution (Thresholds: <0.4 Low, 0.4-0.7 Medium, >=0.7 High):")
    print(df['risk_level'].value_counts())
    
    # 8. Feature Interpretability (Logistic Regression)
    print("\n--- Feature Interpretability (Associations, NOT Causation) ---")
    feature_names = numeric_features + list(lr_pipeline.named_steps['preprocessor'].named_transformers_['cat'].get_feature_names_out(categorical_features))
    coefficients = lr_pipeline.named_steps['classifier'].coef_[0]
    
    coef_df = pd.DataFrame({'Feature': feature_names, 'Coefficient': coefficients})
    coef_df['Abs_Coefficient'] = coef_df['Coefficient'].abs()
    coef_df = coef_df.sort_values(by='Abs_Coefficient', ascending=False)
    
    print("\nTop 5 Positive Associations (Higher observed churn):")
    print(coef_df[coef_df['Coefficient'] > 0].head(5)[['Feature', 'Coefficient']].to_string(index=False))
    
    print("\nTop 5 Negative Associations (Lower observed churn):")
    print(coef_df[coef_df['Coefficient'] < 0].head(5)[['Feature', 'Coefficient']].to_string(index=False))
    
    # 9. Save Artifacts
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    output_dir = os.path.join(backend_dir, 'analytics', 'ml', 'models')
    os.makedirs(output_dir, exist_ok=True)
    
    model_path = os.path.join(output_dir, 'logistic_regression_churn_model.pkl')
    joblib.dump(lr_pipeline, model_path)
    print(f"\nModel pipeline saved successfully to {model_path}")

if __name__ == "__main__":
    train_churn_model()
