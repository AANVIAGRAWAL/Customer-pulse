from flask import Blueprint, jsonify, request
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
    # Only validates file structure, does not mutate DB
    if 'file' not in request.files:
        return jsonify({"error": "Unprocessable Entity", "message": "No file part"}), 422
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Unprocessable Entity", "message": "No selected file"}), 422
        
    if not file.filename.endswith('.csv'):
        return jsonify({"error": "Unprocessable Entity", "message": "Only CSV files are allowed"}), 422
        
    try:
        import pandas as pd
        df = pd.read_csv(file)
        required_cols = ['customerID', 'tenure', 'MonthlyCharges', 'TotalCharges'] # Basic validation subset
        missing = [c for c in required_cols if c not in df.columns]
        
        if missing:
            return jsonify({"error": "Unprocessable Entity", "message": f"Missing required columns: {missing}"}), 422
            
        return jsonify({
            "status": "success",
            "message": "File validated successfully. Database insertion is disabled for safety.",
            "row_count": len(df)
        })
    except Exception as e:
        return jsonify({"error": "Bad Request", "message": f"Failed to parse CSV: {e}"}), 400
