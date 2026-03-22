// src/pages/leader/LeaderProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import PageHeader from '../../components/PageHeader'
import BottomNav from '../../components/BottomNav'
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function LeaderProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [leader, setLeader] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/squad-leader/profile')
      .then(data => {
        // api interceptor คืน r.data อยู่แล้ว ดังนั้น data คือข้อมูลตรงๆ
        setLeader(data);
        setForm({
          prefix: data.prefix || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          email: data.email || '',
          school: data.school || '',
          province: data.province || ''
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.patch('/squad-leader/profile', form);
      setLeader(updated);
      setEditing(false);
      toast.success('บันทึกสำเร็จ');
    } catch (err) {
      toast.error(err.response?.data?.error || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="page">
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-scout-600"></div>
      </div>
    </div>
  );

  const roleFields = [
    { label: 'ตำแหน่ง', value: 'ผู้กำกับหมู่' },
    { label: 'ชื่อผู้ใช้', value: user?.username || '-' },
    ...(leader?.leadingSquads?.[0]  ? [
      { label: 'หมู่ที่รับผิดชอบ', value: `หมู่ ${leader.leadingSquads[0].number} กอง ${leader.leadingSquads[0].troop?.number}` },
      { label: 'ค่าย', value: leader.leadingSquads[0].troop?.camp?.name || '-' }
    ] : [])
  ];

  const personalFields = [
    { label: 'ชื่อ-สกุล', value: `${leader?.prefix || ''} ${leader?.firstName || ''} ${leader?.lastName || ''}`.trim() || '-' },
    { label: 'สถานศึกษา', value: leader?.school || '-' },
    { label: 'จังหวัด', value: leader?.province || '-' },
    { label: 'เบอร์โทรศัพท์', value: leader?.phone || '-' },
    { label: 'อีเมล', value: leader?.email || '-' },
  ];

  const editFields = [
    { key: 'prefix', label: 'คำนำหน้า', type: 'select', options: ['ด.ช.', 'ด.ญ.', 'นาย', 'นาง', 'นางสาว'] },
    { key: 'firstName', label: 'ชื่อจริง' },
    { key: 'lastName', label: 'นามสกุล' },
    { key: 'school', label: 'สถานศึกษา' },
    { key: 'province', label: 'จังหวัด', type: 'select', options: ["กรุงเทพมหานคร","กระบี่","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร","ขอนแก่น","จันทบุรี","ฉะเชิงเทรา","ชลบุรี","ชัยนาท","ชัยภูมิ","ชุมพร","เชียงราย","เชียงใหม่","ตรัง","ตราด","ตาก","นครนายก","นครปฐม","นครพนม","นครราชสีมา","นครศรีธรรมราช","นครสวรรค์","นนทบุรี","นราธิวาส","น่าน","บึงกาฬ","บุรีรัมย์","ปทุมธานี","ประจวบคีรีขันธ์","ปราจีนบุรี","ปัตตานี","พระนครศรีอยุธยา","พะเยา","พังงา","พัทลุง","พิจิตร","พิษณุโลก","เพชรบุรี","เพชรบูรณ์","แพร่","ภูเก็ต","มหาสารคาม","มุกดาหาร","แม่ฮ่องสอน","ยโสธร","ยะลา","ร้อยเอ็ด","ระนอง","ระยอง","ราชบุรี","ลพบุรี","ลำปาง","ลำพูน","เลย","ศรีสะเกษ","สกลนคร","สงขลา","สตูล","สมุทรปราการ","สมุทรสงคราม","สมุทรสาคร","สระแก้ว","สระบุรี","สิงห์บุรี","สุโขทัย","สุพรรณบุรี","สุราษฎร์ธานี","สุรินทร์","หนองคาย","หนองบัวลำภู","อ่างทอง","อำนาจเจริญ","อุดรธานี","อุตรดิตถ์","อุทัยธานี","อุบลราชธานี"] },
    { key: 'phone', label: 'เบอร์โทรศัพท์', type: 'tel' },
    { key: 'email', label: 'อีเมล', type: 'email' },
  ];

  return (
    <div className="page">
      <PageHeader
        title="โปรไฟล์ผู้กำกับ"
        action={
          !editing ? (
            <button
              onClick={() => setEditing(true)}
              className="bg-scout-600 hover:bg-scout-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              แก้ไข
            </button>
          ) : null
        }
      />

      {/* ข้อมูลตำแหน่ง */}
      <div className="card space-y-4 mb-4">
        {roleFields.map(f => (
          <div key={f.label} className="flex justify-between items-start">
            <span className="text-gray-500 text-sm">{f.label}</span>
            <span className="text-scout-900 dark:text-white text-sm font-medium text-right max-w-[60%]">
              {f.label === 'ตำแหน่ง' ? (
                <span className="text-scout-600 font-semibold">{f.value}</span>
              ) : f.value}
            </span>
          </div>
        ))}
      </div>

      {/* โหมดแก้ไข */}
      {editing ? (
        <div className="card space-y-4 mb-4">
          <h3 className="text-scout-900 dark:text-white font-semibold mb-2">✏️ แก้ไขข้อมูลส่วนตัว</h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">ข้อมูลส่วนตัว</p>

          {editFields.map(f => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block">{f.label}</label>
              {f.type === 'select' ? (
                <select
                  value={form[f.key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-scout-600 rounded-xl bg-gray-50 dark:bg-scout-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-scout-400 focus:border-transparent transition text-sm"
                >
                  <option value="">เลือก{f.label}</option>
                  {f.options?.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type || 'text'}
                  value={form[f.key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-scout-600 rounded-xl bg-gray-50 dark:bg-scout-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-scout-400 focus:border-transparent transition text-sm"
                  placeholder={f.label}
                />
              )}
            </div>
          ))}

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-300">
            🔒 แก้ไขไม่ได้: ชื่อผู้ใช้ / ตำแหน่ง / หมู่ที่รับผิดชอบ / ค่าย (ติดต่อผู้ดูแลค่าย)
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      ) : (
        /* โหมดดูปกติ */
        <div className="card space-y-4 mb-4">
          <h3 className="text-scout-900 dark:text-white font-semibold">ข้อมูลส่วนตัว</h3>
          {personalFields.map(f => (
            <div key={f.label} className="flex justify-between items-start">
              <span className="text-gray-500 text-sm">{f.label}</span>
              <span className="text-scout-900 dark:text-white text-sm font-medium text-right max-w-[60%]">{f.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* ติดต่อผู้ดูแลค่าย */}
      <div className="card bg-scout-50 dark:bg-scout-900/30 mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">📞</div>
          <div>
            <p className="text-sm font-semibold text-scout-700 dark:text-scout-300">ติดต่อผู้ดูแลค่าย</p>
            <p className="text-xs text-scout-600 dark:text-scout-400 mt-1">
              หากต้องการแก้ไขข้อมูลที่ไม่สามารถแก้ไขได้ กรุณาติดต่อผู้ดูแลระบบ
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}