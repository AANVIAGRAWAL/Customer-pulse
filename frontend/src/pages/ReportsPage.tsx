import React, { useEffect, useState } from 'react';
import { FileText, Printer, RefreshCw, Activity, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { getDashboard, getChurnAnalysis, getSegments, getInsights } from '../services/api';
import type { DashboardKPIs, ChurnAnalysisData, SegmentData, InsightData } from '../services/api';

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#c084fc'];
const TIER_COLORS = { 'Bronze': '#cd7f32', 'Silver': '#94a3b8', 'Gold': '#fbbf24', 'Platinum': '#60a5fa' };

interface ReportData {
  dashboard: DashboardKPIs;
  churn: ChurnAnalysisData;
  segments: SegmentData[];
  insights: InsightData[];
}

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashData, churnData, segData, insData] = await Promise.all([
        getDashboard(),
        getChurnAnalysis(),
        getSegments(),
        getInsights()
      ]);
      
      setData({
        dashboard: dashData,
        churn: churnData,
        segments: segData,
        insights: insData
      });
    } catch (err) {
      console.error("Failed to load report data", err);
      setError("Unable to generate the report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="page-container loading-state">
        <Activity className="spinner" size={48} />
        <p>Generating Executive Report...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container error-state">
        <AlertCircle size={48} className="text-danger mb-4" />
        <h2>{error || "No report data is currently available."}</h2>
        <button className="btn-primary mt-4" onClick={loadData}>Retry</button>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Report Actions (Hidden on Print) */}
      <div className="print-hidden" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-secondary" onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} /> Refresh Report
        </button>
        <button className="btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={16} /> Print Report
        </button>
      </div>

      {/* Report Document Wrapper */}
      <div className="report-document" style={{ backgroundColor: 'var(--bg-color)', padding: '0', borderRadius: '8px' }}>
        
        {/* Header */}
        <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem', marginBottom: '0.5rem' }}>
            <FileText size={32} className="text-primary" /> CustomerPulse
          </h1>
          <h2 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0', fontWeight: 500 }}>Customer Churn & Risk Analytics Report</h2>
          <p className="text-muted" style={{ margin: 0 }}>Generated: {currentDate}</p>
        </div>

        {/* Section 1: Executive KPIs */}
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: '#94a3b8', textTransform: 'uppercase' }}>
            Executive KPIs
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <p className="text-muted" style={{ margin: '0 0 0.5rem 0' }}>Total Customers</p>
              <h2 style={{ margin: 0 }}>{data.dashboard.total_customers.toLocaleString()}</h2>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <p className="text-muted" style={{ margin: '0 0 0.5rem 0' }}>Overall Churn Rate</p>
              <h2 style={{ margin: 0, color: 'var(--danger-color)' }}>{(data.dashboard.churn_rate * 100).toFixed(2)}%</h2>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <p className="text-muted" style={{ margin: '0 0 0.5rem 0' }}>Avg Monthly Charges</p>
              <h2 style={{ margin: 0 }}>${data.dashboard.average_monthly_charges.toFixed(2)}</h2>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <p className="text-muted" style={{ margin: '0 0 0.5rem 0' }}>Monthly Revenue Lost</p>
              <h2 style={{ margin: 0, color: 'var(--danger-color)' }}>${data.dashboard.revenue_lost_to_churn.toLocaleString()}</h2>
            </div>
          </div>
        </div>

        {/* Section 2: Churn Overview */}
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: '#94a3b8', textTransform: 'uppercase' }}>
            Churn Overview
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* Contract Chart */}
            <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 1rem 0' }}>Churn by Contract</h4>
              <div style={{ height: 200, width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={data.churn.churn_by_contract} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="contract" stroke="#94a3b8" tick={{fontSize: 12}} />
                    <YAxis stroke="#94a3b8" tickFormatter={(val) => `${val}%`} tick={{fontSize: 12}} />
                    <RechartsTooltip formatter={(val: any) => `${Number(val).toFixed(2)}%`} contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}} />
                    <Bar dataKey="churn_rate" radius={[4, 4, 0, 0]}>
                      {data.churn.churn_by_contract.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Internet Chart */}
            <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 1rem 0' }}>Churn by Internet Service</h4>
              <div style={{ height: 200, width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={data.churn.churn_by_internet} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="internet" stroke="#94a3b8" tick={{fontSize: 12}} />
                    <YAxis stroke="#94a3b8" tickFormatter={(val) => `${val}%`} tick={{fontSize: 12}} />
                    <RechartsTooltip formatter={(val: any) => `${Number(val).toFixed(2)}%`} contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}} />
                    <Bar dataKey="churn_rate" radius={[4, 4, 0, 0]}>
                      {data.churn.churn_by_internet.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>

        {/* Section 3: Customer Segments */}
        <div style={{ marginBottom: '3rem', pageBreakInside: 'avoid' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: '#94a3b8', textTransform: 'uppercase' }}>
            Customer Segmentation (Value Tiers)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {data.segments.map((segment) => (
              <div key={segment.value_tier} className="card" style={{ borderTop: `4px solid ${TIER_COLORS[segment.value_tier as keyof typeof TIER_COLORS]}` }}>
                <h4 style={{ margin: '0 0 1rem 0' }}>{segment.value_tier}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Count:</span>
                    <span>{segment.customer_count.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Avg Monthly:</span>
                    <span>${segment.avg_monthly.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Avg Tenure:</span>
                    <span>{segment.avg_tenure.toFixed(1)} mo</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Churn Rate:</span>
                    <span style={{ color: segment.churn_rate > 30 ? 'var(--danger-color)' : 'inherit' }}>
                      {segment.churn_rate.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Risk Overview */}
        <div style={{ marginBottom: '3rem', pageBreakInside: 'avoid' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: '#94a3b8', textTransform: 'uppercase' }}>
            Risk Overview
          </h3>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={20} className="text-primary" />
              <h4 style={{ margin: 0 }}>Predictive Risk Methodology</h4>
            </div>
            <p className="text-muted" style={{ margin: 0, lineHeight: 1.6 }}>
              All customers have been proactively scored utilizing our Logistic Regression model pipeline. 
              The resulting probabilities are grouped into three actionable tiers for retention prioritization:
            </p>
            <ul style={{ color: 'var(--text-primary)', margin: 0, paddingLeft: '1.5rem', lineHeight: 1.8 }}>
              <li><strong>High Risk:</strong> Probability &gt; 50%</li>
              <li><strong>Medium Risk:</strong> Probability 20% – 50%</li>
              <li><strong>Low Risk:</strong> Probability &lt; 20%</li>
            </ul>
            <div className="print-hidden" style={{ marginTop: '0.5rem' }}>
              <button 
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => navigate('/at-risk')}
              >
                View At-Risk Customers <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Section 5: Key Insights & Recommendations */}
        <div style={{ marginBottom: '1rem', pageBreakInside: 'avoid' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: '#94a3b8', textTransform: 'uppercase' }}>
            Key Insights & Recommendations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {data.insights.map((insight, idx) => (
              <div key={idx} className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #c084fc' }}>
                <p style={{ margin: '0 0 1rem 0', fontWeight: 500, fontSize: '1.1rem' }}>
                  {insight.observed_pattern}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <h5 style={{ color: '#94a3b8', margin: '0 0 0.5rem 0', textTransform: 'uppercase', fontSize: '0.85rem' }}>Evidence (Model Association)</h5>
                    <p className="text-muted" style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                      {insight.model_association}
                    </p>
                  </div>
                  <div>
                    <h5 style={{ color: '#34d399', margin: '0 0 0.5rem 0', textTransform: 'uppercase', fontSize: '0.85rem' }}>Recommended Action</h5>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                      {insight.business_recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportsPage;
