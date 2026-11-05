// frontend/src/components/AppLayout.jsx
// Main application layout with sidebar navigation and user indicator.

import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    function fetchUnread() {
      api.get('/notifications')
        .then(r => setUnread(r.data.unread || 0))
        .catch(() => {});
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.name
    ? user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : 'CF';

  return (
    <div className="app-shell">
      {/* ── Sidebar Navigation ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-text">
            <span className="logo-icon">🔍</span>
            CampusFind
          </div>
          <div className="logo-sub">Lost & Found System</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">📊</span> Dashboard
          </NavLink>
          <NavLink to="/items" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">📦</span> Browse Items
          </NavLink>
          <NavLink to="/items/new" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">➕</span> Report Item
          </NavLink>

          <div className="nav-section-label" style={{ marginTop: 12 }}>Activity</div>
          <NavLink to="/activity" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">🔔</span> Activity Hub
            {unread > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: 'var(--danger)',
                color: 'white',
                borderRadius: '999px',
                fontSize: '.7rem',
                fontWeight: 700,
                padding: '1px 7px'
              }}>
                {unread}
              </span>
            )}
          </NavLink>

          {user?.role === 'admin' && (
            <>
              <div className="nav-section-label" style={{ marginTop: 12 }}>Administration</div>
              <NavLink to="/admin" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <span className="nav-icon">⚙️</span> Admin Panel
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            style={{ marginBottom: 6 }}
          >
            <div className="user-chip" style={{ padding: 0, gap: 10 }}>
              <div className="avatar">{initials}</div>
              <div className="info">
                <div className="name">{user?.name}</div>
                <div className="role">{user?.role}</div>
              </div>
            </div>
          </NavLink>
          <button
            className="nav-item"
            onClick={handleLogout}
            style={{ width: '100%', cursor: 'pointer', border: 'none', background: 'none' }}
          >
            <span className="nav-icon">🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="main-content">
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
