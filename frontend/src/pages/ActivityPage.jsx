// frontend/src/pages/ActivityPage.jsx
// Activity Hub: Matches, Claims lifecycle, and Notification center.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  IconLink,
  IconFileText,
  IconBell,
  IconCheck,
  IconClose,
  IconArrowRight,
  ScoreRing,
  IconFolder
} from '../components/Icons.jsx';

export default function ActivityPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('matches');

  const [matches, setMatches]             = useState([]);
  const [claimsMine, setClaimsMine]       = useState([]);
  const [claimsReceived, setClaimsReceived] = useState([]);
  const [claimsTab, setClaimsTab]         = useState('mine');

  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
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
      setUnread(nRes.data.unread || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimAction(claimId, status) {
    try {
      await api.put(`/claims/${claimId}`, { status });
      toast.success(`Claim ${status}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update claim');
    }
  }

  async function handleMarkRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (_) {}
  }

  async function handleMarkAllRead() {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
      toast.success('All marked as read');
    } catch (_) {}
  }

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <p className="text-sm">Loading activity hub…</p>
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

      {/* ── Sub Navigation Tabs ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          <IconLink width={16} height={16} />
          <span>Matches ({matches.length})</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
          onClick={() => setActiveTab('claims')}
        >
          <IconFileText width={16} height={16} />
          <span>Claims ({claimsMine.length + claimsReceived.length})</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <IconBell width={16} height={16} />
          <span>Notifications</span>
          {unread > 0 && (
            <span style={{
              background: 'var(--amber)',
              color: 'var(--indigo-dark)',
              borderRadius: '999px',
              fontSize: '.72rem',
              fontWeight: 800,
              padding: '1px 7px'
            }}>
              {unread}
            </span>
          )}
        </button>
      </div>

      {/* ── MATCHES TAB ── */}
      {activeTab === 'matches' && (
        matches.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon-wrap">
              <IconLink width={24} height={24} />
            </div>
            <h3>No matches found yet</h3>
            <p>Our matching engine continuously compares active lost and active found reports across campus.</p>
          </div>
        ) : (
          <div>
            {matches.map(m => {
              const score = parseFloat(m.score);
              return (
                <div key={m.id} className="match-card">
                  <div className="match-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <ScoreRing score={score} size={48} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Match Relevance</div>
                        <div className="text-xs text-muted">
                          Reported {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/items/${m.found_id}`)}
                    >
                      <span>Review</span>
                      <IconArrowRight width={14} height={14} />
                    </button>
                  </div>

                  <div className="match-body">
                    <div className="match-item">
                      <span className="badge badge-lost mb-2">Lost Item</span>
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

                    <div className="match-divider">
                      <IconArrowRight width={18} height={18} />
                    </div>

                    <div className="match-item">
                      <span className="badge badge-found mb-2">Found Item</span>
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
                    <div className="match-footer">
                      <span className="match-factors">
                        Matching Factors: {m.factors}
                      </span>
                    </div>
                  )}
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
              type="button"
              className={`btn btn-sm ${claimsTab === 'mine' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setClaimsTab('mine')}
            >
              My Claims ({claimsMine.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${claimsTab === 'received' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setClaimsTab('received')}
            >
              Received Claims ({claimsReceived.length})
            </button>
          </div>

          {claimsTab === 'mine' ? (
            claimsMine.length === 0 ? (
              <div className="empty-state card">
                <div className="empty-icon-wrap">
                  <IconFileText width={24} height={24} />
                </div>
                <h3>No claims filed by you</h3>
                <p>When you see an item you lost in the found list, file a claim to recover it.</p>
              </div>
            ) : (
              <div className="card">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Message</th>
                        <th>Proof of Ownership</th>
                        <th>Status</th>
                        <th>Filed On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claimsMine.map(c => (
                        <tr key={c.id}>
                          <td className="font-semibold">
                            <span style={{ cursor: 'pointer', color: 'var(--primary)' }} onClick={() => navigate(`/items/${c.item_id}`)}>
                              {c.item_title}
                            </span>
                          </td>
                          <td className="text-sm text-muted">{c.message}</td>
                          <td className="text-sm text-muted">{c.proof}</td>
                          <td>
                            <span className={`badge badge-${c.status}`}>{c.status}</span>
                          </td>
                          <td className="text-xs text-muted">
                            {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            claimsReceived.length === 0 ? (
              <div className="empty-state card">
                <div className="empty-icon-wrap">
                  <IconFileText width={24} height={24} />
                </div>
                <h3>No claims received yet</h3>
                <p>When another student claims ownership of an item you found, you will review it here.</p>
              </div>
            ) : (
              <div className="card">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Claimed Item</th>
                        <th>Claimant</th>
                        <th>Message</th>
                        <th>Proof Details</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claimsReceived.map(c => (
                        <tr key={c.id}>
                          <td className="font-semibold">
                            <span style={{ cursor: 'pointer', color: 'var(--primary)' }} onClick={() => navigate(`/items/${c.item_id}`)}>
                              {c.item_title}
                            </span>
                          </td>
                          <td className="text-sm">{c.claimant_name}</td>
                          <td className="text-sm text-muted">{c.message}</td>
                          <td className="text-sm text-muted">{c.proof}</td>
                          <td>
                            <span className={`badge badge-${c.status}`}>{c.status}</span>
                          </td>
                          <td>
                            {c.status === 'pending' && (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleClaimAction(c.id, 'approved')}
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => handleClaimAction(c.id, 'rejected')}
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {activeTab === 'notifications' && (
        <div>
          {notifications.length > 0 && unread > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-icon-wrap">
                <IconBell width={24} height={24} />
              </div>
              <h3>No notifications</h3>
              <p>You're all caught up! New alerts and matches will appear here.</p>
            </div>
          ) : (
            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Message</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map(n => (
                      <tr
                        key={n.id}
                        style={{
                          background: n.is_read ? 'transparent' : 'rgba(79, 70, 229, 0.03)',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          if (!n.is_read) handleMarkRead(n.id);
                          if (n.ref_type === 'item') navigate(`/items/${n.ref_id}`);
                        }}
                      >
                        <td className="font-semibold">{n.title}</td>
                        <td className="text-sm text-muted">{n.message}</td>
                        <td className="text-xs text-muted">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </td>
                        <td>
                          {n.is_read ? (
                            <span className="text-xs text-muted">Read</span>
                          ) : (
                            <span className="badge badge-active">Unread</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
