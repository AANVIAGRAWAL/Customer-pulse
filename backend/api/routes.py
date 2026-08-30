from flask import Blueprint, jsonify, request
from sqlalchemy import text
from backend.services.analytics_service import analytics_service
from backend.services.customer_service import customer_service
from backend.services.ml_service import ml_service
from backend.api.auth import token_required

api_bp = Blueprint('api', __name__)

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

@api_bp.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard():
    try:
        data = analytics_service.get_dashboard_kpis()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

@api_bp.route('/customers', methods=['GET'])
@token_required
def get_customers():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search')
        churn = request.args.get('churn')
        contract = request.args.get('contract')
        internet = request.args.get('internet')
        
        data = customer_service.get_customers(page, limit, search, churn, contract, internet)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

@api_bp.route('/customers/<customer_id>', methods=['GET'])
@token_required
def get_customer(customer_id):
    try:
        data = customer_service.get_customer_by_id(customer_id)
        if not data:
            return jsonify({"error": "Not Found", "message": "Customer not found"}), 404
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

@api_bp.route('/at-risk', methods=['GET'])
@token_required
def get_at_risk():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        risk_level = request.args.get('risk_level')
        
        data = customer_service.get_at_risk(page, limit, risk_level)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

@api_bp.route('/churn-analysis', methods=['GET'])
@token_required
def get_churn_analysis():
    try:
        data = analytics_service.get_churn_analysis()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

@api_bp.route('/segments', methods=['GET'])
@token_required
def get_segments():
    try:
        data = analytics_service.get_segments()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

@api_bp.route('/insights', methods=['GET'])
@token_required
def get_insights():
    try:
        data = analytics_service.get_insights()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

