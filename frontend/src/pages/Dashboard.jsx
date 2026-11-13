// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import { formatDistanceToNow } from 'date-fns';
import {
  IconPlus,
  IconCheckCircle,
  IconAlertCircle,
  IconBox,
  IconLink,
  IconFileText,
  IconUsers,
  IconArrowRight,
  IconFolder
} from '../components/Icons.jsx';

function StatCard({ icon, label, value, color, highlight = false }) {
  return (
    <div className={`stat-card ${highlight ? 'highlight-returned' : ''}`}>
      <div
        className="stat-icon-tile"
        style={{
          background: highlight ? '#FDE68A' : color + '1A',
          color: highlight ? '#92400E' : color
        }}
      >
        {icon}
      </div>
      <div className="stat-info">
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <p className="text-sm">Loading dashboard…</p>
      </div>
    );
  }

  const gs = data?.globalStats || {};
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  const myLost     = data?.myItems?.filter(r => r.type === 'lost').reduce((s, r) => s + parseInt(r.count, 10), 0) || 0;
  const myFound    = data?.myItems?.filter(r => r.type === 'found').reduce((s, r) => s + parseInt(r.count, 10), 0) || 0;
  const myReturned = data?.myItems?.filter(r => r.status === 'returned').reduce((s, r) => s + parseInt(r.count, 10), 0) || 0;

  function typeBadge(type) {
    return (
      <span className={`badge badge-${type}`}>
        {type === 'lost' ? 'Lost' : 'Found'}
      </span>
    );
  }

  function statusBadge(status) {
    return <span className={`badge badge-${status}`}>{status}</span>;
  }

  return (
    <div>
      {/* ── Hero Banner (Solid #4F46E5, 22px radius) ── */}
      <section className="hero-banner">
        <div className="hero-content">
          <h1 className="hero-headline">
            Welcome back, {firstName}. Let's get your things home.
          </h1>
          <p className="hero-subtext">
            Search active campus reports, track automated similarity matches, or report a lost item in seconds.
          </p>
          <div className="hero-actions">
            <Link
              to="/items/new"
              state={{ type: 'lost' }}
              className="btn btn-hero-primary"
            >
              <IconPlus width={16} height={16} />
              <span>Report lost item</span>
            </Link>
            <Link
              to="/items/new"
              state={{ type: 'found' }}
              className="btn btn-hero-secondary"
            >
              <IconBox width={16} height={16} />
              <span>I found something</span>
            </Link>
          </div>
        </div>

        {/* Geometric illustration on the right (hidden on mobile <= 560px) */}
        <div className="hero-illustration" aria-hidden="true">
          <svg width="220" height="150" viewBox="0 0 220 150" fill="none">
            <circle cx="110" cy="75" r="60" stroke="#818CF8" strokeWidth="2" strokeDasharray="6 6" opacity="0.4" />
            <circle cx="110" cy="75" r="42" fill="#3730A3" opacity="0.6" />
            <rect x="75" y="45" width="70" height="60" rx="14" fill="#6366F1" opacity="0.8" />
            <circle cx="95" cy="65" r="12" fill="#FBBF24" />
            <rect x="115" y="60" width="20" height="10" rx="5" fill="#E0E7FF" />
            <rect x="90" y="85" width="45" height="8" rx="4" fill="#C7D2FE" />
            <circle cx="170" cy="40" r="8" fill="#FBBF24" opacity="0.8" />
            <circle cx="50" cy="110" r="10" fill="#818CF8" opacity="0.5" />
          </svg>
        </div>
      </section>

      {/* ── Campus Overview Stats ── */}
      <div className="section-title">Campus Overview</div>
      <div className="stat-grid">
        <StatCard
          icon={<IconAlertCircle width={22} height={22} />}
          label="Active Lost Reports"
          value={gs.total_lost}
          color="#EF4444"
        />
        <StatCard
          icon={<IconBox width={22} height={22} />}
          label="Active Found Items"
          value={gs.total_found}
          color="#10B981"
        />
        <StatCard
          icon={<IconCheckCircle width={22} height={22} />}
          label="Items Returned"
          value={gs.total_returned}
          color="#10B981"
          highlight={true}
        />
        <StatCard
          icon={<IconLink width={22} height={22} />}
          label="Pending Matches"
          value={gs.total_matches}
          color="#4F46E5"
        />
        <StatCard
          icon={<IconFileText width={22} height={22} />}
          label="Pending Claims"
          value={gs.pending_claims}
          color="#F59E0B"
        />
        <StatCard
          icon={<IconUsers width={22} height={22} />}
          label="Registered Students"
          value={gs.total_students}
          color="#3B82F6"
        />
      </div>

      {/* ── My Activity Stats ── */}
      <div className="section-title" style={{ marginTop: 28 }}>My Activity</div>
      <div className="stat-grid">
        <StatCard
          icon={<IconAlertCircle width={22} height={22} />}
          label="My Lost Reports"
          value={myLost}
          color="#EF4444"
        />
        <StatCard
          icon={<IconBox width={22} height={22} />}
          label="My Found Reports"
          value={myFound}
          color="#10B981"
        />
        <StatCard
          icon={<IconLink width={22} height={22} />}
          label="My Active Matches"
          value={data?.myMatches}
          color="#4F46E5"
        />
        <StatCard
          icon={<IconCheckCircle width={22} height={22} />}
          label="Items I've Returned"
          value={myReturned}
          color="#10B981"
        />
      </div>

      {/* ── Recent Reports ── */}
      <div style={{ marginTop: 28 }}>
        <div className="card">
          <div className="card-header">
            <h3>Recent Reports</h3>
            <Link to="/items" className="btn btn-ghost btn-sm">
              <span>View all</span>
              <IconArrowRight width={14} height={14} />
            </Link>
          </div>

          {data?.recentItems?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <IconFolder width={24} height={24} />
              </div>
              <h3>No items reported yet</h3>
              <p>Reports will appear here as soon as students submit lost or found belongings.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Reported by</th>
                    <th>Status</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentItems?.map(item => (
                    <tr
                      key={item.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/items/${item.id}`)}
                    >
                      <td className="font-semibold">
                        <span style={{ marginRight: 6 }}>{item.category_icon || '📦'}</span>
                        {item.title}
                      </td>
                      <td>{typeBadge(item.type)}</td>
                      <td className="text-muted text-sm">{item.category_name || '—'}</td>
                      <td className="text-sm">{item.reporter_name}</td>
                      <td>{statusBadge(item.status)}</td>
                      <td className="text-muted text-xs">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
