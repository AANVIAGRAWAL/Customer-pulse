import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, Activity, AlertCircle } from 'lucide-react';
import { getCustomers } from '../services/api';
import type { CustomerListItem, CustomerListResponse } from '../services/api';
import './CustomersPage.css';

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Initialize filter state from URL or defaults
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    churn: searchParams.get('churn') || 'All',
    contract: searchParams.get('contract') || 'All',
    internet: searchParams.get('internet') || 'All',
    page: isNaN(pageParam) ? 1 : pageParam
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Omit 'All' filters when sending to API
      const params: any = { page: filters.page, limit: 10 };
      if (filters.search) params.search = filters.search;
      if (filters.churn !== 'All') params.churn = filters.churn;
      if (filters.contract !== 'All') params.contract = filters.contract;
      if (filters.internet !== 'All') params.internet = filters.internet;

      const response: CustomerListResponse = await getCustomers(params);
      setCustomers(response.data);
      setTotal(response.total);

      // Sync valid params to URL
      setSearchParams(params, { replace: true });
    } catch (err) {
      console.error("Failed to load customers", err);
      setError("Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }, [filters, setSearchParams]);

  useEffect(() => {
    // Debounce the loadData if user is typing a search
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, loadData]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters(prev => ({ 
      ...prev, 
      [e.target.name]: e.target.value,
      page: 1 // Reset to page 1 on any filter change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="page-container">
      <div className="header-flex">
        <h1 className="page-title">Customer Explorer</h1>
        <div className="dev-badge">Sorting will be added in a future backend release.</div>
      </div>

      <div className="card filters-card">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            name="search"
            placeholder="Search by Customer ID..." 
            value={filters.search}
            onChange={handleFilterChange}
          />
        </div>
        
        <div className="filters-row">
          <div className="filter-group">
            <label><Filter size={14} /> Churn Status</label>
            <select name="churn" value={filters.churn} onChange={handleFilterChange}>
              <option value="All">All</option>
              <option value="Yes">Churned</option>
              <option value="No">Retained</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Contract</label>
            <select name="contract" value={filters.contract} onChange={handleFilterChange}>
              <option value="All">All</option>
              <option value="Month-to-month">Month-to-month</option>
              <option value="One year">One year</option>
              <option value="Two year">Two year</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Internet</label>
            <select name="internet" value={filters.internet} onChange={handleFilterChange}>
              <option value="All">All</option>
              <option value="DSL">DSL</option>
              <option value="Fiber optic">Fiber optic</option>
              <option value="No">No Internet</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state">
            <Activity className="spinner" size={32} />
            <p>Loading customers...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={48} className="text-danger mb-4" />
            <h2>{error}</h2>
            <button className="btn-primary mt-4" onClick={() => handleFilterChange({ target: { name: 'search', value: '' } } as any)}>Retry</button>
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <h2>No customers found.</h2>
            <p className="text-muted">Try adjusting your search or filters.</p>
            <button className="btn-secondary mt-4" onClick={() => setFilters({ search: '', churn: 'All', contract: 'All', internet: 'All', page: 1 })}>Reset Filters</button>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table interactive-table">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Gender</th>
                    <th>Tenure (Mos)</th>
                    <th>Contract</th>
                    <th>Internet</th>
                    <th>Monthly Charges</th>
                    <th>Churn Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(customer => (
                    <tr key={customer.customerID} onClick={() => navigate(`/customers/${customer.customerID}`)}>
                      <td className="fw-500 text-primary">{customer.customerID}</td>
                      <td>{customer.gender}</td>
                      <td>{customer.tenure}</td>
                      <td>{customer.Contract}</td>
                      <td>{customer.InternetService}</td>
                      <td>${customer.MonthlyCharges.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${customer.Churn === 'Yes' ? 'danger' : 'success'}`}>
                          {customer.Churn === 'Yes' ? 'Churned' : 'Retained'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-secondary small" onClick={(e) => { e.stopPropagation(); navigate(`/customers/${customer.customerID}`); }}>View Customer</button>
                      </td>
                    </tr>
                  ))}
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

export default CustomersPage;
