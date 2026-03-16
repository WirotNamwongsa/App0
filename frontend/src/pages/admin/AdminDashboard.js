// src/pages/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';
import { Card, Spinner } from '../../components/common/UI.jsx';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { key: 'dashboard', icon: '', label: '' },
  { key: 'report', icon: '', label: '' },
  { key: 'activities', icon: '', label: '' },
  { key: 'accounts', icon: '', label: 'Account' },
  { key: 'audit', icon: '', label: 'Audit' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleNav = (key) => {
    const routes = { dashboard: '/admin/dashboard', report: '/admin/report', activities: '/admin/activities', accounts: '/admin/accounts', audit: '/admin/audit' };
    navigate(routes[key]);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={40} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0f2440, #0a1628)', paddingBottom: 80 }}>
      <div style={{ padding: '48px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}></p>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Admin Dashboard</h1>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 8,
              color: '#fecaca',
              padding: '8px 12px',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { label: '', value: data?.totalScouts, color: '#14b8a6' },
            { label: '', value: data?.totalCamps, color: '#d4a017' },
            { label: '', value: data?.todayScans, color: '#22c55e' },
          ].map(s => (
            <Card key={s.label} style={{ textAlign: 'center', padding: '14px 8px' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value || 0}</p>
              <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Manage buttons */}
        <Card>
          <h2 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}></h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: '', path: '/admin/activities', color: '#14b8a6' },
              { label: '', path: '/admin/accounts', color: '#d4a017' },
              { label: '', path: '/admin/report', color: '#22c55e' },
              { label: '', path: '/admin/audit', color: '#94a3b8' },
            ].map(item => (
              <button key={item.path} onClick={() => navigate(item.path)} style={{
                width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text)',
              }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{item.label}</span>
                <span style={{ color: '#475569' }}></span>
              </button>
            ))}
          </div>
        </Card>

        {/* Camps summary */}
        <Card>
          <h2 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}></h2>
          {data?.camps?.map(camp => (
            <div key={camp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontWeight: 500 }}>{camp.name}</span>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{camp._count?.accounts} accounts</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
