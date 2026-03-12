// src/pages/scout/ScoutActivities.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scoutApi } from '../../services/api';
import { BottomNav, Card, Spinner } from '../../components/common/UI';

const NAV = [
  { key: 'home', icon: '🏠', label: 'หน้าแรก' },
  { key: 'activities', icon: '🎯', label: 'กิจกรรม' },
  { key: 'qr', icon: '📱', label: 'QR ฉัน' },
  { key: 'profile', icon: '👤', label: 'โปรไฟล์' },
];

export default function ScoutActivities() {
  const navigate = useNavigate();
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

  const attendances = data?.scout?.attendances || [];
  const byType = {
    MAIN: attendances.filter(a => a.schedule?.activity?.type === 'MAIN'),
    SPECIAL: attendances.filter(a => a.schedule?.activity?.type === 'SPECIAL'),
    FREE: attendances.filter(a => a.schedule?.activity?.type === 'FREE'),
  };

  const typeLabels = { MAIN: { label: 'กิจกรรมหลัก', emoji: '🎯', color: '#22c55e' }, SPECIAL: { label: 'กิจกรรมพิเศษ', emoji: '⭐', color: '#d4a017' }, FREE: { label: 'กิจกรรมยามว่าง', emoji: '🎮', color: '#0d9488' } };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0f2440, #0a1628)', paddingBottom: 80 }}>
      <div style={{ padding: '48px 20px 20px' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>กิจกรรมของฉัน</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4 }}>ประวัติการเข้าร่วมกิจกรรม</p>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {['MAIN', 'SPECIAL', 'FREE'].map(type => {
          const { label, emoji, color } = typeLabels[type];
          const items = byType[type];
          const total = data?.progress?.[type.toLowerCase()]?.total || 0;
          return (
            <Card key={type}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{emoji} {label}</h2>
                <span style={{ background: `rgba(255,255,255,0.06)`, color, borderRadius: 6, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
                  {items.filter(a => a.status === 'PASSED').length}/{total}
                </span>
              </div>
              {items.length === 0 ? (
                <p style={{ color: '#475569', fontSize: '0.85rem', textAlign: 'center', padding: '12px 0' }}>ยังไม่ได้เข้าร่วมกิจกรรม</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(att => (
                    <div key={att.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
                      background: 'rgba(255,255,255,0.04)', borderRadius: 8,
                    }}>
                      <span>{att.status === 'PASSED' ? '✅' : att.status === 'FAILED' ? '❌' : '⚠️'}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>{att.schedule?.activity?.name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                          {att.scannedAt ? new Date(att.scannedAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <BottomNav items={NAV} active="activities" onSelect={handleNav} />
    </div>
  );
}
