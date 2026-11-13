// frontend/src/pages/ItemsPage.jsx
// Browse lost & found reports with Category, Subcategory, Location, and Specific Location details.

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api.js';
import { formatDistanceToNow } from 'date-fns';
import {
  IconSearch,
  IconPlus,
  IconMapPin,
  IconTag,
  IconFolder,
  IconArrowLeft,
  IconArrowRight,
  IconFilter
} from '../components/Icons.jsx';

function ItemCard({ item, onClick }) {
  return (
    <div className="item-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="item-card-header">
        <div className="cat-tile">{item.category_icon || '📦'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="item-card-title">{item.title}</div>
          <span className={`badge badge-${item.type}`} style={{ marginTop: 6 }}>
            {item.type === 'lost' ? 'Lost' : 'Found'}
          </span>
        </div>
        <span className={`badge badge-${item.status}`}>{item.status}</span>
      </div>

      <div className="item-card-body">
        <div className="item-card-desc">{item.description}</div>
        <div className="item-card-meta">
          {item.category_name && (
            <span className="meta-chip">
              <IconFolder width={12} height={12} />
              <span>{item.category_name}{item.custom_subcategory ? ` › ${item.custom_subcategory}` : ''}</span>
            </span>
          )}
          {item.location_name && (
            <span className="meta-chip">
              <IconMapPin width={12} height={12} />
              <span>{item.location_name}{item.custom_location ? ` (${item.custom_location})` : ''}</span>
            </span>
          )}
          {!item.location_name && item.custom_location && (
            <span className="meta-chip">
              <IconMapPin width={12} height={12} />
              <span>{item.custom_location}</span>
            </span>
          )}
          {item.color && (
            <span className="meta-chip">
              <span>Color: {item.color}</span>
            </span>
          )}
          {item.brand && (
            <span className="meta-chip">
              <IconTag width={12} height={12} />
              <span>{item.brand}</span>
            </span>
          )}
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
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [items, setItems]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(false);

  const [categories, setCategories] = useState([]);
  const [locations, setLocations]   = useState([]);

  const [filters, setFilters] = useState({
    type: '',
    category_id: '',
    subcategory: '',
    location_id: '',
    status: '',
    keyword: initialSearch,
    date_from: '',
    date_to: '',
  });

  // Sync keyword if URL search param updates from top bar
  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== filters.keyword) {
      setFilters(prev => ({ ...prev, keyword: q }));
      setPage(1);
    }
  }, [searchParams]);

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
          <p className="text-muted text-sm mt-1">{total} report{total !== 1 ? 's' : ''} listed across campus</p>
        </div>
        <Link to="/items/new" className="btn btn-primary">
          <IconPlus width={16} height={16} />
          <span>Report Item</span>
        </Link>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: '20px 24px' }}>
          <div className="search-bar">
            {/* Keyword Search */}
            <div className="search-input-wrap">
              <span className="search-icon">
                <IconSearch width={16} height={16} />
              </span>
              <input
                className="form-control"
                placeholder="Search title, description, location, tags…"
                value={filters.keyword}
                onChange={handleFilterChange('keyword')}
                aria-label="Filter by keyword"
              />
            </div>

            {/* Subcategory filter */}
            <input
              className="form-control"
              style={{ width: 170 }}
              placeholder="Filter subcategory…"
              value={filters.subcategory}
              onChange={handleFilterChange('subcategory')}
              aria-label="Filter subcategory"
            />

            {/* Type */}
            <select
              className="form-control"
              style={{ width: 120 }}
              value={filters.type}
              onChange={handleFilterChange('type')}
              aria-label="Filter type"
            >
              <option value="">All types</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>

            {/* Category */}
            <select
              className="form-control"
              style={{ width: 150 }}
              value={filters.category_id}
              onChange={handleFilterChange('category_id')}
              aria-label="Filter category"
            >
              <option value="">All categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>

            {/* Location */}
            <select
              className="form-control"
              style={{ width: 150 }}
              value={filters.location_id}
              onChange={handleFilterChange('location_id')}
              aria-label="Filter location"
            >
              <option value="">All locations</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>

            {/* Status */}
            <select
              className="form-control"
              style={{ width: 125 }}
              value={filters.status}
              onChange={handleFilterChange('status')}
              aria-label="Filter status"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="claimed">Claimed</option>
              <option value="returned">Returned</option>
            </select>

            {/* Clearly Labeled Date Range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="text-xs text-muted font-semibold">From:</span>
              <input
                className="form-control"
                type="date"
                style={{ width: 140 }}
                value={filters.date_from}
                onChange={handleFilterChange('date_from')}
                aria-label="Date from"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="text-xs text-muted font-semibold">To:</span>
              <input
                className="form-control"
                type="date"
                style={{ width: 140 }}
                value={filters.date_to}
                onChange={handleFilterChange('date_to')}
                aria-label="Date to"
              />
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={clearFilters}
              style={{ minHeight: 40 }}
            >
              <IconFilter width={14} height={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Item Cards Grid ── */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
          <p className="text-sm">Loading reports…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon-wrap">
            <IconFolder width={24} height={24} />
          </div>
          <h3>No items match your filters</h3>
          <p>Try resetting the filters or report a new lost or found item.</p>
          <div style={{ marginTop: 16 }}>
            <Link to="/items/new" className="btn btn-primary btn-sm">
              <IconPlus width={14} height={14} />
              <span>Report New Item</span>
            </Link>
          </div>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 32 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPage(p => p - 1)}
                disabled={page <= 1}
              >
                <IconArrowLeft width={14} height={14} />
                <span>Prev</span>
              </button>
              <span className="text-sm text-muted font-semibold">Page {page} of {pages}</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= pages}
              >
                <span>Next</span>
                <IconArrowRight width={14} height={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
