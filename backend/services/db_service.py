import sys
import os
import hashlib
from sqlalchemy import create_engine, text

# Safely import the existing database connection module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db_connection import get_db_connection

# In-memory engine cache
_sqlite_engines = {}

def get_user_db_path(email):
    """
    Computes a safe file path for the user's SQLite session database.
    """
    hashed_email = hashlib.sha256(email.encode('utf-8')).hexdigest()
    sessions_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
        'data', 'sessions'
    )
    os.makedirs(sessions_dir, exist_ok=True)
    return os.path.join(sessions_dir, f"{hashed_email}.db")

def create_sqlite_schema(engine):
    """
    Generates the exact relational Star Schema inside the user's SQLite database.
    """
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS dim_customers (
                customerID TEXT PRIMARY KEY,
                gender TEXT NOT NULL,
                SeniorCitizen INTEGER NOT NULL,
                Partner TEXT NOT NULL,
                Dependents TEXT NOT NULL
            );
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS dim_accounts (
                customerID TEXT PRIMARY KEY,
                Contract TEXT NOT NULL,
                PaperlessBilling TEXT NOT NULL,
                PaymentMethod TEXT NOT NULL,
                FOREIGN KEY (customerID) REFERENCES dim_customers(customerID) ON DELETE CASCADE
            );
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS dim_services (
                customerID TEXT PRIMARY KEY,
                PhoneService TEXT NOT NULL,
                MultipleLines TEXT NOT NULL,
                InternetService TEXT NOT NULL,
                OnlineSecurity TEXT NOT NULL,
                OnlineBackup TEXT NOT NULL,
                DeviceProtection TEXT NOT NULL,
                TechSupport TEXT NOT NULL,
                StreamingTV TEXT NOT NULL,
                StreamingMovies TEXT NOT NULL,
                FOREIGN KEY (customerID) REFERENCES dim_customers(customerID) ON DELETE CASCADE
            );
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS fact_customer_metrics (
                customerID TEXT PRIMARY KEY,
                tenure INTEGER NOT NULL,
                MonthlyCharges REAL NOT NULL,
                TotalCharges REAL NOT NULL,
                AvgMonthlyCharge REAL NOT NULL,
                TotalServices INTEGER NOT NULL,
                FOREIGN KEY (customerID) REFERENCES dim_customers(customerID) ON DELETE CASCADE
            );
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS fact_churn (
                customerID TEXT PRIMARY KEY,
                Churn TEXT NOT NULL,
                Churn_Label INTEGER NOT NULL,
                TenureGroup TEXT NOT NULL,
                HighRisk_Heuristic INTEGER NOT NULL,
                FOREIGN KEY (customerID) REFERENCES dim_customers(customerID) ON DELETE CASCADE
            );
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS churn_predictions (
                customerID TEXT PRIMARY KEY,
                churn_probability REAL,
                risk_level TEXT,
                model_version TEXT,
                prediction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customerID) REFERENCES dim_customers(customerID) ON DELETE CASCADE
            );
        """))
        conn.commit()

def user_has_data(email):
    """
    Checks if a user's SQLite session database exists and contains customer records.
    """
    db_path = get_user_db_path(email)
    if not os.path.exists(db_path):
        return False
        
    try:
        engine = create_engine(f"sqlite:///{db_path}")
        with engine.connect() as conn:
            # Check if dim_customers exists and has rows
            table_check = conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='dim_customers'"
            )).fetchone()
            if not table_check:
                return False
            
            count = conn.execute(text("SELECT COUNT(*) FROM dim_customers")).scalar()
            return count > 0
    except Exception:
        return False

def get_engine():
    """
    Dynamically returns the SQLAlchemy engine.
    If executing within a Flask request context with an active user_email session,
    it returns the SQLite session engine. Otherwise, it defaults to the MySQL database.
    """
    try:
        from flask import has_request_context, g
        if has_request_context() and hasattr(g, 'user_email') and g.user_email:
            email = g.user_email
            if email in _sqlite_engines:
                return _sqlite_engines[email]
                
            db_path = get_user_db_path(email)
            # check_same_thread=False is needed for multi-threaded SQLite usage in Flask
            engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
            create_sqlite_schema(engine)
            _sqlite_engines[email] = engine
            return engine
    except Exception as e:
        print(f"[DB SERVICE DEBUG] Fallback to MySQL due to: {e}")
        
    # Fallback to standard MySQL cloud engine
    engine = get_db_connection()
    if not engine:
        raise RuntimeError("Database connection failed. Ensure .env is properly configured.")
    return engine
