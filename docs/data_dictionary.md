# Customer Pulse - Data Dictionary

This document contains the data dictionary for the primary customer dataset based on exploratory data analysis (EDA).

## Dataset Overview
- **Rows**: 7043
- **Columns**: 21
- **Missing Values**: 11 values missing in `TotalCharges` (after forcing numeric coercion). All other columns have 0 missing values.
- **Duplicate Rows**: 0

## Columns Detailed Breakdown

### Identifiers
- **`customerID`** *(object)*: Unique alphanumeric identifier for each customer.

### Customer Demographics
- **`gender`** *(object)*: Customer gender (`Female`, `Male`).
- **`SeniorCitizen`** *(int64)*: Indicates if the customer is a senior citizen (`0` = No, `1` = Yes).
- **`Partner`** *(object)*: Indicates if the customer has a partner (`Yes`, `No`).
- **`Dependents`** *(object)*: Indicates if the customer has dependents (`Yes`, `No`).

### Account Information
- **`tenure`** *(int64)*: Number of months the customer has stayed with the company. Minimum is 0, maximum is 72 months.
- **`Contract`** *(object)*: The contract term of the customer (`Month-to-month`, `One year`, `Two year`).
- **`PaperlessBilling`** *(object)*: Indicates if the customer uses paperless billing (`Yes`, `No`).
- **`PaymentMethod`** *(object)*: The customer's payment method (`Electronic check`, `Mailed check`, `Bank transfer (automatic)`, `Credit card (automatic)`).

### Service Usage
- **`PhoneService`** *(object)*: Indicates if the customer has a phone service (`No`, `Yes`).
- **`MultipleLines`** *(object)*: Indicates if the customer has multiple lines (`No phone service`, `No`, `Yes`).
- **`InternetService`** *(object)*: Customer's internet service provider (`DSL`, `Fiber optic`, `No`).
- **`OnlineSecurity`** *(object)*: Indicates if the customer has online security (`No`, `Yes`, `No internet service`).
- **`OnlineBackup`** *(object)*: Indicates if the customer has online backup (`Yes`, `No`, `No internet service`).
- **`DeviceProtection`** *(object)*: Indicates if the customer has device protection (`No`, `Yes`, `No internet service`).
- **`TechSupport`** *(object)*: Indicates if the customer has tech support (`No`, `Yes`, `No internet service`).
- **`StreamingTV`** *(object)*: Indicates if the customer has streaming TV (`No`, `Yes`, `No internet service`).
- **`StreamingMovies`** *(object)*: Indicates if the customer has streaming movies (`No`, `Yes`, `No internet service`).

### Billing Information
- **`MonthlyCharges`** *(float64)*: The amount charged to the customer monthly. Range: $18.25 - $118.75.
- **`TotalCharges`** *(object/float64)*: The total amount charged to the customer over their entire tenure. Contains 11 hidden missing values (blank spaces) that result in NaNs when cast to numeric. Range: $18.80 - $8684.80.

### Target Variable
- **`Churn`** *(object)*: Indicates whether the customer churned (`No`, `Yes`). 
  - **Class Distribution**:
    - No (Retained): 73.46%
    - Yes (Churned): 26.54%
