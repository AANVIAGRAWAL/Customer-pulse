import os
import sys
import pytest
import io

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}

def test_dashboard(client):
    response = client.get('/api/dashboard')
    assert response.status_code == 200
    data = response.get_json()
    assert 'total_customers' in data

def test_customers(client):
    response = client.get('/api/customers?limit=5')
    assert response.status_code == 200
    data = response.get_json()
    assert 'data' in data
    assert len(data['data']) <= 5

def test_customer_by_id(client):
    # Known ID from Telco dataset
    response = client.get('/api/customers/7590-VHVEG')
    assert response.status_code == 200
    data = response.get_json()
    assert data['customerID'] == '7590-VHVEG'

def test_invalid_customer_id(client):
    response = client.get('/api/customers/INVALID-ID-123')
    assert response.status_code == 404

def test_at_risk(client):
    response = client.get('/api/at-risk?limit=5')
    assert response.status_code == 200
    data = response.get_json()
    assert 'data' in data
    assert len(data['data']) <= 5
    if len(data['data']) > 0:
        assert 'churn_probability' in data['data'][0]

def test_at_risk_filtering(client):
    response = client.get('/api/at-risk?risk_level=High&limit=5')
    assert response.status_code == 200
    data = response.get_json()
    assert 'data' in data
    for item in data['data']:
        assert item['risk_level'] == 'High'

def test_churn_analysis(client):
    response = client.get('/api/churn-analysis')
    assert response.status_code == 200
    data = response.get_json()
    assert 'churn_by_contract' in data

def test_predict_success(client):
    payload = {
        'gender': 'Female', 'SeniorCitizen': '0', 'Partner': 'Yes', 'Dependents': 'No',
        'tenure': 24, 'PhoneService': 'Yes', 'MultipleLines': 'No', 'InternetService': 'Fiber optic',
        'OnlineSecurity': 'No', 'OnlineBackup': 'Yes', 'DeviceProtection': 'No', 'TechSupport': 'No',
        'StreamingTV': 'Yes', 'StreamingMovies': 'No', 'Contract': 'Month-to-month',
        'PaperlessBilling': 'Yes', 'PaymentMethod': 'Electronic check',
        'MonthlyCharges': 89.5, 'TotalCharges': 2148.0, 'AvgMonthlyCharge': 89.5, 'TotalServices': 2
    }
    response = client.post('/api/predict', json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert 'churn_probability' in data
    assert 'risk_level' in data

def test_predict_invalid(client):
    response = client.post('/api/predict', json={'gender': 'Female'}) # Missing most fields
    assert response.status_code == 422
    
def test_upload_invalid(client):
    response = client.post('/api/upload')
    assert response.status_code == 422 # No file part
