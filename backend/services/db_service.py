import sys
import os

# Safely import the existing database connection module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db_connection import get_db_connection

def get_engine():
    """Returns the SQLAlchemy engine configured in Phase 3"""
    engine = get_db_connection()
    if not engine:
        raise RuntimeError("Database connection failed. Ensure .env is properly configured.")
    return engine
