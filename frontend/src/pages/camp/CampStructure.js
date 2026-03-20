// src/pages/camp/CampStructure.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { campApi } from '../../services/api';
import { PageHeader, Card, Spinner, Button } from '../../components/common/UI.jsx';
import toast from 'react-hot-toast';

const NAV = [
  { key: 'dashboard', icon: '📊', label: 'ภาพรวม' },
  { key: 'structure', icon: '🏕️', label: 'โครงสร้าง' },
  { key: 'schedule', icon: '📅', label: 'ตาราง' },
  { key: 'report', icon: '📋', label: 'รายงาน' },
];

export default function CampStructure() {
  const navigate = useNavigate();
  const [troops, setTroops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTroop, setShowCreateTroop] = useState(false);
  const [newTroop, setNewTroop] = useState({ name: '', number: '' });

  useEffect(() => { load(); }, []);
  const load = () => campApi.getStructure().then(r => setTroops(r.data)).catch(console.error).finally(() => setLoading(false));

  const createTroop = async () => {
    try {
      await campApi.createTroop(newTroop);
      toast.success('สร้างกองสำเร็จ');
      setShowCreateTroop(false);
      setNewTroop({ name: '', number: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด'); }
  };

  const handleNav = (key) => {
    const routes = { dashboard: '/camp/dashboard', structure: '/camp/structure', schedule: '/camp/schedule', report: '/camp/report' };
    navigate(routes[key]);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={40} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0f2440, #0a1628)', paddingBottom: 80 }}>
      <PageHeader
        title="โครงสร้างค่าย"
        subtitle={`${troops.length} กอง`}
        action={
          <button onClick={() => setShowCreateTroop(true)} style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(13,148,136,0.4)', borderRadius: 8, color: '#14b8a6', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600 }}>+ กอง</button>
        }
      />

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {troops.map(troop => (
          <Card key={troop.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>กอง {troop.number} — {troop.name}</h2>
              <span style={{ color: '#64748b', fontSize: '0.82rem' }}>
                {troop.patrols.reduce((s, p) => s + (p._count?.scouts || 0), 0)} คน
              </span>
            </div>
            {troop.patrols.map(patrol => (
              <button 
                key={patrol.id} 
                onClick={() => {
                  if (!patrol.id) {
                    toast.error('ไม่พบ ID ของหมู่');
                    return;
                  }
                  console.log('Navigating to patrol:', patrol.id, patrol.name);
                  navigate(`/camp/patrol/${patrol.id}`);
                }} 
                style={{
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.06)', 
                  borderRadius: 8, 
                  padding: '10px 12px', 
                  marginBottom: 6, 
                  color: 'var(--text)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.06)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.03)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.06)';
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🏴</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>{patrol.name}</p>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 2 }}>
                    {patrol._count?.scouts || 0} คน · {patrol.leader?.displayName || 'ยังไม่มีผู้กำกับ'}
                  </p>
                </div>
                <span style={{ color: '#475569', fontSize: '1.2rem' }}>›</span>
              </button>
            ))}
            {troop.patrols.length === 0 && <p style={{ color: '#475569', fontSize: '0.85rem', textAlign: 'center', padding: '8px 0' }}>ยังไม่มีหมู่</p>}
          </Card>
        ))}

        {/* Create Troop Modal */}
        {showCreateTroop && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', border: '1px solid var(--border)' }}>
              <h2 style={{ fontWeight: 700, marginBottom: 16 }}>สร้างกองใหม่</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <input placeholder="เลขกอง (1, 2, 3...)" type="number" value={newTroop.number} onChange={e => setNewTroop(p => ({ ...p, number: e.target.value }))} />
                <input placeholder="ชื่อกอง" value={newTroop.name} onChange={e => setNewTroop(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowCreateTroop(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', padding: 12, fontWeight: 600 }}>ยกเลิก</button>
                <button onClick={createTroop} style={{ flex: 1, background: 'linear-gradient(135deg,#0d9488,#0f766e)', borderRadius: 10, color: '#fff', padding: 12, fontWeight: 700 }}>สร้าง</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
