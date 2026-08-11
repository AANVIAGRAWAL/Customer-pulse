import os
import sys
from sqlalchemy import text
import pandas as pd

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database.db_connection import get_db_connection

def run_analytics():
    engine = get_db_connection()
    if not engine:
        return

    queries = {
        "Executive KPIs - Customer Counts": """
            SELECT 
                COUNT(customerID) AS total_customers,
                SUM(Churn_Label) AS churned_customers,
                COUNT(customerID) - SUM(Churn_Label) AS retained_customers,
                ROUND(SUM(Churn_Label) / COUNT(customerID) * 100, 2) AS churn_rate_pct,
                ROUND(100 - (SUM(Churn_Label) / COUNT(customerID) * 100), 2) AS retention_rate_pct
            FROM fact_churn;
        """,
        "Executive KPIs - Financials": """
            SELECT 
                ROUND(AVG(MonthlyCharges), 2) AS avg_monthly_charge,
                ROUND(SUM(TotalCharges), 2) AS total_lifetime_revenue,
                ROUND(SUM(CASE WHEN c.Churn_Label = 1 THEN m.TotalCharges ELSE 0 END), 2) AS lost_revenue,
                ROUND(SUM(CASE WHEN c.Churn_Label = 0 THEN m.TotalCharges ELSE 0 END), 2) AS retained_revenue
            FROM fact_customer_metrics m
            JOIN fact_churn c ON m.customerID = c.customerID;
        """,
        "Churn Analysis - By Contract": """
            SELECT 
                a.Contract,
                COUNT(f.customerID) AS total_customers,
                SUM(f.Churn_Label) AS churned_customers,
                ROUND(SUM(f.Churn_Label) / COUNT(f.customerID) * 100, 2) AS churn_rate_pct
            FROM dim_accounts a
            JOIN fact_churn f ON a.customerID = f.customerID
            GROUP BY a.Contract
            ORDER BY churn_rate_pct DESC;
        """,
        "Churn Analysis - By Tenure Group": """
            SELECT 
                f.TenureGroup,
                COUNT(f.customerID) AS total_customers,
                SUM(f.Churn_Label) AS churned_customers,
                ROUND(SUM(f.Churn_Label) / COUNT(f.customerID) * 100, 2) AS churn_rate_pct
            FROM fact_churn f
            GROUP BY f.TenureGroup
            ORDER BY churn_rate_pct DESC;
        """,
        "Customer Behavior - Support Patterns": """
            SELECT 
                s.TechSupport,
                COUNT(f.customerID) AS total_customers,
                ROUND(SUM(f.Churn_Label) / COUNT(f.customerID) * 100, 2) AS churn_rate_pct
            FROM dim_services s
            JOIN fact_churn f ON s.customerID = f.customerID
            WHERE s.InternetService != 'No'
            GROUP BY s.TechSupport
            ORDER BY churn_rate_pct DESC;
        """,
        "Customer Behavior - Avg Tenure & Services": """
            SELECT 
                Churn,
                ROUND(AVG(m.tenure), 1) AS avg_tenure_months,
                ROUND(AVG(m.TotalServices), 1) AS avg_add_on_services
            FROM fact_churn c
            JOIN fact_customer_metrics m ON c.customerID = m.customerID
            GROUP BY Churn;
        """,
        "High-Value Churn - Revenue Lost by Segment": """
            SELECT 
                a.Contract,
                s.InternetService,
                COUNT(f.customerID) AS total_group_size,
                SUM(f.Churn_Label) AS churned_customers,
                ROUND(SUM(f.Churn_Label) / COUNT(f.customerID) * 100, 2) AS churn_rate_pct,
                ROUND(SUM(CASE WHEN f.Churn_Label = 1 THEN m.TotalCharges ELSE 0 END), 2) AS revenue_lost_to_churn
            FROM fact_churn f
            JOIN dim_accounts a ON f.customerID = a.customerID
            JOIN dim_services s ON f.customerID = s.customerID
            JOIN fact_customer_metrics m ON f.customerID = m.customerID
            GROUP BY a.Contract, s.InternetService
            HAVING total_group_size > 100
            ORDER BY revenue_lost_to_churn DESC
            LIMIT 5;
        """,
        "Segmentation Inputs - Value Tiers": """
            WITH RankedCustomers AS (
                SELECT 
                    c.customerID,
                    m.tenure,
                    m.MonthlyCharges,
                    m.TotalCharges,
                    a.Contract,
                    f.Churn,
                    NTILE(4) OVER (ORDER BY m.TotalCharges ASC) AS revenue_quartile
                FROM dim_customers c
                JOIN fact_customer_metrics m ON c.customerID = m.customerID
                JOIN dim_accounts a ON c.customerID = a.customerID
                JOIN fact_churn f ON c.customerID = f.customerID
            )
            SELECT 
                CASE 
                    WHEN revenue_quartile = 4 THEN 'Platinum'
                    WHEN revenue_quartile = 3 THEN 'Gold'
                    WHEN revenue_quartile = 2 THEN 'Silver'
                    ELSE 'Bronze'
                END AS value_tier,
                Contract,
                Churn,
                COUNT(customerID) as customer_count,
                ROUND(AVG(tenure), 1) as avg_tenure,
                ROUND(AVG(MonthlyCharges), 2) as avg_monthly
            FROM RankedCustomers
            GROUP BY value_tier, Contract, Churn
            ORDER BY FIELD(value_tier, 'Platinum', 'Gold', 'Silver', 'Bronze'), customer_count DESC;
        """
    }

    with engine.connect() as conn:
        for name, query in queries.items():
            print(f"\n{'='*50}\n{name}\n{'='*50}")
            df = pd.read_sql(text(query), conn)
            print(df.to_string(index=False))

if __name__ == "__main__":
    run_analytics()
