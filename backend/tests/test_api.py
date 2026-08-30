import os
import sys
import pytest
import io
import jwt
import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def auth_headers(client):
    # Retrieve the secret key used by the application
    app = create_app()
    secret_key = app.config['SECRET_KEY']
    payload = {
        "email": "test@example.com",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    token = jwt.encode(payload, secret_key, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}

def test_health_check(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}

def test_dashboard(client, auth_headers):
    response = client.get('/api/dashboard', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'total_customers' in data

def test_customers(client, auth_headers):
    response = client.get('/api/customers?limit=5', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'data' in data
    assert len(data['data']) <= 5

def test_customer_by_id(client, auth_headers):
    # Known ID from Telco dataset
    response = client.get('/api/customers/7590-VHVEG', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data['customerID'] == '7590-VHVEG'

def test_invalid_customer_id(client, auth_headers):
    response = client.get('/api/customers/INVALID-ID-123', headers=auth_headers)
    assert response.status_code == 404

def test_at_risk(client, auth_headers):
    response = client.get('/api/at-risk?limit=5', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'data' in data
    assert len(data['data']) <= 5
    if len(data['data']) > 0:
        assert 'churn_probability' in data['data'][0]

def test_at_risk_filtering(client, auth_headers):
    response = client.get('/api/at-risk?risk_level=High&limit=5', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'data' in data
    for item in data['data']:
        assert item['risk_level'] == 'High'

def test_churn_analysis(client, auth_headers):
    response = client.get('/api/churn-analysis', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'churn_by_contract' in data

def test_predict_success(client, auth_headers):
    payload = {
        'gender': 'Female', 'SeniorCitizen': '0', 'Partner': 'Yes', 'Dependents': 'No',
        'tenure': 24, 'PhoneService': 'Yes', 'MultipleLines': 'No', 'InternetService': 'Fiber optic',
        'OnlineSecurity': 'No', 'OnlineBackup': 'Yes', 'DeviceProtection': 'No', 'TechSupport': 'No',
        'StreamingTV': 'Yes', 'StreamingMovies': 'No', 'Contract': 'Month-to-month',
        'PaperlessBilling': 'Yes', 'PaymentMethod': 'Electronic check',
        'MonthlyCharges': 89.5, 'TotalCharges': 2148.0, 'AvgMonthlyCharge': 89.5, 'TotalServices': 2
    }
    response = client.post('/api/predict', json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'churn_probability' in data
    assert 'risk_level' in data

def test_predict_invalid(client, auth_headers):
    response = client.post('/api/predict', json={'gender': 'Female'}, headers=auth_headers) # Missing most fields
    assert response.status_code == 422
    
def test_upload_invalid(client, auth_headers):
    response = client.post('/api/upload', headers=auth_headers)
    assert response.status_code == 422 # No file part

def test_unauthorized_access(client):
    # Making request without token should return 401
    response = client.get('/api/dashboard')
    assert response.status_code == 401
    data = response.get_json()
    assert data['error'] == 'Unauthorized'
