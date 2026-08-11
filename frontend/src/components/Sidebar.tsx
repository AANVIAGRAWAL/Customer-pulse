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
  Settings 
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/customers', label: 'Customer Explorer', icon: <Users size={20} /> },
    { path: '/at-risk', label: 'At-Risk Customers', icon: <AlertTriangle size={20} /> },
    { path: '/churn-analysis', label: 'Churn Analysis', icon: <LineChart size={20} /> },
    { path: '/segments', label: 'Segments', icon: <PieChart size={20} /> },
    { path: '/insights', label: 'Insights', icon: <Lightbulb size={20} /> },
    { path: '/upload', label: 'Upload Data', icon: <Upload size={20} /> },
    { path: '/reports', label: 'Reports', icon: <FileText size={20} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-name">CustomerPulse</div>
        <div className="brand-tagline">Turn customer data into retention decisions.</div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
