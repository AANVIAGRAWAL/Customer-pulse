import sys
import os
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_connection import get_db_connection

def verify_data():
    engine = get_db_connection()
    if not engine:
        return
        
    with engine.connect() as conn:
        print("\n--- 9. ROW COUNTS ---")
        tables = ['dim_customers', 'dim_accounts', 'dim_services', 'fact_customer_metrics', 'fact_churn']
        for table in tables:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            print(f"{table}: {result} rows")

        print("\n--- 10 & 11. MATCHING IDs & ORPHAN RECORDS ---")
        # Check for orphans in child tables (IDs not in dim_customers)
        orphan_queries = [
            ("dim_accounts", "SELECT COUNT(*) FROM dim_accounts WHERE customerID NOT IN (SELECT customerID FROM dim_customers)"),
            ("dim_services", "SELECT COUNT(*) FROM dim_services WHERE customerID NOT IN (SELECT customerID FROM dim_customers)"),
            ("fact_metrics", "SELECT COUNT(*) FROM fact_customer_metrics WHERE customerID NOT IN (SELECT customerID FROM dim_customers)"),
            ("fact_churn", "SELECT COUNT(*) FROM fact_churn WHERE customerID NOT IN (SELECT customerID FROM dim_customers)")
        ]
        
        for name, query in orphan_queries:
            orphans = conn.execute(text(query)).scalar()
            print(f"Orphan records in {name}: {orphans}")

        print("\n--- 12. DUPLICATE CUSTOMER IDs ---")
        dup_query = """
        SELECT customerID, COUNT(*) 
        FROM dim_customers 
        GROUP BY customerID 
        HAVING COUNT(*) > 1
        """
        duplicates = conn.execute(text(dup_query)).fetchall()
        if not duplicates:
            print("No duplicate customer IDs found in dim_customers.")
        else:
            print(f"Found {len(duplicates)} duplicate customer IDs!")

        print("\n--- 13. REPRESENTATIVE QUERIES ---")
        
        print("\nQuery 1: High Risk Customers (Month-to-month + Fiber optic) with Churn = Yes")
        q1 = """
        SELECT c.gender, f.Churn_Label, COUNT(*) as count 
        FROM dim_customers c
        JOIN fact_churn f ON c.customerID = f.customerID
        WHERE f.HighRisk_Heuristic = 1 AND f.Churn = 'Yes'
        GROUP BY c.gender, f.Churn_Label
        """
        res1 = conn.execute(text(q1)).fetchall()
        for row in res1:
            print(f"Gender: {row[0]}, Churned: {row[2]}")

        print("\nQuery 2: Average Monthly Charges by Contract Type")
        q2 = """
        SELECT a.Contract, ROUND(AVG(m.MonthlyCharges), 2) as avg_charge
        FROM dim_accounts a
        JOIN fact_customer_metrics m ON a.customerID = m.customerID
        GROUP BY a.Contract
        ORDER BY avg_charge DESC
        """
        res2 = conn.execute(text(q2)).fetchall()
        for row in res2:
            print(f"Contract: {row[0]}, Avg Charge: ${row[1]}")

        print("\nQuery 3: Churn Rate by Internet Service")
        q3 = """
        SELECT s.InternetService, 
               ROUND(SUM(f.Churn_Label) / COUNT(*) * 100, 2) as churn_rate_percentage
        FROM dim_services s
        JOIN fact_churn f ON s.customerID = f.customerID
        GROUP BY s.InternetService
        ORDER BY churn_rate_percentage DESC
        """
        res3 = conn.execute(text(q3)).fetchall()
        for row in res3:
            print(f"Internet: {row[0]}, Churn Rate: {row[1]}%")

if __name__ == "__main__":
    verify_data()
