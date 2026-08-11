import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, Users, Info, Shield, Award, Medal, Crown } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { getSegments } from '../services/api';
import type { SegmentData } from '../services/api';

const COLORS = {
  'Bronze': '#cd7f32',
  'Silver': '#94a3b8',
  'Gold': '#fbbf24',
  'Platinum': '#60a5fa'
};

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#1e293b', padding: '10px', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' }}>
        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{label} Tier</p>
        <p style={{ margin: '0', color: payload[0].color }}>
          {payload[0].name}: {formatter ? formatter(payload[0].value) : payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const SegmentsPage: React.FC = () => {
  const [data, setData] = useState<SegmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSegments();
      setData(response);
    } catch (err) {
      console.error("Failed to load customer segments", err);
      setError("Unable to load customer segments.");
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
        <p>Loading Customer Segments...</p>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="page-container error-state">
        <AlertCircle size={48} className="text-danger mb-4" />
        <h2>{error || "No segment data available."}</h2>
        <button className="btn-primary mt-4" onClick={loadData}>Retry</button>
      </div>
    );
  }

  const getTierIcon = (tier: string) => {
    switch(tier) {
      case 'Bronze': return <Shield size={24} color={COLORS['Bronze']} />;
      case 'Silver': return <Medal size={24} color={COLORS['Silver']} />;
      case 'Gold': return <Award size={24} color={COLORS['Gold']} />;
      case 'Platinum': return <Crown size={24} color={COLORS['Platinum']} />;
      default: return <Users size={24} />;
    }
  };

  return (
    <div className="page-container">
      <div className="header-flex" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={28} className="text-primary" /> Customer Segments
        </h1>
        <p className="text-muted" style={{ fontSize: '1.1rem', margin: 0 }}>
          Value-based customer segmentation using predictive clustering.
        </p>
      </div>

      {/* Tier Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {data.map((segment) => (
          <div key={segment.value_tier} className="card" style={{ display: 'flex', flexDirection: 'column', borderTop: `4px solid ${COLORS[segment.value_tier as keyof typeof COLORS]}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{segment.value_tier}</h3>
              {getTierIcon(segment.value_tier)}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Customers:</span>
                <span style={{ fontWeight: 'bold' }}>{segment.customer_count.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Avg Monthly:</span>
                <span style={{ fontWeight: 'bold' }}>${segment.avg_monthly.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Avg Tenure:</span>
                <span style={{ fontWeight: 'bold' }}>{segment.avg_tenure.toFixed(1)} mos</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Churn Rate:</span>
                <span style={{ fontWeight: 'bold', color: segment.churn_rate > 30 ? 'var(--danger-color)' : 'inherit' }}>
                  {segment.churn_rate.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* Average Tenure */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Average Tenure by Segment</h3>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="value_tier" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(val) => `${val} mos`} />
                <Tooltip formatter={(val: any) => `${Number(val).toFixed(1)} mos`} content={<CustomTooltip />} />
                <Bar dataKey="avg_tenure" name="Average Tenure" radius={[4, 4, 0, 0]}>
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[data[index].value_tier as keyof typeof COLORS] || '#8884d8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Monthly Charges */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Average Monthly Charges by Segment</h3>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="value_tier" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(val) => `$${val}`} />
                <Tooltip formatter={(val: any) => `$${Number(val).toFixed(2)}`} content={<CustomTooltip />} />
                <Bar dataKey="avg_monthly" name="Average Monthly Charges" radius={[4, 4, 0, 0]}>
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[data[index].value_tier as keyof typeof COLORS] || '#8884d8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Churn Rate */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Churn Rate by Segment</h3>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="value_tier" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(val) => `${val}%`} />
                <Tooltip formatter={(val: any) => `${Number(val).toFixed(2)}%`} content={<CustomTooltip />} />
                <Bar dataKey="churn_rate" name="Observed Churn Rate" radius={[4, 4, 0, 0]}>
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[data[index].value_tier as keyof typeof COLORS] || '#8884d8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segment Methodology */}
        <div className="card" style={{ gridColumn: '1 / -1', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={24} /> Segment Methodology & Interpretation
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
            <div>
              <h4 style={{ color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>Methodology</h4>
              <p className="text-muted" style={{ lineHeight: 1.6, margin: 0 }}>
                Customers are divided into four equal-sized value tiers using SQL <code>NTILE(4)</code> ordered by historical <code>TotalCharges</code>. 
                This is a purely value-based quantitative segmentation. Segment membership is entirely relative to this specific dataset.
              </p>
            </div>
            <div>
              <h4 style={{ color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>Business Interpretation</h4>
              <p className="text-muted" style={{ lineHeight: 1.6, margin: 0 }}>
                <strong>Platinum</strong> customers represent the highest lifetime-charge tier under the current segmentation, typically correlating with higher tenure. 
                <strong>Bronze</strong> customers show lower observed lifetime charges and notably higher observed churn rates within this dataset.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SegmentsPage;
