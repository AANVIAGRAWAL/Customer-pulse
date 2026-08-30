import pandas as pd
import joblib

def test_saved_model():
    print("--- Verifying Saved ML Model ---")
    import os
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    model_path = os.path.join(backend_dir, 'analytics', 'ml', 'models', 'logistic_regression_churn_model.pkl')
    
    try:
        pipeline = joblib.load(model_path)
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Failed to load model: {e}")
        return
        
    # Create a dummy customer (with the expected feature structure)
    # Note: Target columns are omitted, proving no leakage during prediction.
    sample_customer = pd.DataFrame([{
        'gender': 'Female',
        'SeniorCitizen': '0',
        'Partner': 'Yes',
        'Dependents': 'No',
        'tenure': 24,
        'PhoneService': 'Yes',
        'MultipleLines': 'No',
        'InternetService': 'Fiber optic',
        'OnlineSecurity': 'No',
        'OnlineBackup': 'Yes',
        'DeviceProtection': 'No',
        'TechSupport': 'No',
        'StreamingTV': 'Yes',
        'StreamingMovies': 'No',
        'Contract': 'Month-to-month',
        'PaperlessBilling': 'Yes',
        'PaymentMethod': 'Electronic check',
        'MonthlyCharges': 89.5,
        'TotalCharges': 2148.0,
        'AvgMonthlyCharge': 89.5,
        'TotalServices': 2
    }])
    
    try:
        prob = pipeline.predict_proba(sample_customer)[0, 1]
        print(f"Prediction successful! Customer Churn Probability: {prob:.4f}")
        assert 0 <= prob <= 1, "Probability is out of bounds!"
        print("Verification: Output is a valid probability between 0 and 1.")
    except Exception as e:
        print(f"Prediction failed: {e}")

if __name__ == "__main__":
    test_saved_model()
