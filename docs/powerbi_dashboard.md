# Phase 10: Power BI Executive Dashboard Specification

## Overview & Platform Note
This document specifies the Power BI Executive Dashboard for the CustomerPulse project.

> [!WARNING]
> **macOS Platform Limitation:** Power BI Desktop is exclusively available on Windows. Because this project was developed on macOS, a `.pbix` file could not be natively authored. Instead, this specification provides the exact, production-ready blueprint (Data Extracts, DAX Measures, and UI Wireframes) required for an analyst to instantly assemble the dashboard on a Windows machine.

---

## 1. Data Source & Import Strategy
A fully unified, denormalized flat-file has been prepared specifically for Power BI ingestion to eliminate complex Power Query joins and optimize DAX evaluation context.

- **File Path**: `data/processed/powerbi/customerpulse_powerbi_export.csv`
- **Source**: Directly generated from the verified MySQL normalized schema via `analytics/powerbi/export_powerbi_data.py`.
- **Dimensions Included**: Customers, Services, Accounts, Churn Metrics, ML Predictions (`churn_probability`, `risk_level`).
- **Data Quality**: 7,043 rows (Verified). Zero orphan records.

### Power BI Import Steps
1. Open Power BI Desktop.
2. Click **Get Data** -> **Text/CSV**.
3. Select `customerpulse_powerbi_export.csv`.
4. Click **Load** (Data types are pre-formatted correctly; no Power Query transformations are necessary).

---

## 2. DAX Measures Dictionary
Do not hardcode values. Create a new Measure Table (e.g., `_Measures`) and define the following DAX expressions to dynamically calculate verified metrics.

### Executive KPIs
```dax
Total Customers = COUNTROWS('customerpulse_powerbi_export')

Churned Customers = CALCULATE([Total Customers], 'customerpulse_powerbi_export'[Churn] = "Yes")

Churn Rate = DIVIDE([Churned Customers], [Total Customers], 0)

Retention Rate = 1 - [Churn Rate]

Avg Monthly Charges = AVERAGE('customerpulse_powerbi_export'[MonthlyCharges])

Total Lifetime Revenue = SUM('customerpulse_powerbi_export'[TotalCharges])

Revenue Lost to Churn = CALCULATE([Total Lifetime Revenue], 'customerpulse_powerbi_export'[Churn] = "Yes")
```

### Segmentation (NTILE Logic Replication in DAX)
To replicate the SQL NTILE(4) tiering dynamically in Power BI (if not pre-calculated in the export):
```dax
Value Tier = 
VAR CustomerLTV = 'customerpulse_powerbi_export'[TotalCharges]
VAR P75 = PERCENTILE.EXC('customerpulse_powerbi_export'[TotalCharges], 0.75)
VAR P50 = PERCENTILE.EXC('customerpulse_powerbi_export'[TotalCharges], 0.50)
VAR P25 = PERCENTILE.EXC('customerpulse_powerbi_export'[TotalCharges], 0.25)
RETURN
SWITCH(
    TRUE(),
    CustomerLTV >= P75, "Platinum",
    CustomerLTV >= P50, "Gold",
    CustomerLTV >= P25, "Silver",
    "Bronze"
)
```

---

## 3. Dashboard Page Wireframes

### Page 1: Executive Overview
**Purpose**: High-level health of the subscriber base.
- **Top Row (Card Visuals)**: `Total Customers`, `Churn Rate`, `Avg Monthly Charges`, `Total Lifetime Revenue`, `Revenue Lost to Churn`.
- **Left Column**: Donut chart showing `Total Customers by Churn Status`.
- **Center**: Clustered column chart showing `Churn Rate by Contract`.
- **Right Column**: Clustered column chart showing `Churn Rate by InternetService`.

### Page 2: Churn Analysis
**Purpose**: Deep-dive into churn drivers.
- **Visual 1**: Line chart of `Churn Rate by TenureGroup` (Sort axis logically: 0-1 Year -> 5+ Years).
- **Visual 2**: Matrix visual crossing `Contract` (Rows) and `InternetService` (Columns) with `Churn Rate` as Values (Apply conditional formatting/heat map).
- **Visual 3**: Box plot (or Violin plot custom visual) of `MonthlyCharges by Churn`.

### Page 3: Customer Risk Dashboard
**Purpose**: ML prediction overview.
- **Top Row (Card Visuals)**: `Count of High Risk Customers`, `Count of Medium Risk Customers`, `Count of Low Risk Customers`.
- **Center**: Histogram of `churn_probability` (bins of 10%).
- **Bottom Left**: 100% Stacked Bar Chart of `Risk Level by Contract`.
- **Bottom Right**: Table visual listing top 100 Highest Risk Customers (Columns: `customerID`, `Risk Level`, `churn_probability`, `MonthlyCharges`).

### Page 4: Customer Segments
**Purpose**: Financial exposure by value tier.
- **Slicer**: `Value Tier` (Platinum, Gold, Silver, Bronze).
- **Visual 1**: Funnel chart of `Total Customers by Value Tier`.
- **Visual 2**: Scatter plot of `Avg Monthly Charges` (Y-axis) vs. `Avg Tenure` (X-axis), bubbled by `Value Tier`.
- **Visual 3**: Gauge chart for `Churn Rate` filtered by Tier.

### Page 5: Business Insights & Recommendations
**Purpose**: Textual presentation of statistical findings.
- Use the **Smart Narrative** visual or static Text Boxes.
- **Insight 1 (Contract)**: Month-to-month contracts represent severe financial exposure, carrying a ~42.7% churn rate.
- **Insight 2 (Internet)**: Fiber optic customers have significantly higher churn (~41.9%) than DSL, indicating potential service quality or pricing issues.
- **Insight 3 (Tenure)**: The highest risk window is the first 12 months (47% churn).
- **Insight 4 (Tech Support)**: Customers lacking Tech Support are statistically much more likely to churn (proven via Phase 9 Chi-Square analysis).

---

## 4. Interactive Filters (Global Slicers)
Place a collapsible filter pane on the left side of every page (synced across pages) containing:
1. `Contract` (Dropdown)
2. `InternetService` (Dropdown)
3. `TenureGroup` (Checkboxes)
4. `Risk Level` (Buttons)

---

## 5. Cross-Validation Baseline
When assembling the dashboard, check these measures against the visual output. If they do not match, check filter context.
- **Overall Churn Rate**: ~26.54%
- **Month-to-month Churn**: 42.71%
- **Total Customers**: 7,043
- **Lifetime Revenue**: ~$16.05M
- **0-1 Year Churn**: ~47%
