# CustomerPulse API Contract

Base URL: `/api`

## Endpoints

### 1. System Health
`GET /health`
- **Description**: Verifies that the Flask backend is running.
- **Response** (200 OK):
  ```json
  {
    "status": "ok"
  }
  ```

### 2. Dashboard KPIs
`GET /dashboard`
- **Description**: Retrieves executive-level KPI metrics from the MySQL analytics schema.
- **Response** (200 OK):
  ```json
  {
    "total_customers": 7043,
    "churned_customers": 1869,
    "retained_customers": 5174,
    "churn_rate": 26.54,
    "retention_rate": 73.46,
    "average_monthly_charges": 64.76,
    "total_revenue": 16056168.7,
    "revenue_lost_to_churn": 2862926.9
  }
  ```

### 3. Customer List
`GET /customers`
- **Description**: Fetches paginated customer records.
- **Query Parameters**:
  - `page` (int, default=1)
  - `limit` (int, default=10)
  - `search` (string, optional) - filter by `customerID`.
  - `churn` (string, optional)
  - `contract` (string, optional)
  - `internet` (string, optional)
- **Response** (200 OK):
  ```json
  {
    "total": 7043,
    "page": 1,
    "limit": 10,
    "data": [
      {
        "customerID": "7590-VHVEG",
        "gender": "Female",
        "tenure": 1,
        "Contract": "Month-to-month",
        "InternetService": "DSL",
        "MonthlyCharges": 29.85,
        "Churn": "No"
      }
    ]
  }
  ```

### 4. Customer Details
`GET /customers/<customer_id>`
- **Description**: Retrieves full 360-degree data for a single customer.
- **Response** (200 OK):
  ```json
  {
    "customerID": "7590-VHVEG",
    "demographics": { "gender": "Female", "SeniorCitizen": 0, "Partner": "Yes", "Dependents": "No" },
    "account": { "Contract": "Month-to-month", "PaperlessBilling": "Yes", "PaymentMethod": "Electronic check" },
    "services": { "PhoneService": "No", "InternetService": "DSL", ... },
    "financial_metrics": { "tenure": 1, "MonthlyCharges": 29.85, ... },
    "churn_status": { "Churn": "No", "TenureGroup": "0-1 Year" }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: If the customerID doesn't exist.

### 5. At-Risk Customers
`GET /at-risk`
- **Description**: Fetches paginated customer records including their persisted ML churn probability.
- **Query Parameters**:
  - `page` (int, default=1)
  - `limit` (int, default=10)
  - `risk_level` (string, optional) - filter by `High`, `Medium`, or `Low`.
- **Response** (200 OK):
  ```json
  {
    "total": 7043,
    "page": 1,
    "limit": 10,
    "data": [
      {
        "customerID": "1234-ABCDE",
        "churn_probability": 0.852,
        "risk_level": "High",
        "gender": "Female",
        "tenure": 2,
        "MonthlyCharges": 105.0,
        "prediction_timestamp": "2026-08-11T19:21:00"
      }
    ]
  }
  ```

### 6. Churn Analysis
`GET /churn-analysis`
- **Description**: Breakdown of churn rates by contract, internet type, and tenure group.
- **Response** (200 OK):
  ```json
  {
    "churn_by_contract": [...],
    "churn_by_internet": [...],
    "churn_by_tenure": [...]
  }
  ```

### 7. Customer Segmentation
`GET /segments`
- **Description**: Returns Platinum, Gold, Silver, and Bronze value tiers based on `NTILE(4)`.
- **Response** (200 OK): Array of segmentation objects.

### 8. Analytical Insights
`GET /insights`
- **Description**: Returns verified business insights and recommendations (associations, not causation).
- **Response** (200 OK): Array of insight strings/objects.

### 9. ML Predict
`POST /predict`
- **Description**: Accepts customer features and returns their churn probability based on the saved Logistic Regression model.
- **Request Body**:
  JSON object containing exactly 21 required features matching the Phase 5 schema (e.g., `gender`, `tenure`, `MonthlyCharges`, etc.)
- **Response** (200 OK):
  ```json
  {
    "churn_probability": 0.5340,
    "risk_level": "Medium"
  }
  ```
- **Error Responses**:
  - `422 Unprocessable Entity`: If JSON body is missing required feature columns.

### 10. Data Upload
`POST /upload`
- **Description**: Accepts a CSV file for future ingestion. Currently only validates columns.
- **Form Data**: `file` (multipart/form-data)
- **Response** (200 OK):
  ```json
  {
    "status": "success",
    "message": "File validated successfully. Database insertion is disabled for safety.",
    "row_count": 5000
  }
  ```
- **Error Responses**:
  - `422 Unprocessable Entity`: If file is missing or invalid structure.
