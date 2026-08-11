from sqlalchemy import text
from backend.services.db_service import get_engine

class AnalyticsService:
    @staticmethod
    def get_dashboard_kpis():
        engine = get_engine()
        with engine.connect() as conn:
            # Reusing Phase 4 SQL
            res1 = conn.execute(text("""
                SELECT 
                    COUNT(customerID) AS total_customers,
                    SUM(Churn_Label) AS churned_customers,
                    COUNT(customerID) - SUM(Churn_Label) AS retained_customers,
                    ROUND(SUM(Churn_Label) / COUNT(customerID) * 100, 2) AS churn_rate_pct,
                    ROUND(100 - (SUM(Churn_Label) / COUNT(customerID) * 100), 2) AS retention_rate_pct
                FROM fact_churn;
            """)).fetchone()
            
            res2 = conn.execute(text("""
                SELECT 
                    ROUND(AVG(MonthlyCharges), 2) AS avg_monthly_charge,
                    ROUND(SUM(TotalCharges), 2) AS total_lifetime_revenue,
                    ROUND(SUM(CASE WHEN c.Churn_Label = 1 THEN m.TotalCharges ELSE 0 END), 2) AS lost_revenue,
                    ROUND(SUM(CASE WHEN c.Churn_Label = 0 THEN m.TotalCharges ELSE 0 END), 2) AS retained_revenue
                FROM fact_customer_metrics m
                JOIN fact_churn c ON m.customerID = c.customerID;
            """)).fetchone()

            return {
                "total_customers": int(res1[0]),
                "churned_customers": int(res1[1]),
                "retained_customers": int(res1[2]),
                "churn_rate": float(res1[3]),
                "retention_rate": float(res1[4]),
                "average_monthly_charges": float(res2[0]),
                "total_revenue": float(res2[1]),
                "revenue_lost_to_churn": float(res2[2])
            }

    @staticmethod
    def get_churn_analysis():
        engine = get_engine()
        with engine.connect() as conn:
            # Churn by contract
            contract_res = conn.execute(text("""
                SELECT a.Contract, COUNT(f.customerID) as total, ROUND(SUM(f.Churn_Label) / COUNT(*) * 100, 2) as churn_rate
                FROM dim_accounts a JOIN fact_churn f ON a.customerID = f.customerID
                GROUP BY a.Contract
            """)).fetchall()
            
            # Churn by Internet
            internet_res = conn.execute(text("""
                SELECT s.InternetService, COUNT(f.customerID) as total, ROUND(SUM(f.Churn_Label) / COUNT(*) * 100, 2) as churn_rate
                FROM dim_services s JOIN fact_churn f ON s.customerID = f.customerID
                GROUP BY s.InternetService
            """)).fetchall()

            # Churn by Tenure Group
            tenure_res = conn.execute(text("""
                SELECT f.TenureGroup, COUNT(f.customerID) as total, ROUND(SUM(f.Churn_Label) / COUNT(*) * 100, 2) as churn_rate
                FROM fact_churn f
                GROUP BY f.TenureGroup
            """)).fetchall()

            return {
                "churn_by_contract": [{"contract": row[0], "total": int(row[1]), "churn_rate": float(row[2])} for row in contract_res],
                "churn_by_internet": [{"internet": row[0], "total": int(row[1]), "churn_rate": float(row[2])} for row in internet_res],
                "churn_by_tenure": [{"tenure_group": row[0], "total": int(row[1]), "churn_rate": float(row[2])} for row in tenure_res]
            }

    @staticmethod
    def get_segments():
        engine = get_engine()
        with engine.connect() as conn:
            # Reusing the Value Tier segmentation from Phase 4
            res = conn.execute(text("""
                WITH RankedCustomers AS (
                    SELECT 
                        c.customerID, m.tenure, m.MonthlyCharges, m.TotalCharges, a.Contract, f.Churn,
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
                    COUNT(customerID) as customer_count,
                    ROUND(AVG(tenure), 1) as avg_tenure,
                    ROUND(AVG(MonthlyCharges), 2) as avg_monthly,
                    ROUND(SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as churn_rate
                FROM RankedCustomers
                GROUP BY value_tier
                ORDER BY FIELD(value_tier, 'Platinum', 'Gold', 'Silver', 'Bronze')
            """)).fetchall()
            
            return [{"value_tier": row[0], "customer_count": int(row[1]), "avg_tenure": float(row[2]), "avg_monthly": float(row[3]), "churn_rate": float(row[4])} for row in res]

    @staticmethod
    def get_insights():
        return [
            {
                "observed_pattern": "Customers on Month-to-month contracts churn at 42.7%, vs 2.8% for Two-year contracts.",
                "model_association": "Month-to-month contract is a strong positive predictor of churn (Coefficient: +0.537).",
                "business_recommendation": "Incentivize Month-to-month users to switch to 1-year contracts by offering introductory discounts."
            },
            {
                "observed_pattern": "Customers without Tech Support churned at 41.6%, while those with it churned at 15.1%.",
                "model_association": "Lack of Tech Support is associated with higher churn.",
                "business_recommendation": "Bundle Tech Support into lower-tier plans for free to increase product stickiness."
            }
        ]

analytics_service = AnalyticsService()
