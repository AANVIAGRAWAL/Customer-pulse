# CustomerPulse

CustomerPulse is a full-stack Customer Churn & Risk Analytics platform. It integrates a machine-learning backend with a dynamic React frontend to predict customer churn, identify at-risk segments, and deliver actionable business insights.

## Tech Stack
- **Database:** MySQL
- **Backend API:** Python / Flask
- **Machine Learning:** Scikit-Learn (Logistic Regression Pipeline)
- **Data Engineering:** PySpark (Distributed Analytics Validation) & Pandas
- **Frontend:** React + Vite + TypeScript
- **Styling:** Vanilla CSS + Lucide Icons
- **Charting:** Recharts

## Project Structure
- `/data/`: Raw and processed datasets (including PySpark parquet outputs).
- `/backend/`: Flask API routes, ML models, and analytics services.
- `/frontend/`: React components, pages, and services.
- `/src/spark_jobs/`: PySpark distributed data engineering validation pipeline.
- `/analytics/`: Core Pandas/SQL pre-processing scripts.

## Running the Project
1. Start the backend: `cd backend && python app.py`
2. Start the frontend: `cd frontend && npm run dev`
3. Run the PySpark validation: `python src/spark_jobs/customer_churn_spark.py`
