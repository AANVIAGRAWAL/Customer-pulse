import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, AlertTriangle, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, Legend, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { 
  getDashboard, getChurnAnalysis, getAtRiskCustomers 
} from '../services/api';
import type { DashboardKPIs, ChurnAnalysisData, AtRiskResponse } from '../services/api';
import './DashboardPage.css';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [kpiData, setKpiData] = useState<DashboardKPIs | null>(null);
  const [churnAnalysis, setChurnAnalysis] = useState<ChurnAnalysisData | null>(null);
  const [atRiskData, setAtRiskData] = useState<AtRiskResponse | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, churn, atRisk] = await Promise.all([
        getDashboard(),
        getChurnAnalysis(),
        getAtRiskCustomers({ limit: 5 })
      ]);
      setKpiData(dash);
      setChurnAnalysis(churn);
      setAtRiskData(atRisk);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="page-container loading-state">
        <Activity className="spinner" size={48} />
        <p>Loading customer analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container error-state">
        <AlertCircle size={48} className="text-danger mb-4" />
        <h2>{error}</h2>
        <button className="btn-primary mt-4" onClick={loadData}>Retry</button>
      </div>
    );
  }

  if (!kpiData || !churnAnalysis || !atRiskData) {
    return (
      <div className="page-container empty-state">
        <p>No dashboard data available.</p>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <h1 className="page-title">Overview Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><Users size={24} /></div>
          <div className="kpi-content">
            <h3>Total Customers</h3>
            <p className="kpi-value">{kpiData.total_customers.toLocaleString()}</p>
          </div>
        </div>
        <div className="kpi-card danger">
          <div className="kpi-icon"><TrendingUp size={24} /></div>
          <div className="kpi-content">
            <h3>Churn Rate</h3>
            <p className="kpi-value">{kpiData.churn_rate.toFixed(2)}%</p>
          </div>
        </div>
        <div className="kpi-card success">
          <div className="kpi-icon"><Activity size={24} /></div>
          <div className="kpi-content">
            <h3>Retention Rate</h3>
            <p className="kpi-value">{kpiData.retention_rate.toFixed(2)}%</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><DollarSign size={24} /></div>
          <div className="kpi-content">
            <h3>Avg Monthly Charges</h3>
            <p className="kpi-value">${kpiData.average_monthly_charges.toFixed(2)}</p>
          </div>
        </div>
        <div className="kpi-card danger">
          <div className="kpi-icon"><AlertTriangle size={24} /></div>
          <div className="kpi-content">
            <h3>Revenue Lost to Churn</h3>
            <p className="kpi-value">{formatCurrency(kpiData.revenue_lost_to_churn)}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        
        {/* Churn by Contract */}
        <div className="card chart-container">
          <h3>Churn by Contract</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={churnAnalysis.churn_by_contract} 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="churn_rate"
                  nameKey="contract"
                >
                  {churnAnalysis.churn_by_contract.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: any) => [`${value}%`, 'Churn Rate']} 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Churn by Internet Service */}
        <div className="card chart-container">
          <h3>Churn by Internet Service</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={churnAnalysis.churn_by_internet}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="internet" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip 
                  formatter={(value: any) => [`${value}%`, 'Churn Rate']}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }} 
                />
                <Bar dataKey="churn_rate" name="Churn Rate (%)" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Churn by Tenure */}
        <div className="card chart-container full-width">
          <h3>Churn by Tenure</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={churnAnalysis.churn_by_tenure}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="tenure_group" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip 
                  formatter={(value: any) => [`${value}%`, 'Churn Rate']}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }} 
                />
                <Bar dataKey="churn_rate" name="Churn Rate (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* At Risk Table */}
      <div className="card table-container">
        <div className="table-header-flex">
          <h3>Highest Risk Customers</h3>
          <button className="btn-secondary small" onClick={() => navigate('/at-risk')}>View All</button>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Risk Level</th>
                <th>Churn Risk</th>
                <th>Monthly Charges</th>
                <th>Tenure</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {atRiskData.data.map(customer => (
                <tr key={customer.customerID}>
                  <td className="fw-500">{customer.customerID}</td>
                  <td>
                    <span className={`badge ${customer.risk_level === 'High' ? 'danger' : customer.risk_level === 'Medium' ? 'warning' : 'success'}`}>
                      {customer.risk_level}
                    </span>
                  </td>
                  <td>
                    <div className="risk-bar-container">
                      <div className="risk-bar" style={{ 
                        width: `${Math.min(customer.churn_probability * 100, 100)}%`, 
                        background: customer.risk_level === 'High' ? 'var(--danger)' : 'var(--warning)' 
                      }}></div>
                    </div>
                    <span className="risk-text">{(customer.churn_probability * 100).toFixed(1)}%</span>
                  </td>
                  <td>${customer.MonthlyCharges.toFixed(2)}</td>
                  <td>{customer.tenure} mos</td>
                  <td>
                    <button className="btn-primary small" onClick={() => navigate(`/customers/${customer.customerID}`)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
