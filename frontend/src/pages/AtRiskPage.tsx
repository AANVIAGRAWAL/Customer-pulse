import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Filter, ChevronLeft, ChevronRight, Activity, AlertCircle, ArrowRight } from 'lucide-react';
import { getAtRiskCustomers } from '../services/api';
import type { AtRiskCustomer, AtRiskResponse } from '../services/api';
import './CustomersPage.css'; // Reusing layout CSS from CustomersPage

const AtRiskPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [customers, setCustomers] = useState<AtRiskCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Initialize filter state from URL or defaults
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const riskLevelParam = searchParams.get('risk_level') || 'All';
  
  const [filters, setFilters] = useState({
    risk_level: riskLevelParam,
    page: isNaN(pageParam) ? 1 : pageParam
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page: filters.page, limit: 10 };
      if (filters.risk_level !== 'All') {
        params.risk_level = filters.risk_level;
      }

      const response: AtRiskResponse = await getAtRiskCustomers(params);
      setCustomers(response.data);
      setTotal(response.total);

      // Sync valid params to URL
      setSearchParams(params, { replace: true });
    } catch (err) {
      console.error("Failed to load at-risk customers", err);
      setError("Unable to load at-risk customers.");
    } finally {
      setLoading(false);
    }
  }, [filters, setSearchParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ 
      risk_level: e.target.value,
      page: 1 // Reset to page 1 on filter change
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.ceil(total / 10);

  // Helper for risk visual
  const getRiskColor = (level: string) => {
    if (level === 'High') return 'var(--danger-color)';
    if (level === 'Medium') return 'var(--warning-color)';
    return 'var(--success-color)';
  };
  
  const getRiskIcon = (level: string) => {
    if (level === 'High') return '🔴';
    if (level === 'Medium') return '🟠';
    return '🟢';
  };

  return (
    <div className="page-container">
      <div className="header-flex" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={28} className="text-warning" /> At-Risk Customers
        </h1>
        <p className="text-muted" style={{ fontSize: '1.1rem', margin: 0 }}>
          Prioritize customers with higher predicted churn probability for retention review.
        </p>
      </div>

      <div className="card filters-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="filter-group" style={{ margin: 0 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} /> Filter by Risk Level:
          </label>
          <select 
            name="risk_level" 
            value={filters.risk_level} 
            onChange={handleFilterChange}
            style={{ minWidth: '200px' }}
          >
            <option value="All">All Risk Levels</option>
            <option value="High">🔴 High Risk (≥ 70%)</option>
            <option value="Medium">🟠 Medium Risk (40-69%)</option>
            <option value="Low">🟢 Low Risk (&lt; 40%)</option>
          </select>
        </div>
        
        <div className="badge primary" style={{ fontSize: '1rem', padding: '0.75rem 1.25rem' }}>
          Showing {total.toLocaleString()} {filters.risk_level !== 'All' ? filters.risk_level + ' Risk' : 'Total'} Customers
        </div>
      </div>
      
      <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem', fontStyle: 'italic' }}>
        * Note: Global search is currently unsupported by the at-risk API endpoint.
      </p>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state">
            <Activity className="spinner" size={32} />
            <p>Loading at-risk customers...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={48} className="text-danger mb-4" />
            <h2>{error}</h2>
            <button className="btn-primary mt-4" onClick={() => loadData()}>Retry</button>
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <h2>No customers match the selected risk filter.</h2>
            <p className="text-muted">Try adjusting your filters.</p>
            <button className="btn-secondary mt-4" onClick={() => setFilters({ risk_level: 'All', page: 1 })}>Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table interactive-table">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th style={{ width: '250px' }}>Churn Probability</th>
                    <th>Risk Level</th>
                    <th>Monthly Charges</th>
                    <th>Tenure (Mos)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(customer => {
                    const probPct = (customer.churn_probability * 100).toFixed(1);
                    const isHighValue = customer.risk_level === 'High' && customer.MonthlyCharges > 65; // Just a visual heuristic
                    
                    return (
                      <tr 
                        key={customer.customerID} 
                        onClick={() => navigate(`/customers/${customer.customerID}`)}
                        style={isHighValue ? { backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}
                      >
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="fw-500 text-primary">{customer.customerID}</span>
                            {isHighValue && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)', marginTop: '4px', fontWeight: 'bold' }}>
                                High Value Risk
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                            <span style={{ minWidth: '45px', fontWeight: 600 }}>{probPct}%</span>
                            <div style={{ flexGrow: 1, height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div 
                                style={{ 
                                  height: '100%', 
                                  width: `${probPct}%`, 
                                  backgroundColor: getRiskColor(customer.risk_level),
                                  transition: 'width 0.3s ease'
                                }} 
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: getRiskColor(customer.risk_level) }}>
                            {getRiskIcon(customer.risk_level)} {customer.risk_level.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontWeight: isHighValue ? 600 : 400 }}>${customer.MonthlyCharges.toFixed(2)}</td>
                        <td>{customer.tenure}</td>
                        <td>
                          <button 
                            className="btn-secondary small" 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/customers/${customer.customerID}`); }}
                          >
                            View <ArrowRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="pagination">
              <div className="pagination-info">
                Showing {customers.length > 0 ? (filters.page - 1) * 10 + 1 : 0} to {Math.min(filters.page * 10, total)} of {total.toLocaleString()} customers
              </div>
              <div className="pagination-controls">
                <button 
                  className="btn-icon" 
                  disabled={filters.page === 1}
                  onClick={() => handlePageChange(filters.page - 1)}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="pagination-current">
                  Page {filters.page} of {totalPages || 1}
                </span>
                <button 
                  className="btn-icon" 
                  disabled={filters.page >= totalPages}
                  onClick={() => handlePageChange(filters.page + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AtRiskPage;
