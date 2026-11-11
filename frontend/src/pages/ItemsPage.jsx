// frontend/src/pages/ItemsPage.jsx
// Browse lost & found reports with Category, Subcategory, Location, and Specific Location details.

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { formatDistanceToNow } from 'date-fns';

function ItemCard({ item, onClick }) {
  return (
    <div className="item-card" onClick={onClick}>
      <div className="item-card-header">
        <div className="cat-icon">{item.category_icon || '📦'}</div>
        <div style={{ flex: 1, minWidth: 0, marginLeft: 8 }}>
          <div className="item-card-title">{item.title}</div>
          <span className={`badge badge-${item.type}`} style={{ marginTop: 3 }}>
            {item.type === 'lost' ? '🔴 Lost' : '🟢 Found'}
          </span>
        </div>
        <span className={`badge badge-${item.status}`}>{item.status}</span>
      </div>

      <div className="item-card-body">
        <div className="item-card-desc">{item.description}</div>
        <div className="item-card-meta">
          {item.category_name && (
            <span>📂 {item.category_name}{item.custom_subcategory ? ` › ${item.custom_subcategory}` : ''}</span>
          )}
          {item.location_name && (
            <span>📍 {item.location_name}{item.custom_location ? ` (${item.custom_location})` : ''}</span>
          )}
          {!item.location_name && item.custom_location && (
            <span>📍 {item.custom_location}</span>
          )}
          {item.color && <span>🎨 {item.color}</span>}
          {item.brand && <span>🏷️ {item.brand}</span>}
        </div>
      </div>

      <div className="item-card-footer">
        <span>by {item.reporter_name}</span>
        <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
      </div>
    </div>
  );
}

export default function ItemsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  const [filters, setFilters] = useState({
    type: '',
    category_id: '',
    subcategory: '',
    location_id: '',
    status: '',
    keyword: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    api.get('/items/lookup/categories').then(r => setCategories(r.data.categories)).catch(() => {});
    api.get('/items/lookup/locations').then(r => setLocations(r.data.locations)).catch(() => {});
  }, []);

  const fetchItems = useCallback(() => {
    setLoading(true);
    const params = { ...filters, page, limit: 18 };
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });

    api.get('/items', { params })
      .then(r => {
        setItems(r.data.items);
        setTotal(r.data.total);
        setPages(r.data.pages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function handleFilterChange(field) {
    return e => {
      setFilters(prev => ({ ...prev, [field]: e.target.value }));
      setPage(1);
    };
  }

  function clearFilters() {
    setFilters({
      type: '',
      category_id: '',
      subcategory: '',
      location_id: '',
      status: '',
      keyword: '',
      date_from: '',
      date_to: '',
    });
    setPage(1);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Browse Items</h1>
          <p className="text-muted text-sm mt-1">{total} report{total !== 1 ? 's' : ''} listed</p>
        </div>
        <Link to="/items/new" className="btn btn-primary">➕ Report Item</Link>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ paddingBottom: 16 }}>
          <div className="search-bar" style={{ marginBottom: 0 }}>
            {/* Keyword Search */}
            <div className="search-input-wrap" style={{ minWidth: 220 }}>
              <span className="search-icon">🔍</span>
              <input
                className="form-control"
                placeholder="Search title, description, location, tags…"
                value={filters.keyword}
                onChange={handleFilterChange('keyword')}
              />
            </div>

            {/* Subcategory filter */}
            <input
              className="form-control"
              style={{ width: 160 }}
              placeholder="Filter subcategory…"
              value={filters.subcategory}
              onChange={handleFilterChange('subcategory')}
            />

            {/* Type */}
            <select
              className="form-control"
              style={{ width: 120 }}
              value={filters.type}
              onChange={handleFilterChange('type')}
            >
              <option value="">All types</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>

            {/* Category */}
            <select
              className="form-control"
              style={{ width: 140 }}
              value={filters.category_id}
              onChange={handleFilterChange('category_id')}
            >
              <option value="">All categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>

            {/* Location */}
            <select
              className="form-control"
              style={{ width: 140 }}
              value={filters.location_id}
              onChange={handleFilterChange('location_id')}
            >
              <option value="">All locations</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>

            {/* Status */}
            <select
              className="form-control"
              style={{ width: 120 }}
              value={filters.status}
              onChange={handleFilterChange('status')}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="claimed">Claimed</option>
              <option value="returned">Returned</option>
            </select>

            {/* Clearly Labeled Date Range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="text-xs text-muted font-semibold">From:</span>
              <input
                className="form-control"
                type="date"
                style={{ width: 135 }}
                value={filters.date_from}
                onChange={handleFilterChange('date_from')}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="text-xs text-muted font-semibold">To:</span>
              <input
                className="form-control"
                type="date"
                style={{ width: 135 }}
                value={filters.date_to}
                onChange={handleFilterChange('date_to')}
              />
            </div>

            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Reset</button>
          </div>
        </div>
      </div>

      {/* ── Item Cards Grid ── */}
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No items found</h3>
          <p>Try resetting filters or <Link to="/items/new">report a new item</Link>.</p>
        </div>
      ) : (
        <>
          <div className="item-grid">
            {items.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => navigate(`/items/${item.id}`)}
              />
            ))}
          </div>

          {pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPage(p => p - 1)}
                disabled={page <= 1}
              >
                ← Prev
              </button>
              <span className="text-sm text-muted">Page {page} of {pages}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= pages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
