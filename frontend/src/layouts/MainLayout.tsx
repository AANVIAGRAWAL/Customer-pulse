import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { getSessionStatus } from '../services/api';
import { Loader } from 'lucide-react';
import './MainLayout.css';

const MainLayout: React.FC = () => {
  const [hasUploadedData, setHasUploadedData] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await getSessionStatus();
        setHasUploadedData(res.has_data);
      } catch (err) {
        console.error("Failed to fetch session status:", err);
        setHasUploadedData(false);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [location.pathname]); // Re-check on nav to keep state fresh

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#020617',
        color: '#fff'
      }}>
        <Loader className="animate-spin" size={32} style={{ color: '#6366f1' }} />
      </div>
    );
  }

  // If no data uploaded, lock routes and force redirect to /upload
  const allowedPaths = ['/upload', '/settings'];
  if (!hasUploadedData && !allowedPaths.includes(location.pathname)) {
    return <Navigate to="/upload" replace />;
  }

  return (
    <div className="layout-container">
      <Sidebar hasUploadedData={hasUploadedData} />
      <div className="layout-main">
        <Topbar />
        <main className="layout-content">
          <Outlet context={{ onUploadSuccess: () => setHasUploadedData(true) }} />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
