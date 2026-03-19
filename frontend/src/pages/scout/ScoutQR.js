// src/pages/scout/ScoutQR.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scoutApi } from '../../services/api';
import { Spinner } from '../../components/common/UI.jsx';

const NAV = [
  { key: 'home', icon: '', label: 'หน้าแรก' },
  { key: 'activities', icon: '', label: 'กิจกรรม' },
  { key: 'qr', icon: '', label: 'QR ฉัน' },
  { key: 'profile', icon: '', label: 'โปรไฟล์' },
];

export default function ScoutQR() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([scoutApi.getQR(), scoutApi.getProfile()])
      .then(([qr, prof]) => { setData(qr.data); setProfile(prof.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleNav = (key) => {
    const routes = { home: '/scout/home', activities: '/scout/activities', qr: '/scout/qr', profile: '/scout/profile' };
    navigate(routes[key]);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={40} /></div>;

  const scout = profile?.scout;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0f2440, #0a1628)', paddingBottom: 80 }}>
      <div style={{ padding: '48px 20px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>QR Code ของฉัน</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>ให้เจ้าหน้าที่สแกนเพื่อบันทึกการเข้าร่วม</p>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
        {/* QR Code */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: 24,
          boxShadow: '0 0 60px rgba(212,160,23,0.2)',
          display: 'inline-block',
        }}>
          {data?.qrDataUrl ? (
            <img src={data.qrDataUrl} alt="QR Code" style={{ width: 240, height: 240, display: 'block' }} />
          ) : (
            <div style={{ width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spinner />
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{
          background: 'rgba(30,58,95,0.6)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: 20, width: '100%', maxWidth: 360,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>ชื่อ-สกุล</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{scout?.firstName} {scout?.lastName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>รหัส</span>
              <span style={{ fontWeight: 700, color: '#d4a017', letterSpacing: 1 }}>{scout?.scoutCode}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>หมู่ / กอง</span>
              <span style={{ fontWeight: 600 }}>หมู่ {scout?.patrol?.number} / กอง {scout?.patrol?.troop?.number}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>ค่ายย่อย</span>
              <span style={{ fontWeight: 600, color: '#14b8a6' }}>{scout?.patrol?.troop?.camp?.name}</span>
            </div>
          </div>
        </div>

        <p style={{ color: '#475569', fontSize: '0.78rem', textAlign: 'center' }}>
          เพิ่มความสว่างหน้าจอก่อนให้สแกน
        </p>
      </div>
    </div>
  );
}
