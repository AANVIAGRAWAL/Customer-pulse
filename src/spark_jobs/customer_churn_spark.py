import os
import pandas as pd
from pyspark.sql.functions import col, when, count, avg, sum as spark_sum, round as spark_round
from pyspark.sql.types import FloatType
from spark_config import get_spark_session

def run_spark_job():
    print("=" * 50)
    print("CUSTOMERPULSE PYSPARK JOB")
    print("=" * 50)

    # 1. Initialize SparkSession
    spark = get_spark_session()
    print(f"\nSpark version:\n{spark.version}")

    # 2. Dataset Loading (Using Pandas to bypass Hadoop Java 25 UGI getSubject error)
    input_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/raw/WA_Fn-UseC_-Telco-Customer-Churn.csv'))
    print(f"\nInput:\n{input_path}")
    
    if not os.path.exists(input_path):
        print(f"ERROR: Dataset not found at {input_path}")
        spark.stop()
        return

    pdf = pd.read_csv(input_path)
    df = spark.createDataFrame(pdf)

    # 3. Schema & Counts
    total_rows = df.count()
    total_cols = len(df.columns)
    print(f"\nRows:\n{total_rows}")
    print(f"\nColumns:\n{total_cols}")

    # 4. Duplicate Check
    distinct_customers = df.select("customerID").distinct().count()
    duplicates = total_rows - distinct_customers
    print(f"\nDuplicate customer IDs:\n{duplicates}")

    # 5. Data Cleaning (TotalCharges is usually a string with some spaces)
    df = df.withColumn("TotalCharges", 
                       when(col("TotalCharges") == " ", None)
                       .otherwise(col("TotalCharges")).cast(FloatType()))
    
    # 6. Null Analysis
    null_counts = {}
    for c in df.columns:
        null_val = df.filter(col(c).isNull()).count()
        if null_val > 0:
            null_counts[c] = null_val
    print(f"\nNull summary:\n{null_counts if null_counts else 'No nulls found'}")
    
    # Drop rows with nulls for clean analysis (mimicking typical DB load)
    df_clean = df.dropna()

    # 7. Transformations
    # Add numerical churn indicator for easy math (1 for Yes, 0 for No)
    df_clean = df_clean.withColumn("ChurnNumeric", when(col("Churn") == "Yes", 1.0).otherwise(0.0))

    # Add TenureGroup
    df_clean = df_clean.withColumn(
        "TenureGroup",
        when(col("tenure") <= 12, "0-1 Year")
        .when((col("tenure") > 12) & (col("tenure") <= 24), "1-2 Years")
        .when((col("tenure") > 24) & (col("tenure") <= 48), "2-4 Years")
        .when((col("tenure") > 48) & (col("tenure") <= 60), "4-5 Years")
        .otherwise("5+ Years")
    )

    # 8. Analytical Aggregations
    
    # Churn Distribution
    churn_dist = df_clean.groupBy("Churn").count().orderBy("Churn")
    print("\nChurn distribution:")
    churn_dist.show(truncate=False)

    def print_churn_by_feature(feature_name, title):
        agg_df = df_clean.groupBy(feature_name).agg(
            spark_round((spark_sum("ChurnNumeric") / count("*")) * 100, 2).alias("ChurnRatePct")
        ).orderBy("ChurnRatePct", ascending=False)
        print(f"\n{title}:")
        agg_df.show(truncate=False)
        return agg_df

    # Contract Churn
    contract_churn_df = print_churn_by_feature("Contract", "Contract churn")

    # Internet Churn
    internet_churn_df = print_churn_by_feature("InternetService", "Internet churn")

    # Tenure Churn
    tenure_churn_df = print_churn_by_feature("TenureGroup", "Tenure churn")

    # 9. Spark SQL Validation
    df_clean.createOrReplaceTempView("customer_churn")
    print("\nSpark SQL Average MonthlyCharges by Churn status:")
    sql_result = spark.sql("""
        SELECT 
            Churn, 
            ROUND(AVG(MonthlyCharges), 2) as AvgMonthlyCharges,
            ROUND(AVG(tenure), 2) as AvgTenure
        FROM customer_churn 
        GROUP BY Churn
    """)
    sql_result.show()

    # 10. Output Writing (Using Pandas to bypass Hadoop FileSystem write error)
    output_base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/processed/spark'))
    print(f"\nOutput:\nWriting analytical data to {output_base_dir} ...")
    
    try:
        os.makedirs(output_base_dir, exist_ok=True)
        # Write to Parquet using Pandas
        contract_churn_df.toPandas().to_parquet(os.path.join(output_base_dir, "churn_by_contract.parquet"), index=False)
        internet_churn_df.toPandas().to_parquet(os.path.join(output_base_dir, "churn_by_internet.parquet"), index=False)
        tenure_churn_df.toPandas().to_parquet(os.path.join(output_base_dir, "churn_by_tenure.parquet"), index=False)
        print("Success! Parquet outputs written.")
    except Exception as e:
        print(f"Failed to write parquet outputs: {e}")

    # 11. Cleanup
    spark.stop()
    print("\n" + "=" * 50)
    print("SPARK JOB COMPLETED")
    print("=" * 50)

if __name__ == "__main__":
    run_spark_job()
