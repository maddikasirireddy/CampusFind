// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import { formatDistanceToNow } from 'date-fns';

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + '22', fontSize: '1.4rem' }}>
        {icon}
      </div>
      <div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /><p>Loading dashboard…</p></div>;

  const gs = data?.globalStats || {};

  // Compute my item counts
  function myCount(type, status) {
    if (!data?.myItems) return 0;
    const row = data.myItems.find(r => r.type === type && r.status === status);
    return parseInt(row?.count || 0, 10);
  }
  const myLost    = data?.myItems?.filter(r => r.type === 'lost').reduce((s, r) => s + parseInt(r.count, 10), 0) || 0;
  const myFound   = data?.myItems?.filter(r => r.type === 'found').reduce((s, r) => s + parseInt(r.count, 10), 0) || 0;
  const myReturned = data?.myItems?.filter(r => r.status === 'returned').reduce((s, r) => s + parseInt(r.count, 10), 0) || 0;

  function typeBadge(type) {
    return <span className={`badge badge-${type}`}>{type === 'lost' ? '🔴 Lost' : '🟢 Found'}</span>;
  }

  function statusBadge(status) {
    return <span className={`badge badge-${status}`}>{status}</span>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>👋 Welcome, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-muted text-sm mt-1">Here's what's happening on campus today.</p>
        </div>
        <Link to="/items/new" className="btn btn-primary">
          ➕ Report Item
        </Link>
      </div>

      {/* ── Campus-wide stats ── */}
      <h4 style={{marginBottom:12,color:'var(--gray-500)',fontSize:'.78rem',fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase'}}>Campus Overview</h4>
      <div className="stat-grid">
        <StatCard icon="🔴" label="Active Lost Reports" value={gs.total_lost}     color="#EF4444" />
        <StatCard icon="🟢" label="Active Found Items"  value={gs.total_found}    color="#10B981" />
        <StatCard icon="✅" label="Items Returned"       value={gs.total_returned} color="#10B981" />
        <StatCard icon="🔗" label="Pending Matches"     value={gs.total_matches}  color="#4F46E5" />
        <StatCard icon="📋" label="Pending Claims"      value={gs.pending_claims} color="#F59E0B" />
        <StatCard icon="👥" label="Registered Students" value={gs.total_students} color="#3B82F6" />
      </div>

      {/* ── My stats ── */}
      <h4 style={{marginBottom:12,color:'var(--gray-500)',fontSize:'.78rem',fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase',marginTop:28}}>My Activity</h4>
      <div className="stat-grid">
        <StatCard icon="📋" label="My Lost Reports" value={myLost}          color="#EF4444" />
        <StatCard icon="📦" label="My Found Reports" value={myFound}        color="#10B981" />
        <StatCard icon="🔗" label="My Active Matches" value={data?.myMatches} color="#4F46E5" />
        <StatCard icon="✅" label="Items I've Returned" value={myReturned}  color="#10B981" />
      </div>

      {/* ── Recent items ── */}
      <div style={{marginTop:28}}>
        <div className="card">
          <div className="card-header">
            <h3>Recent Reports</h3>
            <Link to="/items" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {data?.recentItems?.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📭</div><h3>No items yet</h3></div>
          ) : (
            <div className="table-wrapper" style={{border:'none',borderRadius:0}}>
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
                    <tr key={item.id} style={{cursor:'pointer'}} onClick={() => window.location.href = `/items/${item.id}`}>
                      <td className="font-semibold">{item.category_icon} {item.title}</td>
                      <td>{typeBadge(item.type)}</td>
                      <td className="text-muted text-sm">{item.category_name || '—'}</td>
                      <td className="text-sm">{item.reporter_name}</td>
                      <td>{statusBadge(item.status)}</td>
                      <td className="text-muted text-xs">{formatDistanceToNow(new Date(item.created_at), {addSuffix:true})}</td>
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

