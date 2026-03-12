// src/pages/camp/CampSchedule.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { campApi, activityApi } from '../../services/api';
import { BottomNav, PageHeader, Card, Spinner } from '../../components/common/UI';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import toast from 'react-hot-toast';

const NAV = [
  { key: 'dashboard', icon: '📊', label: 'ภาพรวม' },
  { key: 'structure', icon: '🏕️', label: 'โครงสร้าง' },
  { key: 'schedule', icon: '📅', label: 'ตาราง' },
  { key: 'report', icon: '📋', label: 'รายงาน' },
];

const SLOT_LABEL = { MORNING: '🌅 เช้า', AFTERNOON: '☀️ บ่าย', EVENING: '🌙 เย็น' };

export default function CampSchedule() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [activities, setActivities] = useState([]);
  const [patrols, setPatrols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ activityId: '', date: '', slot: 'MORNING', patrolIds: [] });

  useEffect(() => {
    Promise.all([campApi.getSchedule(), activityApi.getAll(), campApi.getStructure()])
      .then(([s, a, t]) => {
        setSchedules(s.data);
        setActivities(a.data);
        setPatrols(t.data.flatMap(tr => tr.patrols.map(p => ({ ...p, troopNumber: tr.number }))));
      }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.activityId || !form.date || form.patrolIds.length === 0) return toast.error('กรุณากรอกข้อมูลให้ครบ');
    try {
      await campApi.createSchedule(form);
      toast.success('บันทึกตารางสำเร็จ');
      setShowCreate(false);
      campApi.getSchedule().then(r => setSchedules(r.data));
    } catch (err) { toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด'); }
  };

  const togglePatrol = (id) => {
    setForm(p => ({ ...p, patrolIds: p.patrolIds.includes(id) ? p.patrolIds.filter(x => x !== id) : [...p.patrolIds, id] }));
  };

  const handleNav = (key) => {
    const routes = { dashboard: '/camp/dashboard', structure: '/camp/structure', schedule: '/camp/schedule', report: '/camp/report' };
    navigate(routes[key]);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={40} /></div>;

  // Group by date
  const byDate = schedules.reduce((acc, s) => {
    const d = s.date.split('T')[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(s);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0f2440, #0a1628)', paddingBottom: 80 }}>
      <PageHeader
        title="ตารางกิจกรรม"
        subtitle={`${schedules.length} รายการ`}
        action={<button onClick={() => setShowCreate(true)} style={{ background: 'rgba(212,160,23,0.2)', border: '1px solid rgba(212,160,23,0.4)', borderRadius: 8, color: '#d4a017', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600 }}>+ เพิ่ม</button>}
      />

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.keys(byDate).sort().map(date => (
          <div key={date}>
            <h2 style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              📅 {new Date(date).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            {byDate[date].map(s => (
              <Card key={s.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.activity?.name}</p>
                    <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
                      {SLOT_LABEL[s.slot]} · {s.groups?.length || 0} หมู่ · {s._count?.attendances || 0} สแกน
                    </p>
                  </div>
                  <span style={{ background: 'rgba(13,148,136,0.2)', color: '#14b8a6', borderRadius: 6, padding: '3px 8px', fontSize: '0.75rem' }}>
                    {s.activity?.type === 'MAIN' ? 'หลัก' : s.activity?.type === 'SPECIAL' ? 'พิเศษ' : 'ว่าง'}
                  </span>
                </div>
                {s.groups?.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {s.groups.map(g => <span key={g.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '2px 8px', fontSize: '0.75rem', color: '#94a3b8' }}>{g.patrol?.name}</span>)}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ))}
        {schedules.length === 0 && <div style={{ textAlign: 'center', padding: 48, color: '#475569' }}><p style={{ fontSize: '2rem' }}>📅</p><p style={{ marginTop: 8 }}>ยังไม่มีตาราง</p></div>}
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end', overflow: 'auto' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 16 }}>เพิ่มตารางกิจกรรม</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: '#94a3b8' }}>กิจกรรม</label>
                <select value={form.activityId} onChange={e => setForm(p => ({ ...p, activityId: e.target.value }))}>
                  <option value="">-- เลือกกิจกรรม --</option>
                  {activities.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type === 'MAIN' ? 'หลัก' : a.type === 'SPECIAL' ? 'พิเศษ' : 'ว่าง'})</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: '#94a3b8' }}>วันที่</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: '#94a3b8' }}>ช่วงเวลา</label>
                <select value={form.slot} onChange={e => setForm(p => ({ ...p, slot: e.target.value }))}>
                  <option value="MORNING">เช้า</option>
                  <option value="AFTERNOON">บ่าย</option>
                  <option value="EVENING">เย็น</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', color: '#94a3b8' }}>เลือกหมู่ที่เข้าร่วม ({form.patrolIds.length} หมู่)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {patrols.map(p => (
                    <button key={p.id} onClick={() => togglePatrol(p.id)} style={{
                      background: form.patrolIds.includes(p.id) ? 'rgba(13,148,136,0.3)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${form.patrolIds.includes(p.id) ? '#0d9488' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 8, padding: '6px 12px', fontSize: '0.82rem', color: form.patrolIds.includes(p.id) ? '#14b8a6' : '#94a3b8', minHeight: 'auto',
                    }}>
                      กอง{p.troopNumber} {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', padding: 12, fontWeight: 600 }}>ยกเลิก</button>
              <button onClick={handleCreate} style={{ flex: 1, background: 'linear-gradient(135deg,#d4a017,#b8860b)', borderRadius: 10, color: '#000', padding: 12, fontWeight: 700 }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav items={NAV} active="schedule" onSelect={handleNav} />
    </div>
  );
}
