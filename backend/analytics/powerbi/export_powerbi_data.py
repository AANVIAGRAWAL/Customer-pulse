import os
import sys
import pandas as pd
from sqlalchemy import text

# Add project root to path for absolute imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from database.db_connection import get_db_connection

def export_powerbi_dataset():
    """
    Extracts a fully denormalized dataset from the MySQL database
    specifically optimized for Power BI ingestion.
    """
    engine = get_db_connection()
    if not engine:
        print("Error: Could not connect to the database.")
        sys.exit(1)

    query = text("""
        SELECT 
            c.customerID,
            c.gender,
            c.SeniorCitizen,
            c.Partner,
            c.Dependents,
            s.PhoneService,
            s.MultipleLines,
            s.InternetService,
            s.OnlineSecurity,
            s.OnlineBackup,
            s.DeviceProtection,
            s.TechSupport,
            s.StreamingTV,
            s.StreamingMovies,
            a.Contract,
            a.PaperlessBilling,
            a.PaymentMethod,
            m.tenure,
            m.MonthlyCharges,
            m.TotalCharges,
            CASE WHEN m.tenure <= 12 THEN '0-1 Year'
                 WHEN m.tenure <= 24 THEN '1-2 Years'
                 WHEN m.tenure <= 48 THEN '2-4 Years'
                 WHEN m.tenure <= 60 THEN '4-5 Years'
                 ELSE '5+ Years' END as TenureGroup,
            f.Churn,
            CASE WHEN f.Churn = 'Yes' THEN 1 ELSE 0 END as ChurnNumeric,
            p.churn_probability,
            p.risk_level
        FROM dim_customers c
        JOIN dim_services s ON c.customerID = s.customerID
        JOIN dim_accounts a ON c.customerID = a.customerID
        JOIN fact_customer_metrics m ON c.customerID = m.customerID
        JOIN fact_churn f ON c.customerID = f.customerID
        LEFT JOIN churn_predictions p ON c.customerID = p.customerID;
    """)

    print("Executing extraction query...")
    try:
        with engine.connect() as connection:
            df = pd.read_sql(query, connection)

        print(f"Extraction successful. Rows retrieved: {len(df)}")
        
        # Validation
        if len(df) != 7043:
            print(f"WARNING: Expected 7043 rows, but got {len(df)}.")
        
        # Check nulls (TotalCharges should have 11)
        null_total_charges = df['TotalCharges'].isna().sum()
        print(f"Null TotalCharges detected: {null_total_charges}")
        
        # Save to processed directory
        output_dir = os.path.join(os.path.dirname(__file__), '../../data/processed/powerbi')
        os.makedirs(output_dir, exist_ok=True)
        
        output_path = os.path.join(output_dir, 'customerpulse_powerbi_export.csv')
        df.to_csv(output_path, index=False)
        print(f"Data successfully exported to {output_path}")

        # Basic validations for console output
        churn_rate = df['ChurnNumeric'].mean() * 100
        print(f"Cross-Validation -> Overall Churn Rate: {churn_rate:.2f}%")
        
        contract_churn = df.groupby('Contract')['ChurnNumeric'].mean() * 100
        print("\nCross-Validation -> Churn by Contract:")
        print(contract_churn)
        
    except Exception as e:
        print(f"Error during export: {e}")
        sys.exit(1)

if __name__ == "__main__":
    export_powerbi_dataset()
