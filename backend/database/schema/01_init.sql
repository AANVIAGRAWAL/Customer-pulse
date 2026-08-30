-- CustomerPulse MySQL Database Schema
-- Designed for normalized customer churn analytics

-- 1. Customers Dimension Table (Demographics)
CREATE TABLE IF NOT EXISTS dim_customers (
    customerID VARCHAR(20) PRIMARY KEY,
    gender VARCHAR(10) NOT NULL,
    SeniorCitizen INT NOT NULL,
    Partner VARCHAR(5) NOT NULL,
    Dependents VARCHAR(5) NOT NULL,
    INDEX idx_gender (gender),
    INDEX idx_senior (SeniorCitizen)
);

-- 2. Accounts Dimension Table (Billing and Contracts)
CREATE TABLE IF NOT EXISTS dim_accounts (
    customerID VARCHAR(20) PRIMARY KEY,
    Contract VARCHAR(50) NOT NULL,
    PaperlessBilling VARCHAR(5) NOT NULL,
    PaymentMethod VARCHAR(100) NOT NULL,
    INDEX idx_contract (Contract),
    INDEX idx_payment (PaymentMethod),
    FOREIGN KEY (customerID) REFERENCES dim_customers(customerID) ON DELETE CASCADE
);

-- 3. Services Dimension Table (Add-ons and Subscriptions)
CREATE TABLE IF NOT EXISTS dim_services (
    customerID VARCHAR(20) PRIMARY KEY,
    PhoneService VARCHAR(5) NOT NULL,
    MultipleLines VARCHAR(50) NOT NULL,
    InternetService VARCHAR(50) NOT NULL,
    OnlineSecurity VARCHAR(50) NOT NULL,
    OnlineBackup VARCHAR(50) NOT NULL,
    DeviceProtection VARCHAR(50) NOT NULL,
    TechSupport VARCHAR(50) NOT NULL,
    StreamingTV VARCHAR(50) NOT NULL,
    StreamingMovies VARCHAR(50) NOT NULL,
    INDEX idx_internet (InternetService),
    FOREIGN KEY (customerID) REFERENCES dim_customers(customerID) ON DELETE CASCADE
);

-- 4. Customer Metrics Fact Table (Continuous Numerical Values)
CREATE TABLE IF NOT EXISTS fact_customer_metrics (
    customerID VARCHAR(20) PRIMARY KEY,
    tenure INT NOT NULL,
    MonthlyCharges DECIMAL(10, 2) NOT NULL,
    TotalCharges DECIMAL(12, 2) NOT NULL,
    AvgMonthlyCharge DECIMAL(10, 2) NOT NULL,
    TotalServices INT NOT NULL,
    INDEX idx_tenure (tenure),
    FOREIGN KEY (customerID) REFERENCES dim_customers(customerID) ON DELETE CASCADE
);

-- 5. Churn Target & Analytics Fact Table
CREATE TABLE IF NOT EXISTS fact_churn (
    customerID VARCHAR(20) PRIMARY KEY,
    Churn VARCHAR(5) NOT NULL,
    Churn_Label INT NOT NULL,
    TenureGroup VARCHAR(20) NOT NULL,
    HighRisk_Heuristic INT NOT NULL,
    INDEX idx_churn_label (Churn_Label),
    INDEX idx_high_risk (HighRisk_Heuristic),
    FOREIGN KEY (customerID) REFERENCES dim_customers(customerID) ON DELETE CASCADE
);
