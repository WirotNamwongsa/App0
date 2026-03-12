// src/pages/camp/CampPatrol.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campApi } from '../../services/api';
import { PageHeader, Card, Spinner, Button } from '../../components/common/UI';
import toast from 'react-hot-toast';

export default function CampPatrol() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patrol, setPatrol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMove, setShowMove] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [allPatrols, setAllPatrols] = useState([]);
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', school: '', province: '', phone: '', email: '' });
  const [moveTarget, setMoveTarget] = useState('');

  useEffect(() => {
    load();
    campApi.getStructure().then(r => setAllPatrols(r.data.flatMap(t => t.patrols.map(p => ({ ...p, troop: t })))));
  }, [id]);

  const load = () => campApi.getPatrol(id).then(r => setPatrol(r.data)).catch(console.error).finally(() => setLoading(false));

  const handleMove = async () => {
    if (!moveTarget || !showMove) return;
    try {
      await campApi.moveScout(showMove.id, moveTarget);
      toast.success('ย้ายสำเร็จ');
      setShowMove(null);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด'); }
  };

  const handleRemove = async (scoutId) => {
    if (!window.confirm('ยืนยันการลบออกจากหมู่?')) return;
    try {
      await campApi.removeScout(scoutId);
      toast.success('ลบออกจากหมู่แล้ว');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด'); }
  };

  const handleAdd = async () => {
    try {
      await campApi.addScout({ ...addForm, patrolId: id });
      toast.success('เพิ่มลูกเสือสำเร็จ');
      setShowAdd(false);
      setAddForm({ firstName: '', lastName: '', school: '', province: '', phone: '', email: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด'); }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={40} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0f2440, #0a1628)', paddingBottom: 40 }}>
      <PageHeader
        title={`${patrol?.name} — กอง ${patrol?.troop?.number}`}
        subtitle={`${patrol?.scouts?.length || 0} คน · ${patrol?.leader?.displayName || 'ยังไม่มีผู้กำกับ'}`}
        onBack={() => navigate(-1)}
        action={<button onClick={() => setShowAdd(true)} style={{ background: 'rgba(212,160,23,0.2)', border: '1px solid rgba(212,160,23,0.4)', borderRadius: 8, color: '#d4a017', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600 }}>+ เพิ่ม</button>}
      />

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {patrol?.scouts?.map(scout => (
          <Card key={scout.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{scout.firstName} {scout.lastName}</p>
              <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 2 }}>{scout.scoutCode} · {scout.school || '-'}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowMove(scout)} style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 6, color: '#14b8a6', padding: '6px 10px', fontSize: '0.78rem', minHeight: 'auto' }}>ย้าย</button>
              <button onClick={() => handleRemove(scout.id)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#ef4444', padding: '6px 10px', fontSize: '0.78rem', minHeight: 'auto' }}>ลบ</button>
            </div>
          </Card>
        ))}

        {patrol?.scouts?.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}><p style={{ fontSize: '2rem' }}>👥</p><p style={{ marginTop: 8 }}>ยังไม่มีสมาชิก</p></div>}
      </div>

      {/* Move Modal */}
      {showMove && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: 24, width: '100%' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 4 }}>ย้าย {showMove.firstName}</h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 16 }}>จาก {patrol?.name}</p>
            <select value={moveTarget} onChange={e => setMoveTarget(e.target.value)} style={{ marginBottom: 16 }}>
              <option value="">-- เลือกหมู่ปลายทาง --</option>
              {allPatrols.filter(p => p.id !== id).map(p => <option key={p.id} value={p.id}>กอง {p.troop?.number} {p.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowMove(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', padding: 12, fontWeight: 600 }}>ยกเลิก</button>
              <button onClick={handleMove} style={{ flex: 1, background: 'linear-gradient(135deg,#0d9488,#0f766e)', borderRadius: 10, color: '#fff', padding: 12, fontWeight: 700 }}>ย้าย</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Scout Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end', overflow: 'auto' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 16 }}>เพิ่มลูกเสือใหม่</h2>
            {[['firstName','ชื่อ'],['lastName','สกุล'],['school','โรงเรียน'],['province','จังหวัด'],['phone','เบอร์โทร'],['email','อีเมล']].map(([k,label]) => (
              <div key={k} style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: '#94a3b8' }}>{label}</label>
                <input value={addForm[k]} onChange={e => setAddForm(p => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', padding: 12, fontWeight: 600 }}>ยกเลิก</button>
              <button onClick={handleAdd} style={{ flex: 1, background: 'linear-gradient(135deg,#d4a017,#b8860b)', borderRadius: 10, color: '#000', padding: 12, fontWeight: 700 }}>เพิ่ม</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
