// frontend/src/pages/ActivityPage.jsx
// Unified hub for: Matches with Match Relevance & Factors, Claims, and Notifications.

import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState('matches');
  const [loading, setLoading] = useState(true);

  // Data states
  const [matches, setMatches] = useState([]);
  const [claimsMine, setClaimsMine] = useState([]);
  const [claimsReceived, setClaimsReceived] = useState([]);
  const [claimsTab, setClaimsTab] = useState('mine');
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  // Claim resolution modal
  const [resolvingClaim, setResolvingClaim] = useState(null);
  const [resolveStatus, setResolveStatus] = useState('approved');
  const [resolveNote, setResolveNote] = useState('');
  const [submittingResolve, setSubmittingResolve] = useState(false);

  useEffect(() => {
    loadAllActivity();
  }, []);

  async function loadAllActivity() {
    setLoading(true);
    try {
      const [mRes, cmRes, crRes, nRes] = await Promise.all([
        api.get('/matches').catch(() => ({ data: { matches: [] } })),
        api.get('/claims/mine').catch(() => ({ data: { claims: [] } })),
        api.get('/claims/received').catch(() => ({ data: { claims: [] } })),
        api.get('/notifications').catch(() => ({ data: { notifications: [], unread: 0 } })),
      ]);

      setMatches(mRes.data.matches || []);
      setClaimsMine(cmRes.data.claims || []);
      setClaimsReceived(crRes.data.claims || []);
      setNotifications(nRes.data.notifications || []);
      setUnreadNotifs(nRes.data.unread || 0);
    } catch (err) {
      toast.error('Failed to load activity updates');
    } finally {
      setLoading(false);
    }
  }

  async function markNotificationRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadNotifs(u => Math.max(0, u - 1));
    } catch {}
  }

  async function markAllNotificationsRead() {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotifs(0);
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to update notifications');
    }
  }

  async function handleResolveSubmit(e) {
    e.preventDefault();
    if (!resolvingClaim) return;
    setSubmittingResolve(true);

    try {
      await api.put(`/claims/${resolvingClaim.id}`, {
        status: resolveStatus,
        admin_note: resolveNote,
      });
      toast.success(`Claim marked as ${resolveStatus}`);
      setResolvingClaim(null);
      setResolveNote('');
      loadAllActivity();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Resolution failed');
    } finally {
      setSubmittingResolve(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <p className="text-muted mt-2">Loading updates…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Activity Hub</h1>
          <p className="text-muted text-sm mt-1">Manage your item matches, ownership claims, and system alerts.</p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          🔗 Matches ({matches.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
          onClick={() => setActiveTab('claims')}
        >
          📋 Claims ({claimsMine.length + claimsReceived.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notifications {unreadNotifs > 0 && `(${unreadNotifs})`}
        </button>
      </div>

      {/* ── MATCHES TAB ── */}
      {activeTab === 'matches' && (
        matches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔗</div>
            <h3>No matches found yet</h3>
            <p>Our matching engine continuously compares active lost and active found reports by category, custom subcategory, specific locations, date, and description.</p>
          </div>
        ) : (
          <div>
            {matches.map(m => {
              const score = parseFloat(m.score);
              const scoreColor = score >= 70 ? 'var(--success)' : score >= 45 ? 'var(--warning)' : 'var(--danger)';
              return (
                <div key={m.id} className="match-card">
                  <div className="match-card-header">
                    <span className="text-sm font-semibold text-muted">
                      Reported {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <span className="text-xs text-muted" style={{ display: 'block' }}>Match Relevance</span>
                      <span className="match-score" style={{ color: scoreColor }}>
                        {score.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="match-body">
                    <div className="match-item">
                      <span className="badge badge-lost mb-2">🔴 Lost Item</span>
                      <h4>{m.lost_title}</h4>
                      {m.lost_subcategory && (
                        <p className="text-xs text-muted">Subcategory: <strong>{m.lost_subcategory}</strong></p>
                      )}
                      {m.lost_specific_location && (
                        <p className="text-xs text-muted">Specific spot: <strong>{m.lost_specific_location}</strong></p>
                      )}
                      <p className="text-sm mt-1">{m.lost_desc}</p>
                      <p className="text-xs text-muted mt-2">Reported by: <strong>{m.lost_reporter}</strong></p>
                    </div>

                    <div className="match-divider">⇔</div>

                    <div className="match-item">
                      <span className="badge badge-found mb-2">🟢 Found Item</span>
                      <h4>{m.found_title}</h4>
                      {m.found_subcategory && (
                        <p className="text-xs text-muted">Subcategory: <strong>{m.found_subcategory}</strong></p>
                      )}
                      {m.found_specific_location && (
                        <p className="text-xs text-muted">Specific spot: <strong>{m.found_specific_location}</strong></p>
                      )}
                      <p className="text-sm mt-1">{m.found_desc}</p>
                      <p className="text-xs text-muted mt-2">Reported by: <strong>{m.found_reporter}</strong></p>
                    </div>
                  </div>

                  {m.factors && (
                    <div style={{ padding: '0 16px 8px', fontSize: '.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                      Matching Factors: {m.factors}
                    </div>
                  )}

                  <div style={{ padding: '0 16px 14px' }}>
                    <div className="score-bar">
                      <div
                        className="score-bar-fill"
                        style={{ width: `${score}%`, background: scoreColor }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── CLAIMS TAB ── */}
      {activeTab === 'claims' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button
              className={`btn btn-sm ${claimsTab === 'mine' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setClaimsTab('mine')}
            >
              My Claims ({claimsMine.length})
            </button>
            <button
              className={`btn btn-sm ${claimsTab === 'received' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setClaimsTab('received')}
            >
              Received Claims ({claimsReceived.length})
            </button>
          </div>

          {claimsTab === 'mine' ? (
            claimsMine.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No claims filed by you</h3>
                <p>When you see an item you lost in the found list, file a claim to recover it.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Your Message</th>
                      <th>Status</th>
                      <th>Finder Response</th>
                      <th>Date Filed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claimsMine.map(c => (
                      <tr key={c.id}>
                        <td className="font-semibold">{c.item_title}</td>
                        <td className="text-sm text-muted">{c.message || '—'}</td>
                        <td>
                          <span className={`badge badge-${c.status}`}>{c.status}</span>
                        </td>
                        <td className="text-sm text-muted">{c.admin_note || '—'}</td>
                        <td className="text-xs text-muted">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            claimsReceived.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📥</div>
                <h3>No incoming claims on your found items</h3>
                <p>When other students claim an item you reported, you will see and verify their claims here.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Claimant</th>
                      <th>Proof Details</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claimsReceived.map(c => (
                      <tr key={c.id}>
                        <td className="font-semibold">{c.item_title}</td>
                        <td>
                          <div className="font-semibold">{c.claimant_name}</div>
                          <div className="text-xs text-muted">{c.claimant_email}</div>
                        </td>
                        <td className="text-sm text-muted">{c.proof || c.message || '—'}</td>
                        <td>
                          <span className={`badge badge-${c.status}`}>{c.status}</span>
                        </td>
                        <td>
                          {c.status === 'pending' ? (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setResolvingClaim(c);
                                setResolveStatus('approved');
                                setResolveNote('');
                              }}
                            >
                              Review & Verify
                            </button>
                          ) : (
                            <span className="text-xs text-muted">Resolved</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {activeTab === 'notifications' && (
        <div style={{ maxWidth: 640 }}>
          {unreadNotifs > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button className="btn btn-ghost btn-sm" onClick={markAllNotificationsRead}>
                Mark all as read
              </button>
            </div>
          )}

          <div className="card">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔔</div>
                <h3>No notifications</h3>
                <p>You are all caught up!</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                  onClick={() => !n.is_read && markNotificationRead(n.id)}
                >
                  <div className="notif-icon" style={{ background: '#EEF2FF', color: 'var(--primary)' }}>
                    {n.type === 'match' ? '🔗' : n.type === 'claim' ? '📋' : '🔔'}
                  </div>
                  <div className="notif-content">
                    <h4>{n.title}</h4>
                    <p>{n.message}</p>
                    <div className="notif-time">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  {!n.is_read && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: 6 }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal for Reviewing and Resolving Claim */}
      {resolvingClaim && (
        <div className="overlay" onClick={() => setResolvingClaim(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Verify Ownership Claim</h3>
              <button className="btn-icon" onClick={() => setResolvingClaim(null)}>✕</button>
            </div>
            <form onSubmit={handleResolveSubmit}>
              <div className="modal-body">
                <p className="text-sm text-muted mb-3">
                  Item: <strong>{resolvingClaim.item_title}</strong><br />
                  Claimant: <strong>{resolvingClaim.claimant_name}</strong> ({resolvingClaim.claimant_email})<br />
                  Student ID: {resolvingClaim.claimant_student_id || '—'}
                </p>

                {resolvingClaim.proof && (
                  <div className="mb-3" style={{ background: 'var(--gray-50)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                    <div className="text-xs font-semibold text-muted mb-1">Claimant's Proof of Ownership</div>
                    <p className="text-sm">{resolvingClaim.proof}</p>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Decision</label>
                  <div className="type-toggle">
                    <button
                      type="button"
                      className={`type-btn found ${resolveStatus === 'approved' ? 'active' : ''}`}
                      onClick={() => setResolveStatus('approved')}
                    >
                      ✅ Approve & Mark Returned
                    </button>
                    <button
                      type="button"
                      className={`type-btn lost ${resolveStatus === 'rejected' ? 'active' : ''}`}
                      onClick={() => setResolveStatus('rejected')}
                    >
                      ❌ Reject Claim
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Note for claimant</label>
                  <textarea
                    className="form-control"
                    placeholder="Instructions for pickup or reason for rejection…"
                    value={resolveNote}
                    onChange={e => setResolveNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setResolvingClaim(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingResolve}>
                  {submittingResolve ? 'Saving…' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
