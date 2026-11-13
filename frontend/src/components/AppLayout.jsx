// frontend/src/components/AppLayout.jsx
// Main application layout with deep indigo sidebar navigation, top bar, and user indicator.

import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import {
  IconSearch,
  IconBell,
  IconDashboard,
  IconBox,
  IconPlus,
  IconSettings,
  IconLogOut
} from './Icons.jsx';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [topSearch, setTopSearch] = useState('');

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

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (topSearch.trim()) {
      navigate(`/items?search=${encodeURIComponent(topSearch.trim())}`);
    } else {
      navigate('/items');
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : 'CF';

  return (
    <div className="app-shell">
      {/* ── Deep Indigo Sidebar Navigation ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-tile">
            <IconSearch width={22} height={22} strokeWidth={2.5} />
          </div>
          <div>
            <div className="logo-text">CampusFind</div>
            <div className="logo-sub">Lost & Found System</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><IconDashboard width={18} height={18} /></span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/items" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><IconBox width={18} height={18} /></span>
            <span>Browse Items</span>
          </NavLink>
          <NavLink to="/items/new" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><IconPlus width={18} height={18} /></span>
            <span>Report Item</span>
          </NavLink>

          <div className="nav-section-label" style={{ marginTop: 12 }}>Activity</div>
          <NavLink to="/activity" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><IconBell width={18} height={18} /></span>
            <span>Activity Hub</span>
            {unread > 0 && (
              <span className="unread-badge">
                {unread}
              </span>
            )}
          </NavLink>

          {user?.role === 'admin' && (
            <>
              <div className="nav-section-label" style={{ marginTop: 12 }}>Administration</div>
              <NavLink to="/admin" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <span className="nav-icon"><IconSettings width={18} height={18} /></span>
                <span>Admin Panel</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            style={{ marginBottom: 6, padding: '6px 8px' }}
          >
            <div className="user-chip" style={{ padding: 0, background: 'transparent' }}>
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
            <span className="nav-icon"><IconLogOut width={18} height={18} /></span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="main-content">
        {/* ── Top Bar ── */}
        <header className="top-bar">
          <form className="top-bar-search" onSubmit={handleSearchSubmit}>
            <IconSearch width={16} height={16} stroke="#6B7280" />
            <input
              type="text"
              placeholder="Search reports across campus…"
              value={topSearch}
              onChange={e => setTopSearch(e.target.value)}
              aria-label="Search items"
            />
          </form>

          <div className="top-bar-actions">
            <Link
              to="/activity"
              className="top-bar-btn"
              title="Activity & Notifications"
              aria-label="Activity Hub"
            >
              <IconBell width={18} height={18} />
              {unread > 0 && (
                <span className="btn-badge">{unread}</span>
              )}
            </Link>

            <Link
              to="/items/new"
              className="btn btn-primary btn-sm"
              style={{ minHeight: 38 }}
            >
              <IconPlus width={15} height={15} />
              <span>Report Item</span>
            </Link>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
