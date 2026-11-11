// frontend/src/pages/AuthPage.jsx
// Consolidated Login and Student Registration screen.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    student_id: '',
    phone: '',
  });

  const setField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      } else {
        await register(form);
        toast.success('Account created successfully!');
      }
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 
                  (err.response?.data?.errors?.map(e => e.msg).join(', ')) || 
                  (err.message === 'Network Error' ? 'Cannot connect to server. Check server connection.' : null) ||
                  (isLogin ? 'Login failed' : 'Registration failed');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: isLogin ? 420 : 480 }}>
        <div className="auth-logo">
          <h1>🔍 CampusFind</h1>
          <p>Smart Lost & Found Management System</p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="type-toggle mb-3">
          <button
            type="button"
            className={`type-btn ${isLogin ? 'active font-bold' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`type-btn ${!isLogin ? 'active font-bold' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Register Student
          </button>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2',
            color: '#991B1B',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 16,
            fontSize: '.85rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Aarav Sharma"
                  value={form.name}
                  onChange={setField('name')}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Student ID *</label>
                <input
                  className="form-control"
                  placeholder="e.g. CS2024001"
                  value={form.student_id}
                  onChange={setField('student_id')}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email address *</label>
            <input
              className="form-control"
              type="email"
              placeholder="you@campus.edu"
              value={form.email}
              onChange={setField('email')}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              className="form-control"
              type="password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={setField('password')}
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <input
                className="form-control"
                type="tel"
                placeholder="+91 9876543210"
                value={form.phone}
                onChange={setField('phone')}
              />
            </div>
          )}

          <button className="btn btn-primary w-full btn-lg mt-2" type="submit" disabled={loading}>
            {loading ? 'Processing…' : (isLogin ? 'Sign In' : 'Create Student Account')}
          </button>
        </form>

        <div style={{
          marginTop: 20,
          padding: '10px 14px',
          background: 'var(--gray-50)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '.78rem',
          color: 'var(--gray-500)',
          border: '1px solid var(--gray-200)'
        }}>
          <strong>Demo credentials:</strong><br />
          Admin: <code>admin@campusfind.edu</code> / <code>Admin@123</code><br />
          Student: <code>aarav@campus.edu</code> / <code>Test@123</code>
        </div>
      </div>
    </div>
  );
}
