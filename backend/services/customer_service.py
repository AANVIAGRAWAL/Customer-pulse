from sqlalchemy import text
from backend.services.db_service import get_engine

class CustomerService:
    @staticmethod
    def get_customers(page=1, limit=10, search=None, churn=None, contract=None, internet=None):
        engine = get_engine()
        offset = (page - 1) * limit
        
        base_query = """
            FROM dim_customers c
            JOIN dim_accounts a ON c.customerID = a.customerID
            JOIN dim_services s ON c.customerID = s.customerID
            JOIN fact_customer_metrics m ON c.customerID = m.customerID
            JOIN fact_churn f ON c.customerID = f.customerID
            WHERE 1=1
        """
        
        params = {}
        if search:
            base_query += " AND c.customerID LIKE :search"
            params['search'] = f"%{search}%"
        if churn and churn != 'All':
            base_query += " AND f.Churn = :churn"
            params['churn'] = churn
        if contract and contract != 'All':
            base_query += " AND a.Contract = :contract"
            params['contract'] = contract
        if internet and internet != 'All':
            base_query += " AND s.InternetService = :internet"
            params['internet'] = internet

        count_query = "SELECT COUNT(*) " + base_query
        data_query = """
            SELECT c.customerID, c.gender, m.tenure, a.Contract, s.InternetService, m.MonthlyCharges, f.Churn
        """ + base_query + " LIMIT :limit OFFSET :offset"
        
        params['limit'] = limit
        params['offset'] = offset

        with engine.connect() as conn:
            total = conn.execute(text(count_query), params).scalar()
            rows = conn.execute(text(data_query), params).fetchall()
            
            data = [
                {
                    "customerID": row[0],
                    "gender": row[1],
                    "tenure": row[2],
                    "Contract": row[3],
                    "InternetService": row[4],
                    "MonthlyCharges": float(row[5]),
                    "Churn": row[6]
                } for row in rows
            ]
            
            return {
                "total": total,
                "page": page,
                "limit": limit,
                "data": data
            }

    @staticmethod
    def get_customer_by_id(customer_id):
        engine = get_engine()
        query = """
            SELECT 
                c.gender, c.SeniorCitizen, c.Partner, c.Dependents,
                a.Contract, a.PaperlessBilling, a.PaymentMethod,
                s.PhoneService, s.MultipleLines, s.InternetService, s.OnlineSecurity, 
                s.OnlineBackup, s.DeviceProtection, s.TechSupport, s.StreamingTV, s.StreamingMovies,
                m.tenure, m.MonthlyCharges, m.TotalCharges, m.AvgMonthlyCharge, m.TotalServices,
                f.Churn, f.TenureGroup,
                p.churn_probability, p.risk_level
            FROM dim_customers c
            JOIN dim_accounts a ON c.customerID = a.customerID
            JOIN dim_services s ON c.customerID = s.customerID
            JOIN fact_customer_metrics m ON c.customerID = m.customerID
            JOIN fact_churn f ON c.customerID = f.customerID
            LEFT JOIN churn_predictions p ON c.customerID = p.customerID
            WHERE c.customerID = :customer_id
        """
        with engine.connect() as conn:
            row = conn.execute(text(query), {"customer_id": customer_id}).fetchone()
            if not row:
                return None
            
            return {
                "customerID": customer_id,
                "demographics": {
                    "gender": row[0],
                    "SeniorCitizen": row[1],
                    "Partner": row[2],
                    "Dependents": row[3]
                },
                "account": {
                    "Contract": row[4],
                    "PaperlessBilling": row[5],
                    "PaymentMethod": row[6]
                },
                "services": {
                    "PhoneService": row[7],
                    "MultipleLines": row[8],
                    "InternetService": row[9],
                    "OnlineSecurity": row[10],
                    "OnlineBackup": row[11],
                    "DeviceProtection": row[12],
                    "TechSupport": row[13],
                    "StreamingTV": row[14],
                    "StreamingMovies": row[15]
                },
                "financial_metrics": {
                    "tenure": row[16],
                    "MonthlyCharges": float(row[17]),
                    "TotalCharges": float(row[18]),
                    "AvgMonthlyCharge": float(row[19]),
                    "TotalServices": row[20]
                },
                "churn_status": {
                    "Churn": row[21],
                    "TenureGroup": row[22]
                },
                "risk": {
                    "churn_probability": float(row[23]) if row[23] is not None else None,
                    "risk_level": row[24]
                } if row[23] is not None else None
            }

    @staticmethod
    def get_at_risk(page=1, limit=10, risk_level=None):
        engine = get_engine()
        offset = (page - 1) * limit
        
        base_query = """
            FROM churn_predictions p
            JOIN dim_customers c ON p.customerID = c.customerID
            JOIN fact_customer_metrics m ON c.customerID = m.customerID
            WHERE 1=1
        """
        
        params = {}
        if risk_level and risk_level != 'All':
            base_query += " AND p.risk_level = :risk_level"
            params['risk_level'] = risk_level
            
        count_query = "SELECT COUNT(*) " + base_query
        data_query = """
            SELECT p.customerID, p.churn_probability, p.risk_level, 
                   c.gender, m.tenure, m.MonthlyCharges, p.prediction_timestamp
        """ + base_query + " ORDER BY p.churn_probability DESC LIMIT :limit OFFSET :offset"
        
        params['limit'] = limit
        params['offset'] = offset
        
        with engine.connect() as conn:
            total = conn.execute(text(count_query), params).scalar()
            rows = conn.execute(text(data_query), params).fetchall()
            
            data = [
                {
                    "customerID": row[0],
                    "churn_probability": float(row[1]),
                    "risk_level": row[2],
                    "gender": row[3],
                    "tenure": int(row[4]),
                    "MonthlyCharges": float(row[5]),
                    "prediction_timestamp": row[6].isoformat() if row[6] else None
                } for row in rows
            ]
            
            return {
                "total": total,
                "page": page,
                "limit": limit,
                "data": data
            }

customer_service = CustomerService()
