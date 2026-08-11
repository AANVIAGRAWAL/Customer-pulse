import React from 'react';
import { Bell, User } from 'lucide-react';

const Topbar: React.FC = () => {
  return (
    <header className="topbar">
      <div className="topbar-search">
        <input type="text" placeholder="Search customers..." />
      </div>
      <div className="topbar-user">
        <Bell size={20} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }}></div>
        <User size={20} />
        <span>Admin User</span>
      </div>
    </header>
  );
};

export default Topbar;
