import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  LineChart, 
  PieChart, 
  Lightbulb, 
  Upload, 
  FileText, 
  Settings,
  Lock
} from 'lucide-react';

interface SidebarProps {
  hasUploadedData: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ hasUploadedData }) => {
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, protect: true },
    { path: '/customers', label: 'Customer Explorer', icon: <Users size={20} />, protect: true },
    { path: '/at-risk', label: 'At-Risk Customers', icon: <AlertTriangle size={20} />, protect: true },
    { path: '/churn-analysis', label: 'Churn Analysis', icon: <LineChart size={20} />, protect: true },
    { path: '/segments', label: 'Segments', icon: <PieChart size={20} />, protect: true },
    { path: '/insights', label: 'Insights', icon: <Lightbulb size={20} />, protect: true },
    { path: '/upload', label: 'Upload Data', icon: <Upload size={20} />, protect: false },
    { path: '/reports', label: 'Reports', icon: <FileText size={20} />, protect: true },
    { path: '/settings', label: 'Settings', icon: <Settings size={20} />, protect: false },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-name">CustomerPulse</div>
        <div className="brand-tagline">Turn customer data into retention decisions.</div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isLocked = item.protect && !hasUploadedData;
          
          if (isLocked) {
            return (
              <div 
                key={item.path} 
                className="sidebar-link disabled"
                style={{ 
                  opacity: 0.45, 
                  cursor: 'not-allowed', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  color: 'var(--text-muted)'
                }}
                title="Please upload a CSV file to unlock this page"
              >
                <Lock size={16} />
                <span>{item.label}</span>
              </div>
            );
          }
          
          return (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
