// src/pages/camp/CampDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { campApi } from '../../services/api';
import { BottomNav, Card, ProgressBar, Spinner } from '../../components/common/UI';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { key: 'dashboard', icon: '📊', label: 'ภาพรวม' },
  { key: 'structure', icon: '🏕️', label: 'โครงสร้าง' },
  { key: 'schedule', icon: '📅', label: 'ตาราง' },
  { key: 'report', icon: '📋', label: 'รายงาน' },
];

export default function CampDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    campApi.getDashboard().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleNav = (key) => {
    const routes = { dashboard: '/camp/dashboard', structure: '/camp/structure', schedule: '/camp/schedule', report: '/camp/report' };
    navigate(routes[key]);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={40} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0f2440, #0a1628)', paddingBottom: 80 }}>
      <div style={{ padding: '48px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>ผู้ดูแลค่ายย่อย</p>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{data?.camp?.name}</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>👤 {data?.stats?.totalScouts} คน</p>
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
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Card style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e' }}>{data?.stats?.awardCount || 0}</p>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>🏆 Jamboree Award</p>
          </Card>
          <Card style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#d4a017' }}>{data?.stats?.awardRate || 0}%</p>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>อัตราผ่าน</p>
          </Card>
        </div>

        {/* Troops */}
        <Card>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#94a3b8', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>กองในค่าย</h2>
          {data?.troops?.map(troop => (
            <div key={troop.id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>กอง {troop.number}</span>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{troop.scoutCount} คน</span>
              </div>
              <ProgressBar value={troop.completionRate} max={100} color={troop.completionRate >= 80 ? '#22c55e' : '#f59e0b'} />
            </div>
          ))}
        </Card>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button onClick={() => navigate('/camp/structure')} style={{ background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 12, padding: 16, color: '#14b8a6', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 }}>
            <span style={{ fontSize: '1.8rem' }}>🏕️</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>จัดการโครงสร้าง</span>
          </button>
          <button onClick={() => navigate('/camp/schedule')} style={{ background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 12, padding: 16, color: '#d4a017', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 }}>
            <span style={{ fontSize: '1.8rem' }}>📅</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>จัดตาราง</span>
          </button>
        </div>
      </div>

      <BottomNav items={NAV} active="dashboard" onSelect={handleNav} />
    </div>
  );
}
