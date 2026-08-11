import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Activity, AlertCircle, CreditCard, Shield, Zap } from 'lucide-react';
import { getCustomer } from '../services/api';
import type { CustomerProfileResponse } from '../services/api';
import './CustomersPage.css'; // Reuse existing CSS styles for badges and cards

const CustomerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState<CustomerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [is404, setIs404] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setIs404(false);
    
    try {
      const data = await getCustomer(id);
      setCustomer(data);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setIs404(true);
      } else {
        console.error("Failed to load customer", err);
        setError("Unable to load customer information.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container loading-state">
        <Activity className="spinner" size={48} />
        <p>Loading Customer 360 Profile...</p>
      </div>
    );
  }

  if (is404) {
    return (
      <div className="page-container empty-state">
        <User size={64} className="text-muted mb-4" />
        <h2>Customer not found.</h2>
        <p className="text-muted">The customer ID "{id}" does not exist in our database.</p>
        <button className="btn-secondary mt-4" onClick={() => navigate('/customers')}>
          Back to Customers
        </button>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="page-container error-state">
        <AlertCircle size={48} className="text-danger mb-4" />
        <h2>{error || "An unexpected error occurred."}</h2>
        <button className="btn-primary mt-4" onClick={loadData}>Retry</button>
        <button className="btn-secondary mt-4 ml-2" onClick={() => navigate('/customers')}>
          Back to Customers
        </button>
      </div>
    );
  }

  const { demographics, account, services, financial_metrics, churn_status, risk } = customer;

  return (
    <div className="page-container">
      {/* Header and Back navigation */}
      <div className="header-flex" style={{ alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon" onClick={() => navigate('/customers')} title="Back to Customers">
            <ChevronLeft size={24} />
          </button>
          <h1 className="page-title" style={{ margin: 0 }}>Customer {customer.customerID}</h1>
        </div>
        <div>
          <span className={`badge ${churn_status.Churn === 'Yes' ? 'danger' : 'success'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
            {churn_status.Churn === 'Yes' ? 'Churned' : 'Active'}
          </span>
        </div>
      </div>

      <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Customer Overview */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={20} /> Demographic Overview</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0', lineHeight: 2 }}>
            <li><strong>Gender:</strong> {demographics.gender}</li>
            <li><strong>Senior Citizen:</strong> {demographics.SeniorCitizen ? 'Yes' : 'No'}</li>
            <li><strong>Partner:</strong> {demographics.Partner}</li>
            <li><strong>Dependents:</strong> {demographics.Dependents}</li>
          </ul>
        </div>

        {/* Account Information */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CreditCard size={20} /> Account Information</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0', lineHeight: 2 }}>
            <li><strong>Contract:</strong> {account.Contract}</li>
            <li><strong>Paperless Billing:</strong> {account.PaperlessBilling}</li>
            <li><strong>Payment Method:</strong> {account.PaymentMethod}</li>
          </ul>
        </div>

        {/* Financial Profile */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={20} /> Financial Profile</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0', lineHeight: 2 }}>
            <li><strong>Tenure:</strong> {financial_metrics.tenure} months</li>
            <li><strong>Monthly Charges:</strong> ${financial_metrics.MonthlyCharges.toFixed(2)}</li>
            <li><strong>Total Charges:</strong> ${financial_metrics.TotalCharges.toFixed(2)}</li>
            <li><strong>Avg Monthly Charge:</strong> ${financial_metrics.AvgMonthlyCharge.toFixed(2)}</li>
          </ul>
        </div>

        {/* ML Risk Assessment */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={20} /> CHURN RISK</h3>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginTop: '1rem' }}>
            {risk ? (
              <div style={{ lineHeight: 2 }}>
                <p style={{ margin: 0 }}><strong>Probability:</strong> {(risk.churn_probability * 100).toFixed(2)}%</p>
                <p style={{ margin: 0 }}><strong>Risk:</strong> <span className={`badge ${risk.risk_level === 'High' ? 'danger' : risk.risk_level === 'Medium' ? 'warning' : 'success'}`}>{risk.risk_level.toUpperCase()}</span></p>
              </div>
            ) : (
              <p className="text-muted" style={{ fontStyle: 'italic', margin: 0 }}>
                Risk prediction unavailable.
              </p>
            )}
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
              Individual risk-factor explanations will be added in a future model explainability phase.
            </p>
          </div>
        </div>

        {/* Services Information */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={20} /> Subscribed Services</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="service-item"><strong>Phone Service:</strong> {services.PhoneService}</div>
            <div className="service-item"><strong>Multiple Lines:</strong> {services.MultipleLines}</div>
            <div className="service-item"><strong>Internet Service:</strong> {services.InternetService}</div>
            <div className="service-item"><strong>Online Security:</strong> {services.OnlineSecurity}</div>
            <div className="service-item"><strong>Online Backup:</strong> {services.OnlineBackup}</div>
            <div className="service-item"><strong>Device Protection:</strong> {services.DeviceProtection}</div>
            <div className="service-item"><strong>Tech Support:</strong> {services.TechSupport}</div>
            <div className="service-item"><strong>Streaming TV:</strong> {services.StreamingTV}</div>
            <div className="service-item"><strong>Streaming Movies:</strong> {services.StreamingMovies}</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerProfilePage;
