import os
from pyspark.sql import SparkSession

def get_spark_session(app_name="CustomerPulse"):
    """
    Initializes and returns a local SparkSession.
    """
    # Fix for Java 24+ UnsupportedOperationException (getSubject)
    os.environ["SPARK_USER"] = "customerpulse_user"
    os.environ["SPARK_LOCAL_IP"] = "127.0.0.1"

    spark = SparkSession.builder \
        .appName(app_name) \
        .master("local[*]") \
        .config("spark.sql.shuffle.partitions", "4") \
        .getOrCreate()
        
    # Reduce Spark logging verbosity to clean up the console output
    spark.sparkContext.setLogLevel("WARN")
    
    return spark
