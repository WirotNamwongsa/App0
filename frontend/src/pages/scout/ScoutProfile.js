// src/pages/scout/ScoutProfile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scoutApi } from '../../services/api';
import { BottomNav, Card, Spinner } from '../../components/common/UI';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { key: 'home', icon: '🏠', label: 'หน้าแรก' },
  { key: 'activities', icon: '🎯', label: 'กิจกรรม' },
  { key: 'qr', icon: '📱', label: 'QR ฉัน' },
  { key: 'profile', icon: '👤', label: 'โปรไฟล์' },
];

export default function ScoutProfile() {
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

  const scout = data?.scout;
  const fields = [
    { label: 'ชื่อ-สกุล', value: `${scout?.firstName || ''} ${scout?.lastName || ''}` },
    { label: 'ชื่อเล่น', value: scout?.nickname },
    { label: 'โรงเรียน', value: scout?.school },
    { label: 'จังหวัด', value: scout?.province },
    { label: 'เบอร์โทร', value: scout?.phone },
    { label: 'อีเมล', value: scout?.email },
    { label: 'รหัสลูกเสือ', value: scout?.scoutCode, highlight: true },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0f2440, #0a1628)', paddingBottom: 80 }}>
      <div style={{ padding: '48px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>โปรไฟล์</h1>
          <button onClick={logout} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', padding: '8px 14px', fontSize: '0.85rem' }}>ออกจากระบบ</button>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          {fields.map(f => f.value ? (
            <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#64748b', fontSize: '0.88rem' }}>{f.label}</span>
              <span style={{ fontWeight: f.highlight ? 700 : 500, color: f.highlight ? '#d4a017' : 'var(--text)', fontSize: '0.9rem' }}>{f.value}</span>
            </div>
          ) : null)}
        </Card>

        <div style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 12, padding: 16 }}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>
            💡 หากข้อมูลไม่ถูกต้อง กรุณาติดต่อ <strong style={{ color: '#14b8a6' }}>ผู้กำกับหมู่</strong> เพื่อแก้ไข
          </p>
        </div>
      </div>

      <BottomNav items={NAV} active="profile" onSelect={handleNav} />
    </div>
  );
}
