import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, Lightbulb, TrendingUp, Cpu, Target, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getInsights } from '../services/api';
import type { InsightData } from '../services/api';

const InsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getInsights();
      setData(response);
    } catch (err) {
      console.error("Failed to load business insights", err);
      setError("Unable to load business insights.");
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
        <p>Loading Business Insights...</p>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="page-container error-state">
        <AlertCircle size={48} className="text-danger mb-4" />
        <h2>{error || "No business insights are currently available."}</h2>
        <button className="btn-primary mt-4" onClick={loadData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="header-flex" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Lightbulb size={28} className="text-primary" /> Insights & Recommendations
        </h1>
        <p className="text-muted" style={{ fontSize: '1.1rem', margin: 0 }}>
          Turn verified analytics and machine learning patterns into retention decisions.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px' }}>
        {data.map((insight, index) => (
          <div key={index} className="card" style={{ padding: '2rem', borderTop: '4px solid var(--primary-color)' }}>
            
            {/* Observation Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', marginBottom: '0.5rem', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                <TrendingUp size={20} /> SQL Observation
              </h3>
              <p style={{ fontSize: '1.15rem', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                {insight.observed_pattern}
              </p>
            </div>

            <hr style={{ borderColor: '#334155', margin: '1.5rem 0' }} />

            {/* Evidence & Action Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc', marginBottom: '0.75rem', fontSize: '1rem', textTransform: 'uppercase' }}>
                  <Cpu size={18} /> Model Association
                </h4>
                <div style={{ padding: '1rem', backgroundColor: 'rgba(192, 132, 252, 0.05)', border: '1px solid rgba(192, 132, 252, 0.2)', borderRadius: '8px' }}>
                  <p style={{ margin: 0, lineHeight: 1.6, color: '#e2e8f0' }}>
                    {insight.model_association}
                  </p>
                </div>
              </div>

              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', marginBottom: '0.75rem', fontSize: '1rem', textTransform: 'uppercase' }}>
                  <Target size={18} /> Recommended Action
                </h4>
                <div style={{ padding: '1rem', backgroundColor: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '8px' }}>
                  <p style={{ margin: 0, lineHeight: 1.6, color: '#e2e8f0', fontWeight: 500 }}>
                    {insight.business_recommendation}
                  </p>
                </div>
              </div>

            </div>

            {/* Deep Link */}
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'transparent' }}
                onClick={() => navigate('/churn-analysis')}
              >
                View Analytics Evidence <ArrowRight size={16} />
              </button>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsightsPage;
