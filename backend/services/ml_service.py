import os
import pandas as pd
import joblib

class MLService:
    def __init__(self):
        self.pipeline = None

    def load_model(self):
        model_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
            'analytics', 'ml', 'models', 'logistic_regression_churn_model.pkl'
        )
        try:
            self.pipeline = joblib.load(model_path)
            print("ML model loaded successfully.")
        except Exception as e:
            print(f"Failed to load ML model: {e}")
            self.pipeline = None

    def predict(self, feature_dict):
        if not self.pipeline:
            raise RuntimeError("ML model is not loaded.")
        
        # Convert dictionary to DataFrame
        # Ensure SeniorCitizen is treated as string as per Phase 5 pipeline
        if 'SeniorCitizen' in feature_dict:
            feature_dict['SeniorCitizen'] = str(feature_dict['SeniorCitizen'])
            
        df = pd.DataFrame([feature_dict])
        
        try:
            # Output predict_proba
            prob = self.pipeline.predict_proba(df)[0, 1]
            
            # Apply documented risk thresholds
            if prob >= 0.7:
                risk_level = 'High'
            elif prob >= 0.4:
                risk_level = 'Medium'
            else:
                risk_level = 'Low'
                
            return {
                "churn_probability": float(prob),
                "risk_level": risk_level
            }
        except Exception as e:
            raise ValueError(f"Prediction failed: {e}")

ml_service = MLService()
