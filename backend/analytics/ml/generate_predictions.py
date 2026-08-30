import sys
import os
import joblib
import pandas as pd
from sqlalchemy import text
from datetime import datetime

# Add project root to sys path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database.db_connection import get_db_connection

def generate_batch_predictions():
    print("--- Starting Batch Prediction Job ---")
    
    # 1. Load Model
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    model_path = os.path.join(backend_dir, 'analytics', 'ml', 'models', 'logistic_regression_churn_model.pkl')
    try:
        pipeline = joblib.load(model_path)
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    # 2. Load Customer Data (from pipeline output to guarantee exact feature names)
    data_path = os.path.join(backend_dir, 'data', 'processed', 'customer_data_processed.csv')
    df = pd.read_csv(data_path)
    
    # Exclude leakage/target columns identical to training script
    drop_cols = ['Churn', 'Churn_Label', 'HighRisk_Heuristic', 'TenureGroup']
    
    # Keep customerID separate for DB insertion
    X = df.drop(columns=[c for c in drop_cols if c in df.columns] + ['customerID'])
    customer_ids = df['customerID']
    
    # 3. Predict Probabilities
    # Ensure SeniorCitizen is string as required by the pipeline
    X.loc[:, 'SeniorCitizen'] = X['SeniorCitizen'].astype(str)
    print("Generating predictions...")
    probs = pipeline.predict_proba(X)[:, 1]
    
    # 4. Assign Risk Levels
    risk_levels = []
    for p in probs:
        if p >= 0.7:
            risk_levels.append('High')
        elif p >= 0.4:
            risk_levels.append('Medium')
        else:
            risk_levels.append('Low')
            
    # Combine into predictions dataframe
    predictions_df = pd.DataFrame({
        'customerID': customer_ids,
        'churn_probability': probs,
        'risk_level': risk_levels,
        'model_version': 'v1.0-logreg',
        'prediction_timestamp': datetime.now()
    })
    
    print(f"Generated {len(predictions_df)} predictions.")
    print("Risk Tiers:\n", predictions_df['risk_level'].value_counts())
    
    # 5. Save to MySQL
    engine = get_db_connection()
    if not engine:
        print("Failed to connect to database.")
        return
        
    with engine.connect() as conn:
        # Create table if it doesn't exist
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS churn_predictions (
                customerID VARCHAR(20) PRIMARY KEY,
                churn_probability FLOAT,
                risk_level VARCHAR(10),
                model_version VARCHAR(50),
                prediction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (customerID) REFERENCES dim_customers(customerID) ON DELETE CASCADE
            )
        """))
        
        # Clear old predictions
        conn.execute(text("TRUNCATE TABLE churn_predictions;"))
        
        # Bulk insert
        # We can use pandas to_sql for speed and simplicity
        predictions_df.to_sql(name='churn_predictions', con=engine, if_exists='append', index=False)
        conn.commit()
        
    print("Successfully persisted predictions to MySQL database.")

if __name__ == "__main__":
    generate_batch_predictions()