@api_bp.route('/predict', methods=['POST'])
@token_required
def predict_churn():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Unprocessable Entity", "message": "Missing JSON body"}), 422
            
        required_keys = ['gender', 'SeniorCitizen', 'Partner', 'Dependents', 'tenure', 
                         'PhoneService', 'MultipleLines', 'InternetService', 'OnlineSecurity', 
                         'OnlineBackup', 'DeviceProtection', 'TechSupport', 'StreamingTV', 
                         'StreamingMovies', 'Contract', 'PaperlessBilling', 'PaymentMethod', 
                         'MonthlyCharges', 'TotalCharges', 'AvgMonthlyCharge', 'TotalServices']
                         
        missing = [k for k in required_keys if k not in data]
        if missing:
            return jsonify({"error": "Unprocessable Entity", "message": f"Missing features: {missing}"}), 422
            
        prediction = ml_service.predict(data)
        return jsonify(prediction)
    except ValueError as e:
        return jsonify({"error": "Bad Request", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

@api_bp.route('/upload', methods=['POST'])
@token_required
def upload_csv():
    if 'file' not in request.files:
        return jsonify({"error": "Unprocessable Entity", "message": "No file part"}), 422
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Unprocessable Entity", "message": "No selected file"}), 422
        
    if not file.filename.endswith('.csv'):
        return jsonify({"error": "Unprocessable Entity", "message": "Only CSV files are allowed"}), 422
        
    try:
        import pandas as pd
        import numpy as np
        import datetime
        from backend.services.db_service import get_engine
        
        # 1. Parse CSV
        df = pd.read_csv(file)
        
        # 2. Validate columns
        expected_cols = [
            'customerID', 'gender', 'SeniorCitizen', 'Partner', 'Dependents',
            'tenure', 'PhoneService', 'MultipleLines', 'InternetService',
            'OnlineSecurity', 'OnlineBackup', 'DeviceProtection', 'TechSupport',
            'StreamingTV', 'StreamingMovies', 'Contract', 'PaperlessBilling',
            'PaymentMethod', 'MonthlyCharges', 'TotalCharges', 'Churn'
        ]
        missing = [c for c in expected_cols if c not in df.columns]
        if missing:
            return jsonify({"error": "Unprocessable Entity", "message": f"CSV is missing columns required by the ML model: {missing}"}), 422
            
        # 3. Clean & Preprocess Data
        df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
        df['TotalCharges'] = df['TotalCharges'].fillna(0)
        df = df.drop_duplicates()
        df['Churn_Label'] = df['Churn'].map({'Yes': 1, 'No': 0})
        
        # Generate calculated features
        df['AvgMonthlyCharge'] = np.where(df['tenure'] > 0, df['TotalCharges'] / df['tenure'], df['MonthlyCharges'])
        
        bins = [-1, 12, 24, 48, 60, 100]
        labels = ['0-1 Year', '1-2 Years', '2-4 Years', '4-5 Years', '5+ Years']
        df['TenureGroup'] = pd.cut(df['tenure'], bins=bins, labels=labels).astype(str)
        
        services = ['OnlineSecurity', 'OnlineBackup', 'DeviceProtection', 'TechSupport', 'StreamingTV', 'StreamingMovies']
        df['TotalServices'] = df[services].apply(lambda x: (x == 'Yes').sum(), axis=1)
        
        df['HighRisk_Heuristic'] = ((df['Contract'] == 'Month-to-month') & (df['InternetService'] == 'Fiber optic')).astype(int)
        
        # 4. Get private user engine
        engine = get_engine()
        
        # 5. Clear old tables in correct dependency order
        with engine.connect() as conn:
            conn.execute(text("DELETE FROM churn_predictions;"))
            conn.execute(text("DELETE FROM fact_churn;"))
            conn.execute(text("DELETE FROM fact_customer_metrics;"))
            conn.execute(text("DELETE FROM dim_services;"))
            conn.execute(text("DELETE FROM dim_accounts;"))
            conn.execute(text("DELETE FROM dim_customers;"))
            conn.commit()
            
        # 6. Insert new data to SQLite
        # dim_customers
        dim_customers = df[['customerID', 'gender', 'SeniorCitizen', 'Partner', 'Dependents']]
        dim_customers.to_sql('dim_customers', con=engine, if_exists='append', index=False)
        
        # dim_accounts
        dim_accounts = df[['customerID', 'Contract', 'PaperlessBilling', 'PaymentMethod']]
        dim_accounts.to_sql('dim_accounts', con=engine, if_exists='append', index=False)
        
        # dim_services
        dim_services = df[['customerID', 'PhoneService', 'MultipleLines', 'InternetService', 
                           'OnlineSecurity', 'OnlineBackup', 'DeviceProtection', 'TechSupport', 
                           'StreamingTV', 'StreamingMovies']]
        dim_services.to_sql('dim_services', con=engine, if_exists='append', index=False)
        
        # fact_customer_metrics
        fact_metrics = df[['customerID', 'tenure', 'MonthlyCharges', 'TotalCharges', 'AvgMonthlyCharge', 'TotalServices']]
        fact_metrics.to_sql('fact_customer_metrics', con=engine, if_exists='append', index=False)
        
        # fact_churn
        fact_churn = df[['customerID', 'Churn', 'Churn_Label', 'TenureGroup', 'HighRisk_Heuristic']]
        fact_churn.to_sql('fact_churn', con=engine, if_exists='append', index=False)
        
        # 7. Generate ML Predictions
        drop_cols = ['Churn', 'Churn_Label', 'HighRisk_Heuristic', 'TenureGroup']
        X = df.drop(columns=[c for c in drop_cols if c in df.columns] + ['customerID'])
        X['SeniorCitizen'] = X['SeniorCitizen'].astype(str)
        
        probs = ml_service.pipeline.predict_proba(X)[:, 1]
        risk_levels = []
        for p in probs:
            if p >= 0.7:
                risk_levels.append('High')
            elif p >= 0.4:
                risk_levels.append('Medium')
            else:
                risk_levels.append('Low')
                
        predictions_df = pd.DataFrame({
            'customerID': df['customerID'],
            'churn_probability': probs,
            'risk_level': risk_levels,
            'model_version': 'v1.0-logreg',
            'prediction_timestamp': datetime.datetime.now()
        })
        predictions_df.to_sql('churn_predictions', con=engine, if_exists='append', index=False)
        
        return jsonify({
            "status": "success",
            "message": "File uploaded and processed successfully. Session data populated.",
            "row_count": len(df)
        })
    except Exception as e:
        return jsonify({"error": "Bad Request", "message": f"Failed to parse and process CSV: {e}"}), 400
