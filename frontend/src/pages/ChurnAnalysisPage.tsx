import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, PieChart as ChartIcon, Info } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { getChurnAnalysis } from '../services/api';
import type { ChurnAnalysisData } from '../services/api';

const COLORS_CONTRACT = ['#3b82f6', '#10b981', '#f59e0b'];
const COLORS_INTERNET = ['#6366f1', '#ec4899', '#8b5cf6'];
const COLORS_TENURE = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#1e293b', padding: '10px', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' }}>
        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{label}</p>
        <p style={{ margin: '0', color: payload[0].color }}>Churn Rate: {payload[0].value.toFixed(2)}%</p>
        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Total Customers: {payload[0].payload.total.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const ChurnAnalysisPage: React.FC = () => {
  const [data, setData] = useState<ChurnAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getChurnAnalysis();
      // Ensure tenure is ordered logically
      const order = ['0-1 Year', '1-2 Years', '2-4 Years', '4-5 Years', '5+ Years'];
      response.churn_by_tenure.sort((a, b) => order.indexOf(a.tenure_group) - order.indexOf(b.tenure_group));
      setData(response);
    } catch (err) {
      console.error("Failed to load churn analysis", err);
      setError("Unable to load churn analysis.");
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
        <p>Loading Churn Analysis...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container error-state">
        <AlertCircle size={48} className="text-danger mb-4" />
        <h2>{error || "No churn analysis data available."}</h2>
        <button className="btn-primary mt-4" onClick={loadData}>Retry</button>
      </div>
    );
  }

  const isDataEmpty = data.churn_by_contract.length === 0 && data.churn_by_internet.length === 0 && data.churn_by_tenure.length === 0;

  if (isDataEmpty) {
    return (
      <div className="page-container empty-state">
        <ChartIcon size={64} className="text-muted mb-4" />
        <h2>No churn analysis data available.</h2>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="header-flex" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ChartIcon size={28} className="text-primary" /> Churn Analysis
        </h1>
        <p className="text-muted" style={{ fontSize: '1.1rem', margin: 0 }}>
          Understand observed churn patterns across key customer dimensions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* Churn by Contract */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Churn by Contract Type</h3>
          <div style={{ height: 350, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={data.churn_by_contract} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="contract" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="churn_rate" name="Observed Churn Rate (%)" radius={[4, 4, 0, 0]}>
                  {data.churn_by_contract.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_CONTRACT[index % COLORS_CONTRACT.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Churn by Internet Service */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Churn by Internet Service</h3>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={data.churn_by_internet} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="internet" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="churn_rate" name="Churn Rate (%)" radius={[4, 4, 0, 0]}>
                  {data.churn_by_internet.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_INTERNET[index % COLORS_INTERNET.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Churn by Tenure */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Churn by Tenure Group</h3>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={data.churn_by_tenure} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="tenure_group" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="churn_rate" name="Churn Rate (%)" radius={[4, 4, 0, 0]}>
                  {data.churn_by_tenure.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_TENURE[index % COLORS_TENURE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Observations */}
        <div className="card" style={{ gridColumn: '1 / -1', backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa' }}>
            <Info size={24} /> Key Observations
          </h3>
          <p className="text-muted" style={{ fontStyle: 'italic', marginBottom: '1rem' }}>
            Use these patterns to identify customer groups that may warrant deeper retention analysis.
          </p>
          <ul style={{ lineHeight: 1.8, fontSize: '1.05rem', margin: 0, paddingLeft: '1.5rem' }}>
            <li><strong>Contract Type:</strong> Month-to-month customers show a significantly higher observed churn rate compared to one-year and two-year contract holders.</li>
            <li><strong>Internet Service:</strong> Fiber optic customers show the highest observed churn rate in this dataset across internet service options.</li>
            <li><strong>Tenure:</strong> Customers with lower tenure (0-1 Year) exhibit the highest observed churn rate, which sharply declines as tenure increases.</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default ChurnAnalysisPage;
