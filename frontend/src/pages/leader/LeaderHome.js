// src/pages/leader/LeaderHome.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaderApi } from '../../services/api';
import { Card, ProgressBar, PageHeader, Spinner, Badge } from '../../components/common/UI.jsx';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { key: 'home', icon: '🏠', label: 'หมู่' },
  { key: 'report', icon: '📊', label: 'รายงาน' },
];

export default function LeaderHome() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [patrol, setPatrol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableScouts, setAvailableScouts] = useState(null);
  const [loadingScouts, setLoadingScouts] = useState(false);
  const [addingScout, setAddingScout] = useState(false);

  useEffect(() => {
    leaderApi.getPatrol().then(r => setPatrol(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const loadAvailableScouts = async () => {
    setLoadingScouts(true);
    try {
      const response = await leaderApi.getAvailableScouts();
      setAvailableScouts(response.data);
    } catch (error) {
      toast.error('ไม่สามารถโหลดรายชื่อลูกเสือได้');
    } finally {
      setLoadingScouts(false);
    }
  };

  const handleAddScout = async (scoutId) => {
    setAddingScout(true);
    try {
      await leaderApi.addScoutToPatrol({ scoutId });
      toast.success('เพิ่มลูกเสือสำเร็จ');
      
      // โหลดข้อมูลหมู่ใหม่
      const patrolResponse = await leaderApi.getPatrol();
      setPatrol(patrolResponse.data);
      
      // อัปเดตรายการลูกเสือที่เพิ่มได้
      if (availableScouts) {
        setAvailableScouts(prev => ({
          ...prev,
          scouts: prev.scouts.filter(s => s.id !== scoutId),
          currentCount: prev.currentCount + 1,
          canAdd: prev.currentCount + 1 < 8
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'เพิ่มลูกเสือไม่สำเร็จ');
    } finally {
      setAddingScout(false);
    }
  };

  const openAddModal = () => {
    setShowAddModal(true);
    loadAvailableScouts();
  };

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

        {/* Add Scout Button */}
        {(patrol?.scouts?.length || 0) < 8 && (
          <button
            onClick={openAddModal}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              padding: '14px',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>➕</span>
            เพิ่มลูกเสือ ({patrol?.scouts?.length || 0}/8 คน)
          </button>
        )}

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
<<<<<<< HEAD

      {/* Add Scout Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 1000
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowAddModal(false);
        }}
        >
          <div style={{
            background: 'linear-gradient(160deg, #1e293b, #0f172a)',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>เพิ่มลูกเสือเข้าหมู่</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {availableScouts && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  background: 'rgba(34,197,94,0.1)', 
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16
                }}>
                  <p style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: 600 }}>
                    สถานศึกษา: {availableScouts.school || 'ยังไม่ระบุ'}
                  </p>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 4 }}>
                    สมาชิกปัจจุบัน: {availableScouts.currentCount}/{availableScouts.maxCount} คน
                  </p>
                </div>
              </div>
            )}

            {loadingScouts ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spinner size={32} />
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 12 }}>กำลังโหลดรายชื่อ...</p>
              </div>
            ) : availableScouts?.scouts?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  {availableScouts?.canAdd === false 
                    ? 'หมู่เต็มแล้ว (8 คน)' 
                    : 'ไม่มีลูกเสือที่สามารถเพิ่มได้'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {availableScouts?.scouts?.map(scout => (
                  <div key={scout.id} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
                        {scout.firstName} {scout.lastName}
                      </p>
                      <p style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {scout.scoutCode} · {scout.school}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddScout(scout.id)}
                      disabled={addingScout}
                      style={{
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        border: 'none',
                        borderRadius: 6,
                        color: '#fff',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: addingScout ? 'not-allowed' : 'pointer',
                        opacity: addingScout ? 0.6 : 1
                      }}
                    >
                      {addingScout ? 'กำลังเพิ่ม...' : 'เพิ่ม'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
=======
>>>>>>> d458ac3624e4d97c2cac3185aabe93c4fda331c4
    </div>
  );
}
