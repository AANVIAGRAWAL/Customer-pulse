# Database Design

## Overview
The database schema for `CustomerPulse` is designed using a Star Schema-like normalized structure suitable for analytics and business intelligence (BI) workloads. It revolves around the central `customerID` acting as the Primary Key linking multiple dimension and fact tables.

## Schema Layout

### 1. `dim_customers` (Demographics Dimension)
Stores static/demographic attributes of the customer.
- **PK**: `customerID`
- **Columns**: `gender`, `SeniorCitizen`, `Partner`, `Dependents`
- **Indexes**: `idx_gender`, `idx_senior`

### 2. `dim_accounts` (Accounts & Billing Dimension)
Stores contract and payment method properties.
- **PK**: `customerID` (FK to `dim_customers`)
- **Columns**: `Contract`, `PaperlessBilling`, `PaymentMethod`
- **Indexes**: `idx_contract`, `idx_payment`

### 3. `dim_services` (Services Dimension)
Stores Boolean/categorical indicators of all add-on services.
- **PK**: `customerID` (FK to `dim_customers`)
- **Columns**: `PhoneService`, `MultipleLines`, `InternetService`, `OnlineSecurity`, `OnlineBackup`, `DeviceProtection`, `TechSupport`, `StreamingTV`, `StreamingMovies`
- **Indexes**: `idx_internet`

### 4. `fact_customer_metrics` (Financials/Metrics Fact)
Stores all continuous numeric data related to the customer's financial value and lifetime.
- **PK**: `customerID` (FK to `dim_customers`)
- **Columns**: `tenure`, `MonthlyCharges`, `TotalCharges`, `AvgMonthlyCharge`, `TotalServices`
- **Indexes**: `idx_tenure`

### 5. `fact_churn` (Analytics & Target Fact)
Stores the target variables and analytical heuristics computed during data processing.
- **PK**: `customerID` (FK to `dim_customers`)
- **Columns**: `Churn`, `Churn_Label`, `TenureGroup`, `HighRisk_Heuristic`
- **Indexes**: `idx_churn_label`, `idx_high_risk`

## Relationships
All tables maintain a **1-to-1 relationship** using `customerID` as both the Primary Key and Foreign Key pointing back to `dim_customers(customerID)`. 
- `ON DELETE CASCADE` ensures that removing a customer from the demographics table automatically purges their billing, services, and analytics records.
- This vertical partitioning ensures fast querying for specific analytics (e.g., pulling only the `fact_churn` and `fact_customer_metrics` tables for machine learning modeling without loading heavy categorical text columns).
