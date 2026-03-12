// src/pages/camp/CampReport.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { campApi } from '../../services/api';
import { BottomNav, PageHeader, Card, ProgressBar, Spinner } from '../../components/common/UI';

const NAV = [
  { key: 'dashboard', icon: '📊', label: 'ภาพรวม' },
  { key: 'structure', icon: '🏕️', label: 'โครงสร้าง' },
  { key: 'schedule', icon: '📅', label: 'ตาราง' },
  { key: 'report', icon: '📋', label: 'รายงาน' },
];

export default function CampReport() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    campApi.getReport().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleNav = (key) => {
    const routes = { dashboard: '/camp/dashboard', structure: '/camp/structure', schedule: '/camp/schedule', report: '/camp/report' };
    navigate(routes[key]);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={40} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0f2440, #0a1628)', paddingBottom: 80 }}>
      <PageHeader title="รายงานค่าย" subtitle={`ทั้งหมด ${data?.totalScouts} คน`} />

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data?.report?.map(r => (
          <Card key={r.activity.id} style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.activity.name}</span>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{r.done}/{r.total}</span>
            </div>
            <ProgressBar value={r.done} max={r.total} color={r.activity.type === 'MAIN' ? '#22c55e' : r.activity.type === 'SPECIAL' ? '#d4a017' : '#0d9488'} />
          </Card>
        ))}
      </div>

      <BottomNav items={NAV} active="report" onSelect={handleNav} />
    </div>
  );
}
