import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, User } from 'lucide-react';

const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const userEmail = user?.email || 'User';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-search">
        <input type="text" placeholder="Search customers..." />
      </div>
      <div className="topbar-user">
        <Bell size={20} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }}></div>
        <div className="user-profile-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={18} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '14px', color: 'var(--text-color)' }}>{userEmail}</span>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginLeft: '12px',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'transparent';
          }}
          title="Log Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
