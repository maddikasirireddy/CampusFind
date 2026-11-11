// frontend/src/pages/ProfilePage.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      await refreshUser();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      toast.success('Password changed!');
      setPwForm({ currentPassword:'', newPassword:'', confirm:'' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setSavingPw(false);
    }
  }

  const initials = user?.name?.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase() || '??';

  return (
    <div style={{maxWidth: 560}}>
      <div className="page-header">
        <h1>My Profile</h1>
      </div>

      {/* Avatar / info */}
      <div className="card mb-4">
        <div className="card-body" style={{display:'flex', gap:20, alignItems:'center'}}>
          <div style={{width:72,height:72,borderRadius:'50%',background:'var(--primary)',
            display:'flex',alignItems:'center',justifyContent:'center',
            color:'white',fontSize:'1.6rem',fontWeight:800,flexShrink:0}}>
            {initials}
          </div>
          <div>
            <h2 style={{marginBottom:4}}>{user?.name}</h2>
            <p className="text-sm text-muted">{user?.email}</p>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
              <span className="badge badge-active">ID: {user?.student_id}</span>
            </div>
            {user?.created_at && (
              <p className="text-xs text-muted mt-2">
                Member since {format(new Date(user.created_at), 'MMM yyyy')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="card mb-4">
        <div className="card-header"><h3>Edit Profile</h3></div>
        <div className="card-body">
          <form onSubmit={saveProfile}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" value={form.name}
                onChange={e => setForm(f=>({...f, name:e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" type="tel" value={form.phone}
                onChange={e => setForm(f=>({...f, phone:e.target.value}))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : '💾 Save Changes'}
            </button>
          </form>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div className="card-header"><h3>Change Password</h3></div>
        <div className="card-body">
          <form onSubmit={changePassword}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-control" type="password"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(f=>({...f, currentPassword:e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-control" type="password" minLength={6}
                value={pwForm.newPassword}
                onChange={e => setPwForm(f=>({...f, newPassword:e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-control" type="password"
                value={pwForm.confirm}
                onChange={e => setPwForm(f=>({...f, confirm:e.target.value}))} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingPw}>
              {savingPw ? 'Updating…' : '🔐 Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

