import pandas as pd
import numpy as np
import os

def process_customer_data(raw_path, processed_path):
    print("--- Starting Data Processing Pipeline ---")
    
    # 1. Load data
    try:
        df = pd.read_csv(raw_path)
        print(f"Loaded raw dataset. Input rows: {df.shape[0]}, Columns: {df.shape[1]}")
    except FileNotFoundError:
        print(f"Error: Could not find dataset at {raw_path}")
        return

    # 2. Validate expected columns
    expected_cols = [
        'customerID', 'gender', 'SeniorCitizen', 'Partner', 'Dependents',
        'tenure', 'PhoneService', 'MultipleLines', 'InternetService',
        'OnlineSecurity', 'OnlineBackup', 'DeviceProtection', 'TechSupport',
        'StreamingTV', 'StreamingMovies', 'Contract', 'PaperlessBilling',
        'PaymentMethod', 'MonthlyCharges', 'TotalCharges', 'Churn'
    ]
    missing_cols = [c for c in expected_cols if c not in df.columns]
    if missing_cols:
        print(f"Error: Missing expected columns: {missing_cols}")
        return
    
    initial_rows = df.shape[0]

    # 3 & 5. Correct data types & Handle missing values
    # TotalCharges is object due to blank spaces (" ")
    df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
    missing_total_charges = df['TotalCharges'].isnull().sum()
    
    # Impute missing TotalCharges. Customers with missing TotalCharges have tenure=0.
    # Therefore, they haven't been charged yet, so TotalCharges = 0.
    df['TotalCharges'] = df['TotalCharges'].fillna(0)
    print(f"Handled {missing_total_charges} missing values in TotalCharges (imputed with 0 since tenure is 0).")

    # 4. Handle duplicates
    duplicates = df.duplicated().sum()
    if duplicates > 0:
        df = df.drop_duplicates()
        print(f"Removed {duplicates} duplicate rows.")
    else:
        print("No duplicate rows found.")

    # 6. Encode categorical variables where required
    # Create a numeric target label for ML, but preserve the original 'Churn' column
    df['Churn_Label'] = df['Churn'].map({'Yes': 1, 'No': 0})
    
    # Standardize 'No internet service' and 'No phone service' to just 'No' for boolean flags if needed,
    # but we will leave them as-is to preserve original categorical detail for the UI.

    # 7. Create meaningful analytical features
    print("Generating analytical features...")
    
    # Feature 1: AvgMonthlyCharge (historical average to compare against current MonthlyCharges)
    # Handled division by zero for tenure=0
    df['AvgMonthlyCharge'] = np.where(df['tenure'] > 0, df['TotalCharges'] / df['tenure'], df['MonthlyCharges'])
    
    # Feature 2: TenureGroup (for easy segmentation in the UI/Charts)
    bins = [-1, 12, 24, 48, 60, 100]
    labels = ['0-1 Year', '1-2 Years', '2-4 Years', '4-5 Years', '5+ Years']
    df['TenureGroup'] = pd.cut(df['tenure'], bins=bins, labels=labels)
    
    # Feature 3: TotalServices (How many add-on services they have)
    services = ['OnlineSecurity', 'OnlineBackup', 'DeviceProtection', 'TechSupport', 'StreamingTV', 'StreamingMovies']
    df['TotalServices'] = df[services].apply(lambda x: (x == 'Yes').sum(), axis=1)

    # Feature 4: HighRisk_Heuristic (Simple baseline rule: Month-to-month + Fiber optic = historically high risk)
    df['HighRisk_Heuristic'] = ((df['Contract'] == 'Month-to-month') & (df['InternetService'] == 'Fiber optic')).astype(int)

    # 8. Preserve original churn target: Checked (Churn column remains)
    
    # 9. Save processed dataset
    os.makedirs(os.path.dirname(processed_path), exist_ok=True)
    df.to_csv(processed_path, index=False)
    
    final_rows = df.shape[0]
    
    print("\n--- Pipeline Summary ---")
    print(f"Input rows: {initial_rows}")
    print(f"Output rows: {final_rows}")
    print(f"Removed records: {initial_rows - final_rows}")
    print(f"Modified records: {missing_total_charges} (imputed TotalCharges)")
    print("Generated features:")
    print("  - Churn_Label (1/0)")
    print("  - AvgMonthlyCharge (TotalCharges / tenure)")
    print("  - TenureGroup (Categorical bins)")
    print("  - TotalServices (Count of add-ons)")
    print("  - HighRisk_Heuristic (Binary flag)")
    print(f"Saved processed dataset to: {processed_path}")

if __name__ == "__main__":
    raw = '/Users/aanviagrawal/Customer pulse/data/raw/WA_Fn-UseC_-Telco-Customer-Churn.csv'
    processed = '/Users/aanviagrawal/Customer pulse/data/processed/customer_data_processed.csv'
    process_customer_data(raw, processed)
