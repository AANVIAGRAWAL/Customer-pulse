import os
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def get_db_connection():
    """
    Creates and returns a SQLAlchemy engine for the MySQL database.
    Configuration is loaded securely from environment variables.
    """
    user = os.environ.get('DB_USER')
    password = os.environ.get('DB_PASSWORD')
    host = os.environ.get('DB_HOST')
    port = os.environ.get('DB_PORT')
    database = os.environ.get('DB_NAME')
    
    if not all([user, host, port, database]):
        print("\n--- DATABASE CONFIGURATION ERROR ---")
        print("Missing required database environment variables.")
        return None
        
    # Using pymysql driver
    # Note: Password can be empty if properly configured in .env, but we never print it.
    connection_string = f"mysql+pymysql://{user}:{password or ''}@{host}:{port}/{database}"
    
    try:
        engine = create_engine(connection_string, pool_pre_ping=True)
        # Test connection
        with engine.connect() as conn:
            print("Successfully connected to MySQL database!")
        return engine
    except OperationalError as e:
        print(f"\n--- DATABASE CONNECTION ERROR ---")
        print(f"Could not connect to MySQL at {host}:{port}.")
        print("Please ensure MySQL is running and the credentials are correct.")
        print(f"Error Details: {e.orig}")
        return None
    except Exception as e:
        print(f"\n--- UNEXPECTED ERROR ---")
        print(str(e))
        return None

if __name__ == "__main__":
    # Test connection when run directly
    get_db_connection()
