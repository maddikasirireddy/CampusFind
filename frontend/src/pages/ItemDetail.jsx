// frontend/src/pages/ItemDetail.jsx
// Detailed view of an item with custom subcategory, specific location, and match relevance.

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  IconArrowLeft,
  IconClose,
  IconCheck,
  IconMapPin,
  IconFolder,
  IconTag,
  IconCalendar,
  IconUser,
  ScoreRing,
  IconArrowRight
} from '../components/Icons.jsx';

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
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <IconClose width={18} height={18} />
          </button>
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
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
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
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <IconClose width={18} height={18} />
          </button>
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
                <label className="form-label">Specific Location</label>
                <input
                  className="form-control"
                  placeholder="e.g. 2nd Floor Reading Area"
                  value={form.custom_location}
                  onChange={setField('custom_location')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-control" type="date" value={form.date_occurred} onChange={setField('date_occurred')} />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={setField('status')}>
                  <option value="active">Active</option>
                  <option value="claimed">Claimed</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Colour</label>
                <input className="form-control" value={form.color} onChange={setField('color')} />
              </div>

              <div className="form-group">
                <label className="form-label">Brand</label>
                <input className="form-control" value={form.brand} onChange={setField('brand')} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tags</label>
              <input className="form-control" value={form.tags} onChange={setField('tags')} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
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
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimOpen, setClaimOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get(`/items/${id}`),
      api.get('/items/lookup/categories').catch(() => ({ data: { categories: [] } })),
      api.get('/items/lookup/locations').catch(() => ({ data: { locations: [] } })),
      api.get(`/matches/item/${id}`).catch(() => ({ data: { matches: [] } })),
    ])
      .then(([ir, cr, lr, mr]) => {
        setItem(ir.data.item);
        setCategories(cr.data.categories || []);
        setLocations(lr.data.locations || []);
        setMatches(mr.data.matches || []);
      })
      .catch(err => {
        toast.error('Item not found');
        navigate('/items');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  async function handleDelete() {
    if (!window.confirm('Delete this report permanently?')) return;
    try {
      await api.delete(`/items/${id}`);
      toast.success('Report deleted');
      navigate('/items');
    } catch (err) {
      toast.error('Failed to delete item');
    }
  }

  async function handleMarkReturned() {
    try {
      const res = await api.put(`/items/${id}`, { status: 'returned' });
      setItem(res.data.item);
      toast.success('Marked as returned! Great job!');
    } catch (err) {
      toast.error('Failed to update status');
    }
  }

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <p className="text-sm">Loading report details…</p>
      </div>
    );
  }

  if (!item) return null;

  const isOwner = user?.id === item.user_id;
  const isAdmin = user?.role === 'admin';
  const canEdit = isOwner || isAdmin;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Back button */}
      <div style={{ marginBottom: 18 }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => navigate(-1)}
        >
          <IconArrowLeft width={14} height={14} />
          <span>Back</span>
        </button>
      </div>

      {/* Main card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className={`badge badge-${item.type}`}>
              {item.type === 'lost' ? 'Lost Item' : 'Found Item'}
            </span>
            <span className={`badge badge-${item.status}`}>
              {item.status}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {canEdit && (
              <>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditOpen(true)}>
                  Edit
                </button>
                {item.status !== 'returned' && (
                  <button className="btn btn-primary btn-sm" onClick={handleMarkReturned}>
                    <IconCheck width={14} height={14} />
                    <span>Mark Returned</span>
                  </button>
                )}
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                  Delete
                </button>
              </>
            )}

            {!isOwner && item.type === 'found' && item.status === 'active' && (
              <button className="btn btn-primary" onClick={() => setClaimOpen(true)}>
                Claim Ownership
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          <h1 style={{ fontSize: '1.75rem', marginBottom: 12 }}>{item.title}</h1>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.95rem' }}>{item.description}</p>

          <div className="detail-grid mt-4">
            <div className="detail-field">
              <label>Category & Subcategory</label>
              <p>
                {item.category_name
                  ? `${item.category_icon || '📦'} ${item.category_name}${item.custom_subcategory ? ` › ${item.custom_subcategory}` : ''}`
                  : item.custom_subcategory || 'Uncategorized'}
              </p>
            </div>

            <div className="detail-field">
              <label>Location & Landmark</label>
              <p>
                {item.location_name
                  ? `${item.location_name}${item.custom_location ? ` (${item.custom_location})` : ''}`
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
            <div className="mt-4">
              <label className="form-label" style={{ fontSize: '.75rem', textTransform: 'uppercase', color: '#4B5563' }}>Keywords / Tags</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {item.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                  <span
                    key={t}
                    style={{
                      background: 'var(--bg-page)',
                      color: 'var(--text-body)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '.8rem',
                      border: '1px solid var(--border-card)',
                      fontWeight: 500
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
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3>Reported By</h3>
        </div>
        <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.1rem',
            fontFamily: 'var(--font-heading)'
          }}>
            {item.reporter_name?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || '??'}
          </div>
          <div>
            <div className="font-semibold" style={{ fontSize: '1.05rem' }}>{item.reporter_name}</div>
            <div className="text-sm text-muted">{item.reporter_email}</div>
            {item.reporter_phone && <div className="text-sm text-muted mt-1">📞 {item.reporter_phone}</div>}
          </div>
        </div>
      </div>

      {/* Matches Redesign */}
      {matches.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>Automated System Matches ({matches.length})</h3>
          </div>
          <div className="card-body">
            {matches.map(m => {
              const score = parseFloat(m.score);
              const targetId = item.id === m.lost_id ? m.found_id : m.lost_id;
              return (
                <div key={m.id} className="match-card">
                  <div className="match-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <ScoreRing score={score} size={48} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Match Relevance</div>
                        <div className="text-xs text-muted">Algorithm calculated probability</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/items/${targetId}`)}
                    >
                      <span>Review</span>
                      <IconArrowRight width={14} height={14} />
                    </button>
                  </div>

                  <div className="match-body">
                    <div className="match-item">
                      <span className="badge badge-lost mb-2">Lost Item</span>
                      <h4>{m.lost_title}</h4>
                      <p className="text-xs text-muted">{m.lost_desc}</p>
                      {m.lost_specific_location && (
                        <div className="text-xs text-muted mt-1">📍 {m.lost_specific_location}</div>
                      )}
                      <div className="text-xs text-muted mt-2">by {m.lost_reporter}</div>
                    </div>

                    <div className="match-divider">
                      <IconArrowRight width={18} height={18} />
                    </div>

                    <div className="match-item">
                      <span className="badge badge-found mb-2">Found Item</span>
                      <h4>{m.found_title}</h4>
                      <p className="text-xs text-muted">{m.found_desc}</p>
                      {m.found_specific_location && (
                        <div className="text-xs text-muted mt-1">📍 {m.found_specific_location}</div>
                      )}
                      <div className="text-xs text-muted mt-2">by {m.found_reporter}</div>
                    </div>
                  </div>

                  {m.factors && (
                    <div className="match-footer">
                      <span className="match-factors">
                        Factors: {m.factors}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {claimOpen && (
        <ClaimModal
          item={item}
          onClose={() => setClaimOpen(false)}
          onSuccess={() => setClaimOpen(false)}
        />
      )}

      {editOpen && (
        <EditModal
          item={item}
          categories={categories}
          locations={locations}
          onClose={() => setEditOpen(false)}
          onSaved={updated => {
            setItem(updated);
            setEditOpen(false);
          }}
        />
      )}
    </div>
  );
}
