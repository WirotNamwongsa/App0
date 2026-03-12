// src/pages/leader/LeaderHome.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaderApi } from '../../services/api';
import { BottomNav, Card, ProgressBar, PageHeader, Spinner, Badge } from '../../components/common/UI';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { key: 'home', icon: '🏠', label: 'หมู่' },
  { key: 'report', icon: '📊', label: 'รายงาน' },
];

export default function LeaderHome() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [patrol, setPatrol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderApi.getPatrol().then(r => setPatrol(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={40} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0f2440, #0a1628)', paddingBottom: 80 }}>
      <div style={{ padding: '48px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>ผู้กำกับหมู่</p>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>หมู่ {patrol?.number} กอง {patrol?.troop?.number}</h1>
            <p style={{ color: '#14b8a6', fontSize: '0.85rem', marginTop: 4 }}>⛺ {patrol?.troop?.camp?.name}</p>
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
            ออกจากระบบ
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { label: 'สมาชิก', value: patrol?.scouts?.length, color: '#94a3b8' },
            { label: 'ผ่านครบ', value: patrol?.scouts?.filter(s => s.progress?.main.done >= s.progress?.main.total).length, color: '#22c55e' },
            { label: 'ยังขาด', value: patrol?.scouts?.filter(s => s.progress?.main.done < s.progress?.main.total).length, color: '#f59e0b' },
          ].map(stat => (
            <Card key={stat.label} style={{ textAlign: 'center', padding: '14px 10px' }}>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, color: stat.color }}>{stat.value || 0}</p>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Scout list */}
        <Card>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#94a3b8', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
            สมาชิก ({patrol?.scouts?.length} คน)
          </h2>
          {patrol?.scouts?.map(scout => {
            const mainOk = scout.progress?.main.done >= scout.progress?.main.total;
            return (
              <button key={scout.id} onClick={() => navigate(`/leader/scout/${scout.id}`)} style={{
                width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: 'var(--text)',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: mainOk ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                  {mainOk ? '✅' : '⚠️'}
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{scout.firstName} {scout.lastName}</p>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 2 }}>
                    หลัก {scout.progress?.main.done}/{scout.progress?.main.total} · พิเศษ {scout.progress?.special.done}/{scout.progress?.special.total} · ว่าง {scout.progress?.free.done}/{scout.progress?.free.total}
                  </p>
                </div>
                <span style={{ color: '#475569', fontSize: '1.1rem' }}>›</span>
              </button>
            );
          })}
        </Card>
      </div>

      <BottomNav items={NAV} active="home" onSelect={() => {}} />
    </div>
  );
}
