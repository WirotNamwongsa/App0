// src/pages/leader/LeaderScout.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leaderApi } from '../../services/api';
import { PageHeader, Card, Button, Spinner } from '../../components/common/UI';
import toast from 'react-hot-toast';

export default function LeaderScout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scout, setScout] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderApi.getScout(id).then(r => {
      setScout(r.data);
      setForm({ firstName: r.data.firstName, lastName: r.data.lastName, nickname: r.data.nickname || '', school: r.data.school || '', province: r.data.province || '', phone: r.data.phone || '', email: r.data.email || '' });
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await leaderApi.updateScout(id, form);
      setScout(updated.data);
      setEditing(false);
      toast.success('บันทึกสำเร็จ');
    } catch (err) {
      toast.error(err.response?.data?.error || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={40} /></div>;

  const progress = (() => {
    const passed = scout?.attendances?.filter(a => a.status === 'PASSED') || [];
    return { MAIN: passed.filter(a => a.schedule?.activity?.type === 'MAIN'), SPECIAL: passed.filter(a => a.schedule?.activity?.type === 'SPECIAL'), FREE: passed.filter(a => a.schedule?.activity?.type === 'FREE') };
  })();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0f2440, #0a1628)' }}>
      <PageHeader
        title={`${scout?.firstName} ${scout?.lastName}`}
        subtitle={`รหัส: ${scout?.scoutCode}`}
        onBack={() => navigate(-1)}
        action={
          !editing ? (
            <button onClick={() => setEditing(true)} style={{ background: 'rgba(212,160,23,0.2)', border: '1px solid rgba(212,160,23,0.4)', borderRadius: 8, color: '#d4a017', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600 }}>แก้ไข</button>
          ) : null
        }
      />

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Progress cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { label: 'หลัก', count: progress.MAIN.length, color: '#22c55e' },
            { label: 'พิเศษ', count: progress.SPECIAL.length, color: '#d4a017' },
            { label: 'ว่าง', count: progress.FREE.length, color: '#0d9488' },
          ].map(p => (
            <Card key={p.label} style={{ textAlign: 'center', padding: '12px 8px' }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: p.color }}>{p.count}</p>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.label}</p>
            </Card>
          ))}
        </div>

        {editing ? (
          <Card>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, color: '#d4a017' }}>✏️ แก้ไขข้อมูล</h2>
            {[
              { key: 'firstName', label: 'ชื่อ' },
              { key: 'lastName', label: 'สกุล' },
              { key: 'nickname', label: 'ชื่อเล่น' },
              { key: 'school', label: 'โรงเรียน' },
              { key: 'province', label: 'จังหวัด' },
              { key: 'phone', label: 'เบอร์โทร', type: 'tel' },
              { key: 'email', label: 'อีเมล', type: 'email' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: '#94a3b8' }}>{f.label}</label>
                <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}

            <div style={{ background: 'rgba(100,116,139,0.1)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: '0.82rem', color: '#94a3b8' }}>
              🔒 แก้ไขไม่ได้: รหัสลูกเสือ / หมู่ / กอง (ติดต่อผู้ดูแลค่าย)
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setEditing(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', padding: '12px', fontWeight: 600 }}>ยกเลิก</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: 'linear-gradient(135deg,#0d9488,#0f766e)', borderRadius: 10, color: '#fff', padding: '12px', fontWeight: 700 }}>
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </Card>
        ) : (
          <Card>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 14, color: '#94a3b8' }}>ข้อมูลส่วนตัว</h2>
            {[
              ['โรงเรียน', scout?.school],
              ['จังหวัด', scout?.province],
              ['เบอร์โทร', scout?.phone],
              ['อีเมล', scout?.email],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#64748b', fontSize: '0.88rem' }}>{label}</span>
                <span style={{ fontSize: '0.9rem' }}>{value}</span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
