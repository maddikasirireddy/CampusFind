// frontend/src/pages/NewItem.jsx
// Report Lost or Found belongings with Category, optional custom Subcategory, Campus Location, and Specific Location.

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { IconAlertCircle, IconBox, IconCheck } from '../components/Icons.jsx';

export default function NewItem() {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    type: location.state?.type || 'lost',
    title: '',
    description: '',
    category_id: '',
    custom_subcategory: '',
    location_id: '',
    custom_location: '',
    date_occurred: '',
    color: '',
    brand: '',
    tags: '',
  });

  useEffect(() => {
    api.get('/items/lookup/categories').then(r => setCategories(r.data.categories)).catch(() => {});
    api.get('/items/lookup/locations').then(r => setLocations(r.data.locations)).catch(() => {});
  }, []);

  function setField(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.category_id) delete payload.category_id;
      if (!payload.custom_subcategory) delete payload.custom_subcategory;
      if (!payload.location_id) delete payload.location_id;
      if (!payload.custom_location) delete payload.custom_location;
      if (!payload.date_occurred) delete payload.date_occurred;

      const res = await api.post('/items', payload);
      toast.success('Item reported successfully!');
      navigate(`/items/${res.data.item.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1>Report an Item</h1>
          <p className="text-muted text-sm mt-1">
            Fill in item details for relevance-based matching and verification.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Type toggle */}
            <div className="form-group">
              <label className="form-label">I am reporting a…</label>
              <div className="type-toggle">
                <button
                  type="button"
                  className={`type-btn lost ${form.type === 'lost' ? 'active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, type: 'lost' }))}
                >
                  <IconAlertCircle width={16} height={16} />
                  <span>Lost Item</span>
                </button>
                <button
                  type="button"
                  className={`type-btn found ${form.type === 'found' ? 'active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, type: 'found' }))}
                >
                  <IconBox width={16} height={16} />
                  <span>Found Item</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                className="form-control"
                placeholder="e.g. Wireless Earbuds in black charging case"
                value={form.title}
                onChange={setField('title')}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                className="form-control"
                placeholder="Describe features, marks, inside contents, model, or condition…"
                value={form.description}
                onChange={setField('description')}
                required
              />
            </div>

            {/* Category & Custom Subcategory */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={form.category_id}
                  onChange={setField('category_id')}
                >
                  <option value="">Select category (optional)</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subcategory (Optional)</label>
                <input
                  className="form-control"
                  placeholder="e.g. Wireless Earbuds, Scientific Calculator"
                  value={form.custom_subcategory}
                  onChange={setField('custom_subcategory')}
                />
              </div>
            </div>

            {/* Campus Location & Specific Location */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Campus Location</label>
                <select
                  className="form-control"
                  value={form.location_id}
                  onChange={setField('location_id')}
                >
                  <option value="">Select campus location (optional)</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Specific Location / Landmark</label>
                <input
                  className="form-control"
                  placeholder="e.g. 2nd Floor Reading Area, Lab Table 5"
                  value={form.custom_location}
                  onChange={setField('custom_location')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date {form.type === 'lost' ? 'Lost' : 'Found'}</label>
                <input
                  className="form-control"
                  type="date"
                  value={form.date_occurred}
                  onChange={setField('date_occurred')}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Colour</label>
                <input
                  className="form-control"
                  placeholder="e.g. Black, Silver, Navy Blue"
                  value={form.color}
                  onChange={setField('color')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Brand / Make</label>
                <input
                  className="form-control"
                  placeholder="e.g. Apple, Dell, Boat, Casio"
                  value={form.brand}
                  onChange={setField('brand')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Keywords / Tags</label>
                <input
                  className="form-control"
                  placeholder="Comma-separated: earbuds, earphones, black, case"
                  value={form.tags}
                  onChange={setField('tags')}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 14 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/items')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
