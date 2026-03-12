// src/pages/scout/ScoutHome.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scoutApi } from '../../services/api';
import { BottomNav, Card, ProgressBar, Spinner } from '../../components/common/UI';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { key: 'home', icon: '🏠', label: 'หน้าแรก' },
  { key: 'activities', icon: '🎯', label: 'กิจกรรม' },
  { key: 'qr', icon: '📱', label: 'QR ฉัน' },
  { key: 'profile', icon: '👤', label: 'โปรไฟล์' },
];

export default function ScoutHome() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scoutApi.getProfile().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleNav = (key) => {
    const routes = { home: '/scout/home', activities: '/scout/activities', qr: '/scout/qr', profile: '/scout/profile' };
    navigate(routes[key]);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={40} /></div>;

  const { scout, progress } = data || {};

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0f2440 0%, #0a1628 100%)', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        padding: '48px 20px 24px',
        background: 'linear-gradient(180deg, rgba(30,58,95,0.8) 0%, transparent 100%)',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: 4 }}>สวัสดี 👋</p>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' }}>{scout?.nickname || scout?.firstName}</h1>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span style={{ background: 'rgba(13,148,136,0.2)', color: '#14b8a6', borderRadius: 6, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
                หมู่ {scout?.patrol?.number}
              </span>
              <span style={{ background: 'rgba(212,160,23,0.2)', color: '#d4a017', borderRadius: 6, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
                กอง {scout?.patrol?.troop?.number}
              </span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 6 }}>⛺ {scout?.patrol?.troop?.camp?.name}</p>
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
        {/* Progress */}
        <Card>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>ความคืบหน้า</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>🎯 กิจกรรมหลัก</span>
                <span style={{ fontSize: '0.88rem', color: '#22c55e', fontWeight: 700 }}>{progress?.main.done}/{progress?.main.total}</span>
              </div>
              <ProgressBar value={progress?.main.done || 0} max={progress?.main.total || 1} color="#22c55e" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>⭐ กิจกรรมพิเศษ</span>
                <span style={{ fontSize: '0.88rem', color: '#d4a017', fontWeight: 700 }}>{progress?.special.done}/{progress?.special.total}</span>
              </div>
              <ProgressBar value={progress?.special.done || 0} max={progress?.special.total || 1} color="#d4a017" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>🎮 กิจกรรมยามว่าง</span>
                <span style={{ fontSize: '0.88rem', color: '#0d9488', fontWeight: 700 }}>{progress?.free.done}/{progress?.free.total}</span>
              </div>
              <ProgressBar value={progress?.free.done || 0} max={progress?.free.total || 1} color="#0d9488" />
            </div>
          </div>
        </Card>

        {/* Award */}
        <Card style={{ background: 'linear-gradient(135deg, rgba(212,160,23,0.1), rgba(30,58,95,0.8))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: '2.5rem' }}>🏆</div>
            <div>
              <h3 style={{ fontWeight: 700, color: '#f0c040' }}>Jamboree Award</h3>
              {progress?.main.done >= progress?.main.total ? (
                <p style={{ color: '#22c55e', fontSize: '0.88rem', marginTop: 4 }}>✅ ผ่านครบทุกกิจกรรมหลักแล้ว!</p>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: 4 }}>ยังขาดอีก {(progress?.main.total || 0) - (progress?.main.done || 0)} กิจกรรมหลัก</p>
              )}
            </div>
          </div>
        </Card>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button onClick={() => navigate('/scout/qr')} style={{
            background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)',
            borderRadius: 12, padding: 16, color: '#14b8a6', textAlign: 'center',
            display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80,
          }}>
            <span style={{ fontSize: '1.8rem' }}>📱</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>QR Code ฉัน</span>
          </button>
          <button onClick={() => navigate('/scout/activities')} style={{
            background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.3)',
            borderRadius: 12, padding: 16, color: '#d4a017', textAlign: 'center',
            display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80,
          }}>
            <span style={{ fontSize: '1.8rem' }}>🎯</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>ดูกิจกรรม</span>
          </button>
        </div>
      </div>

      <BottomNav items={NAV} active="home" onSelect={handleNav} />
    </div>
  );
}
