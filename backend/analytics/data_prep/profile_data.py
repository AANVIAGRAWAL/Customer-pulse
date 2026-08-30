import pandas as pd
import numpy as np
import os

# Paths
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
raw_data_path = os.path.join(backend_dir, 'data', 'raw', 'WA_Fn-UseC_-Telco-Customer-Churn.csv')
sample_data_dir = os.path.join(backend_dir, 'data', 'sample')
sample_data_path = os.path.join(sample_data_dir, 'sample_dataset.csv')

# Load
df = pd.read_csv(raw_data_path)

print("--- Row & Column Count ---")
print(f"Rows: {df.shape[0]}, Columns: {df.shape[1]}\n")

print("--- Data Types ---")
print(df.dtypes)
print("\n")

print("--- Standard Missing Values ---")
print(df.isnull().sum())
print("\n")

print("--- Duplicate Rows ---")
print(f"Duplicates: {df.duplicated().sum()}\n")

# Convert TotalCharges to numeric (often comes as string with spaces for missing)
df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
print("--- Missing Values after TotalCharges Coercion ---")
print(f"TotalCharges missing: {df['TotalCharges'].isnull().sum()}\n")

print("--- Categorical Columns ---")
cat_cols = df.select_dtypes(include=['object']).columns
for c in cat_cols:
    unique_vals = df[c].nunique()
    print(f"{c}: {unique_vals} unique values")
    if unique_vals <= 5:
        print(f"  {df[c].unique()}")
print("\n")

print("--- Numerical Columns ---")
num_cols = df.select_dtypes(include=[np.number]).columns
print(df[num_cols].describe())
print("\n")

print("--- Churn Distribution ---")
print(df['Churn'].value_counts(normalize=True))
print("\n")

# Save sample
os.makedirs(sample_data_dir, exist_ok=True)
sample_df = df.sample(n=500, random_state=42)
sample_df.to_csv(sample_data_path, index=False)
print(f"Sample dataset saved to {sample_data_path} (shape: {sample_df.shape})")
