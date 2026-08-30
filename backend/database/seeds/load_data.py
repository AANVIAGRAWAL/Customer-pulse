import pandas as pd
import sys
import os

# Add parent directory to path to import db_connection
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_connection import get_db_connection

def load_data(csv_path):
    print("--- Starting Data Load Process ---")
    
    engine = get_db_connection()
    if not engine:
        print("Aborting data load due to connection failure.")
        return

    try:
        print(f"Loading data from {csv_path}...")
        df = pd.read_csv(csv_path)
        
        # 1. dim_customers
        dim_customers = df[['customerID', 'gender', 'SeniorCitizen', 'Partner', 'Dependents']]
        print(f"Inserting into dim_customers ({len(dim_customers)} rows)...")
        dim_customers.to_sql('dim_customers', con=engine, if_exists='append', index=False)
        
        # 2. dim_accounts
        dim_accounts = df[['customerID', 'Contract', 'PaperlessBilling', 'PaymentMethod']]
        print(f"Inserting into dim_accounts ({len(dim_accounts)} rows)...")
        dim_accounts.to_sql('dim_accounts', con=engine, if_exists='append', index=False)
        
        # 3. dim_services
        dim_services = df[['customerID', 'PhoneService', 'MultipleLines', 'InternetService', 
                           'OnlineSecurity', 'OnlineBackup', 'DeviceProtection', 'TechSupport', 
                           'StreamingTV', 'StreamingMovies']]
        print(f"Inserting into dim_services ({len(dim_services)} rows)...")
        dim_services.to_sql('dim_services', con=engine, if_exists='append', index=False)
        
        # 4. fact_customer_metrics
        fact_metrics = df[['customerID', 'tenure', 'MonthlyCharges', 'TotalCharges', 'AvgMonthlyCharge', 'TotalServices']]
        print(f"Inserting into fact_customer_metrics ({len(fact_metrics)} rows)...")
        fact_metrics.to_sql('fact_customer_metrics', con=engine, if_exists='append', index=False)
        
        # 5. fact_churn
        fact_churn = df[['customerID', 'Churn', 'Churn_Label', 'TenureGroup', 'HighRisk_Heuristic']]
        print(f"Inserting into fact_churn ({len(fact_churn)} rows)...")
        fact_churn.to_sql('fact_churn', con=engine, if_exists='append', index=False)
        
        print("--- Data Load Complete ---")
        
    except Exception as e:
        print(f"\n--- DATA LOAD ERROR ---")
        print(str(e))

if __name__ == "__main__":
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    csv_file = os.path.join(backend_dir, 'data', 'processed', 'customer_data_processed.csv')
    load_data(csv_file)
