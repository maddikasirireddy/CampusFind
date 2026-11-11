// frontend/src/pages/AdminPage.jsx
// Administrator panel for student role updates, system stats, and oversight.

import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [sRes, uRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
      ]);
      setStats(sRes.data.stats);
      setUsers(uRes.data.users);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  async function toggleRole(u) {
    const newRole = u.role === 'admin' ? 'student' : 'admin';
    try {
      await api.put(`/admin/users/${u.id}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      setUsers(prev => prev.map(item => (item.id === u.id ? { ...item, role: newRole } : item)));
    } catch {
      toast.error('Failed to change role');
    }
  }

  async function deleteUser(id) {
    if (!window.confirm('Delete this user? All their reports and claims will be removed.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User removed');
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch {
      toast.error('Failed to delete user');
    }
  }

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin Control Panel</h1>
          <p className="text-muted text-sm mt-1">Manage users, view global system statistics and audit logs.</p>
        </div>
      </div>

      {stats && (
        <div className="stat-grid mb-4">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#EEF2FF', color: 'var(--primary)' }}>👥</div>
            <div>
              <div className="stat-value">{stats.total_users}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#FEE2E2', color: 'var(--danger)' }}>📦</div>
            <div>
              <div className="stat-value">{stats.total_items}</div>
              <div className="stat-label">Total Items</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#D1FAE5', color: 'var(--success)' }}>✅</div>
            <div>
              <div className="stat-value">{stats.returned_items}</div>
              <div className="stat-label">Returned Items</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#FEF3C7', color: 'var(--warning)' }}>📋</div>
            <div>
              <div className="stat-value">{stats.total_claims}</div>
              <div className="stat-label">Claims Filed</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Registered Users ({users.length})</h3>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Student ID</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="font-semibold">{u.name}</td>
                  <td className="text-sm">{u.email}</td>
                  <td className="text-sm text-muted">{u.student_id}</td>
                  <td>
                    <span className={`badge badge-${u.role}`}>{u.role}</span>
                  </td>
                  <td className="text-xs text-muted">
                    {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleRole(u)}
                        title="Toggle role"
                      >
                        {u.role === 'admin' ? 'Make Student' : 'Make Admin'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteUser(u.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
