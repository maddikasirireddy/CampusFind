// frontend/src/pages/ItemDetail.jsx
// Detailed view of an item with custom subcategory, specific location, and match relevance.

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function ClaimModal({ item, onClose, onSuccess }) {
  const [form, setForm] = useState({ message: '', proof: '' });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/claims', { item_id: item.id, ...form });
      toast.success('Ownership claim submitted!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit claim');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Claim Item Ownership</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <p className="text-sm text-muted mb-3">
              Claiming: <strong>{item.title}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">Message for finder</label>
              <textarea
                className="form-control"
                placeholder="Where you lost it, identifying marks, inside contents…"
                value={form.message}
                onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Proof of Ownership</label>
              <textarea
                className="form-control"
                placeholder="Specific details only the real owner knows (e.g. wallpaper, serial number, keychain style)…"
                value={form.proof}
                onChange={e => setForm(prev => ({ ...prev, proof: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditModal({ item, categories, locations, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: item.title,
    description: item.description,
    category_id: item.category_id || '',
    custom_subcategory: item.custom_subcategory || '',
    location_id: item.location_id || '',
    custom_location: item.custom_location || '',
    date_occurred: item.date_occurred ? item.date_occurred.slice(0, 10) : '',
    color: item.color || '',
    brand: item.brand || '',
    tags: item.tags || '',
    status: item.status,
  });

  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.category_id) payload.category_id = null;
      if (!payload.custom_subcategory) payload.custom_subcategory = null;
      if (!payload.location_id) payload.location_id = null;
      if (!payload.custom_location) payload.custom_location = null;

      const res = await api.put(`/items/${item.id}`, payload);
      toast.success('Report updated');
      onSaved(res.data.item);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  }

  const setField = field => e => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Item Report</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-control" value={form.title} onChange={setField('title')} required />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" value={form.description} onChange={setField('description')} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={form.category_id} onChange={setField('category_id')}>
                  <option value="">None</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subcategory (Optional)</label>
                <input
                  className="form-control"
                  placeholder="e.g. Wireless Earbuds"
                  value={form.custom_subcategory}
                  onChange={setField('custom_subcategory')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Campus Location</label>
                <select className="form-control" value={form.location_id} onChange={setField('location_id')}>
                  <option value="">None</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Specific Location / Landmark</label>
                <input
                  className="form-control"
                  placeholder="e.g. 2nd Floor Reading Area, Table 5"
                  value={form.custom_location}
                  onChange={setField('custom_location')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={setField('status')}>
                  <option value="active">Active</option>
                  <option value="claimed">Claimed</option>
                  <option value="returned">Returned</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  className="form-control"
                  type="date"
                  value={form.date_occurred}
                  onChange={setField('date_occurred')}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClaim, setShowClaim] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/items/${id}`),
      api.get(`/matches/item/${id}`).catch(() => ({ data: { matches: [] } })),
      api.get('/items/lookup/categories').catch(() => ({ data: { categories: [] } })),
      api.get('/items/lookup/locations').catch(() => ({ data: { locations: [] } })),
    ]).then(([ir, mr, cr, lr]) => {
      setItem(ir.data.item);
      setMatches(mr.data.matches || []);
      setCategories(cr.data.categories || []);
      setLocations(lr.data.locations || []);
    }).catch(() => {
      toast.error('Failed to load item');
      navigate('/items');
    }).finally(() => setLoading(false));
  }, [id, navigate]);

  async function deleteItem() {
    if (!window.confirm('Delete this report permanently?')) return;
    try {
      await api.delete(`/items/${id}`);
      toast.success('Item deleted');
      navigate('/items');
    } catch {
      toast.error('Failed to delete item');
    }
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!item) return null;

  const isOwner = user?.id === item.user_id || user?.role === 'admin';
  const canClaim = item.type === 'found' && item.status === 'active' && user?.id !== item.user_id;

  return (
    <div style={{ maxWidth: 760 }}>
      {showClaim && (
        <ClaimModal
          item={item}
          onClose={() => setShowClaim(false)}
          onSuccess={() => { setShowClaim(false); setItem(i => ({ ...i, status: 'claimed' })); }}
        />
      )}

      {showEdit && (
        <EditModal
          item={item}
          categories={categories}
          locations={locations}
          onClose={() => setShowEdit(false)}
          onSaved={updated => { setItem(updated); setShowEdit(false); }}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
            <span className={`badge badge-${item.type}`}>
              {item.type === 'lost' ? '🔴 Lost Item' : '🟢 Found Item'}
            </span>
            <span className={`badge badge-${item.status}`}>{item.status}</span>
          </div>
          <h1>{item.category_icon || '📦'} {item.title}</h1>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {canClaim && (
            <button className="btn btn-primary" onClick={() => setShowClaim(true)}>
              📋 Claim This Item
            </button>
          )}
          {isOwner && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowEdit(true)}>
              ✏️ Edit
            </button>
          )}
          {isOwner && (
            <button className="btn btn-danger btn-sm" onClick={deleteItem}>
              🗑️ Delete
            </button>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="detail-section">
            <h4 className="mb-2">Description</h4>
            <p style={{ whiteSpace: 'pre-wrap' }}>{item.description}</p>
          </div>

          <div className="detail-grid mt-3">
            <div className="detail-field">
              <label>Category & Subcategory</label>
              <p>
                {item.category_name
                  ? `${item.category_icon || '📦'} ${item.category_name}${item.custom_subcategory ? ` › ${item.custom_subcategory}` : ''}`
                  : item.custom_subcategory || 'Uncategorized'}
              </p>
            </div>

            <div className="detail-field">
              <label>Campus Location & Specific Spot</label>
              <p>
                {item.location_name
                  ? `📍 ${item.location_name}${item.custom_location ? ` (${item.custom_location})` : ''}`
                  : item.custom_location || 'Not specified'}
              </p>
            </div>

            <div className="detail-field">
              <label>Colour</label>
              <p>{item.color || '—'}</p>
            </div>

            <div className="detail-field">
              <label>Brand / Make</label>
              <p>{item.brand || '—'}</p>
            </div>

            <div className="detail-field">
              <label>Date {item.type === 'lost' ? 'Lost' : 'Found'}</label>
              <p>{item.date_occurred ? format(new Date(item.date_occurred), 'dd MMM yyyy') : '—'}</p>
            </div>

            <div className="detail-field">
              <label>Reported On</label>
              <p>{format(new Date(item.created_at), 'dd MMM yyyy, h:mm a')}</p>
            </div>
          </div>

          {item.tags && (
            <div className="mt-3">
              <label className="form-label" style={{ fontSize: '.75rem' }}>Tags</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {item.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                  <span
                    key={t}
                    style={{
                      background: 'var(--gray-100)',
                      color: 'var(--gray-700)',
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: '.75rem'
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reporter Contact Info */}
      <div className="card mb-4">
        <div className="card-header">
          <h3>Reported By</h3>
        </div>
        <div className="card-body" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700
          }}>
            {item.reporter_name?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || '??'}
          </div>
          <div>
            <div className="font-semibold">{item.reporter_name}</div>
            <div className="text-sm text-muted">{item.reporter_email}</div>
            {item.reporter_phone && <div className="text-sm text-muted">📞 {item.reporter_phone}</div>}
          </div>
        </div>
      </div>

      {/* Matches */}
      {matches.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>🔗 System Matches ({matches.length})</h3>
          </div>
          <div className="card-body">
            {matches.map(m => {
              const score = parseFloat(m.score);
              return (
                <div key={m.id} className="match-card">
                  <div className="match-card-header">
                    <span className="text-sm font-semibold text-muted">Match Relevance</span>
                    <span className="match-score">{score.toFixed(0)}%</span>
                  </div>
                  <div className="match-body">
                    <div className="match-item">
                      <span className="badge badge-lost mb-1">🔴 Lost</span>
                      <h4>{m.lost_title}</h4>
                      <p>{m.lost_desc}</p>
                      <p className="text-xs text-muted mt-1">by {m.lost_reporter}</p>
                    </div>
                    <div className="match-divider">⇔</div>
                    <div className="match-item">
                      <span className="badge badge-found mb-1">🟢 Found</span>
                      <h4>{m.found_title}</h4>
                      <p>{m.found_desc}</p>
                      <p className="text-xs text-muted mt-1">by {m.found_reporter}</p>
                    </div>
                  </div>
                  {m.factors && (
                    <div style={{ padding: '0 16px 12px', fontSize: '.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                      Factors: {m.factors}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
