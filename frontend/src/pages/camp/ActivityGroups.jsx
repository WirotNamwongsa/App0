import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { campApi } from '../../services/api';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import PageHeader from '../../components/PageHeader';
import { Card } from '../../components/common/UI.jsx';
import toast from 'react-hot-toast';
import { Plus, Users, Settings, Trash2, X, Shield, Star } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Constants & pure sub-components — OUTSIDE the main component so they are
// never re-created on every render (which would unmount inputs and lose focus)
// ─────────────────────────────────────────────────────────────────────────────

const GROUP_COLORS = [
  { bg: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { bg: 'from-violet-500 to-purple-600', badge: 'bg-violet-100  text-violet-800  dark:bg-violet-900/40  dark:text-violet-300'  },
  { bg: 'from-amber-500  to-orange-500', badge: 'bg-amber-100   text-amber-800   dark:bg-amber-900/40   dark:text-amber-300'   },
  { bg: 'from-sky-500    to-blue-600',   badge: 'bg-sky-100     text-sky-800     dark:bg-sky-900/40     dark:text-sky-300'     },
  { bg: 'from-rose-500   to-pink-600',   badge: 'bg-rose-100    text-rose-800    dark:bg-rose-900/40    dark:text-rose-300'    },
];
const colorOf = (idx) => GROUP_COLORS[idx % GROUP_COLORS.length];

const INPUT_CLS = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 bg-gray-50 dark:bg-scout-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-scout-400 focus:border-transparent transition text-sm";

function Modal({ children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white dark:bg-scout-700 rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-scout-600">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      <button
        onClick={onClose}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-scout-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function ActivityGroups() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [activityGroups, setActivityGroups] = useState([]);
  const [availableSquads, setAvailableSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManageSquadsModal, setShowManageSquadsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', maxScouts: '' });

  useEffect(() => { fetchActivityGroups(); }, []);

  const fetchActivityGroups = async () => {
    try {
      const response = await campApi.getActivityGroups();
      setActivityGroups(response.data || []);
    } catch {
      toast.error('ไม่สามารถดึงข้อมูลกลุ่มกิจกรรมได้');
      setActivityGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData({ name: '', description: '', maxScouts: '' });
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedGroup(null);
    setFormData({ name: '', description: '', maxScouts: '' });
  };

  const closeManageModal = () => {
    setShowManageSquadsModal(false);
    setSelectedGroup(null);
    setAvailableSquads([]);
  };

  const handleCreate = async () => {
    try {
      await campApi.createActivityGroup({
        ...formData,
        maxScouts: formData.maxScouts ? parseInt(formData.maxScouts) : undefined,
      });
      toast.success('สร้างกลุ่มกิจกรรมสำเร็จ');
      closeCreateModal();
      await fetchActivityGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || 'ไม่สามารถสร้างกลุ่มกิจกรรมได้');
    }
  };

  const handleUpdate = async () => {
    try {
      await campApi.updateActivityGroup(selectedGroup.id, {
        ...formData,
        maxScouts: formData.maxScouts ? parseInt(formData.maxScouts) : undefined,
      });
      toast.success('แก้ไขกลุ่มกิจกรรมสำเร็จ');
      closeEditModal();
      await fetchActivityGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || 'ไม่สามารถแก้ไขกลุ่มกิจกรรมได้');
    }
  };

  const handleDelete = async (id) => {
    const groupToDelete = activityGroups.find(g => g.id === id);
    if (groupToDelete?.squads?.length > 0) {
      if (!confirm(`⚠️ กลุ่มนี้มี ${groupToDelete.squads.length} หมู่อยู่!\nต้องการลบกลุ่มกิจกรรม "${groupToDelete.name}" และหมู่ทั้งหมดใช่หรือไม่?`)) return;
    } else {
      if (!confirm('คุณต้องการลบกลุ่มกิจกรรมนี้ใช่หรือไม่?')) return;
    }
    try {
      await api.delete(`/activity-groups/${id}`);
      toast.success('ลบกลุ่มกิจกรรมสำเร็จ');
      await fetchActivityGroups();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'ไม่สามารถลบกลุ่มกิจกรรมได้';
      toast.error(msg);
    }
  };

  const openEditModal = (group) => {
    setSelectedGroup(group);
    setFormData({ name: group.name, description: group.description || '', maxScouts: group.maxScouts?.toString() || '' });
    setShowEditModal(true);
  };

  const openManageSquadsModal = async (group) => {
    setSelectedGroup(group);
    try {
      // API interceptor already extracts response.data, so response IS the data
      const { user } = useAuthStore.getState();
      console.log('Current user:', user);
      console.log('User campId:', user?.campId);
      
      try {
        const response1 = await api.get('/camps/my');
        console.log('Response (already extracted data):', response1);
        console.log('Response type:', typeof response1);
        console.log('Response keys:', Object.keys(response1 || {}));
        
        const campsData = response1; // No .data needed because interceptor already extracted it
        console.log('campsData.troops:', campsData?.troops);
        console.log('campsData.troops length:', campsData?.troops?.length);
        
        if (campsData?.troops) {
          campsData.troops.forEach((troop, index) => {
            console.log(`Troop ${index}:`, troop);
            console.log(`Troop ${index} squads:`, troop.squads);
            console.log(`Troop ${index} squads length:`, troop.squads?.length);
          });
        }
        
        const allSquads = campsData?.troops?.flatMap(troop =>
          troop.squads?.map(squad => ({ 
            ...squad, 
            troopName: troop.name || `กอง ${troop.number}`, 
            troopId: troop.id 
          })) || []
        ) || [];
        console.log('All squads:', allSquads);
        
        const assignedSquadIds = group.squads?.map(s => s.id) || [];
        console.log('Assigned squad IDs:', assignedSquadIds);
        const availableSquads = allSquads.filter(squad => !assignedSquadIds.includes(squad.id));
        console.log('Available squads:', availableSquads);
        setAvailableSquads(availableSquads);
        setShowManageSquadsModal(true);
      } catch (error1) {
        console.error('Error with camps API:', error1);
        console.error('Error response:', error1.response);
        toast.error('ไม่สามารถดึงข้อมูลหมู่ได้');
      }
    } catch (error) {
      console.error('Error fetching squads:', error);
      toast.error('ไม่สามารถดึงข้อมูลหมู่ได้');
    }
  };

  const handleAssignSquad = async (squadId) => {
    if (!selectedGroup) return;
    try {
      await api.post(`/activity-groups/${selectedGroup.id}/assign-squad`, { squadId });
      toast.success('เพิ่มหมู่สำเร็จ');
      await fetchActivityGroups();
      const updatedGroups = await campApi.getActivityGroups();
      const updatedGroup = updatedGroups.data?.find(g => g.id === selectedGroup.id);
      if (updatedGroup) setSelectedGroup(updatedGroup);
      openManageSquadsModal(updatedGroup || selectedGroup);
    } catch (error) {
      toast.error(error.response?.data?.message || 'ไม่สามารถเพิ่มหมู่ได้');
    }
  };

  const handleRemoveSquad = async (squadId) => {
    if (!selectedGroup) return;
    try {
      await api.delete(`/activity-groups/${selectedGroup.id}/remove-squad/${squadId}`);
      toast.success('ลบหมู่สำเร็จ');
      await fetchActivityGroups();
      const updatedGroups = await campApi.getActivityGroups();
      const updatedGroup = updatedGroups.data?.find(g => g.id === selectedGroup.id);
      if (updatedGroup) setSelectedGroup(updatedGroup);
      openManageSquadsModal(updatedGroup || selectedGroup);
    } catch (error) {
      toast.error(error.response?.data?.message || 'ไม่สามารถลบหมู่ได้');
    }
  };

  // ── loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page">
      <PageHeader title="จัดการกลุ่มกิจกรรม" />
      <div className="flex justify-center py-20">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-scout-200 dark:border-scout-700" />
          <div className="absolute inset-0 rounded-full border-4 border-t-scout-500 animate-spin" />
        </div>
      </div>
    </div>
  );

  const totalSquads = activityGroups.reduce((s, g) => s + (g._count?.squads || 0), 0);
  const totalScouts = activityGroups.reduce((s, g) => s + (g.squads?.reduce((ss, sq) => ss + (sq._count?.scouts || 0), 0) || 0), 0);

  return (
    <div className="page">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">กลุ่มกิจกรรม</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            จัดกลุ่มหมู่ต่างๆ เพื่อการจัดกิจกรรมที่มีประสิทธิภาพ
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 active:scale-95 text-white text-sm font-semibold shadow-lg shadow-scout-600/25 transition-all duration-150"
        >
          <Plus size={16} /> เพิ่มกลุ่ม
        </button>
      </div>

      {/* Summary strip */}
      {activityGroups.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-7">
          {[
            { label: 'กลุ่มทั้งหมด',   value: activityGroups.length, icon: <Shield size={16} /> },
            { label: 'หมู่ทั้งหมด',    value: totalSquads,           icon: <Users  size={16} /> },
            { label: 'ลูกเสือทั้งหมด', value: totalScouts,           icon: <Star   size={16} /> },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-gray-100 dark:border-scout-600 bg-white dark:bg-scout-800 px-4 py-3 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-scout-100 dark:bg-scout-900/40 text-scout-600 dark:text-scout-400 flex items-center justify-center flex-shrink-0">
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cards */}
      <div className="space-y-4">
        {activityGroups.map((group, idx) => {
          const col = colorOf(idx);
          return (
            <div key={group.id} className="relative rounded-2xl border border-gray-100 dark:border-scout-600 bg-white dark:bg-scout-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${col.bg}`} />
              <div className="pl-5 pr-5 py-5 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className={`w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br ${col.bg} flex items-center justify-center shadow-lg`}>
                  <span className="text-white text-xl font-bold">{group.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2 mb-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{group.name}</h3>
                    {group.manager && <span className="text-xs text-gray-400 dark:text-gray-500">· {group.manager.name}</span>}
                  </div>
                  {group.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{group.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-scout-900/40 text-gray-600 dark:text-gray-300">
                      <Users size={11} /> {group._count?.squads || 0} หมู่
                    </span>
                    {group.maxScouts && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-scout-900/40 text-gray-600 dark:text-gray-300">
                        👥 สูงสุด {group.maxScouts} คน
                      </span>
                    )}
                  </div>
                  {group.squads?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {group.squads.map(squad => (
                        <span key={squad.id} className={`text-xs font-medium px-2.5 py-1 rounded-full ${col.badge}`}>
                          {squad.troop?.name || `กอง ${squad.troop?.number || '?'}`} · {squad.name}
                          {squad._count?.scouts > 0 && <span className="ml-1 opacity-70">({squad._count.scouts})</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex sm:flex-col gap-2 flex-shrink-0">
                  <button onClick={() => openManageSquadsModal(group)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r ${col.bg} text-white shadow-sm hover:opacity-90 active:scale-95 transition-all`}>
                    <Users size={13} /> จัดการหมู่
                  </button>
                  <button onClick={() => openEditModal(group)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-scout-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-600 active:scale-95 transition-all">
                    <Settings size={13} /> แก้ไข
                  </button>
                  <button onClick={() => handleDelete(group.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-red-100 dark:border-red-900/40 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-all">
                    <Trash2 size={13} /> ลบ
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {activityGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-scout-50 dark:bg-scout-900/30 flex items-center justify-center mb-4">
            <Users size={36} className="text-scout-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">ยังไม่มีกลุ่มกิจกรรม</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">เริ่มสร้างกลุ่มแรกของค่ายคุณได้เลย</p>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 text-white text-sm font-semibold shadow-lg shadow-scout-600/25 transition-all active:scale-95">
            <Plus size={16} /> เพิ่มกลุ่มกิจกรรม
          </button>
        </div>
      )}

      {/* ══ Create Modal ═════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <Modal onClose={closeCreateModal}>
          <ModalHeader title="สร้างกลุ่มกิจกรรมใหม่" onClose={closeCreateModal} />
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">ชื่อกลุ่มกิจกรรม *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={INPUT_CLS}
                placeholder="เช่น กลุ่มทักษะชีวิต"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">รายละเอียด</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`${INPUT_CLS} min-h-[88px] resize-y`}
                placeholder="รายละเอียดกลุ่มกิจกรรม"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">จำนวนลูกเสือสูงสุด</label>
              <input
                type="number"
                value={formData.maxScouts}
                onChange={e => setFormData(prev => ({ ...prev, maxScouts: e.target.value }))}
                className={INPUT_CLS}
                placeholder="เว้นว่างถ้าไม่จำกัด"
              />
            </div>
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={closeCreateModal} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-600 transition">ยกเลิก</button>
            <button onClick={handleCreate} disabled={!formData.name} className="flex-1 px-4 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 text-white text-sm font-semibold shadow-md shadow-scout-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition">สร้างกลุ่ม</button>
          </div>
        </Modal>
      )}

      {/* ══ Edit Modal ═══════════════════════════════════════════════════════ */}
      {showEditModal && (
        <Modal onClose={closeEditModal}>
          <ModalHeader title="แก้ไขกลุ่มกิจกรรม" onClose={closeEditModal} />
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">ชื่อกลุ่มกิจกรรม *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">รายละเอียด</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`${INPUT_CLS} min-h-[88px] resize-y`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">จำนวนลูกเสือสูงสุด</label>
              <input
                type="number"
                value={formData.maxScouts}
                onChange={e => setFormData(prev => ({ ...prev, maxScouts: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={closeEditModal} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-600 transition">ยกเลิก</button>
            <button onClick={handleUpdate} disabled={!formData.name} className="flex-1 px-4 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 text-white text-sm font-semibold shadow-md shadow-scout-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition">บันทึก</button>
          </div>
        </Modal>
      )}

      {/* ══ Manage Squads Modal ══════════════════════════════════════════════ */}
      {showManageSquadsModal && selectedGroup && (
        <Modal wide onClose={closeManageModal}>
          <ModalHeader title={`จัดการหมู่ · ${selectedGroup.name}`} onClose={closeManageModal} />
          <div className="px-6 py-5 space-y-6">
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">หมู่ในกลุ่ม</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-scout-100 dark:bg-scout-900/40 text-scout-700 dark:text-scout-300">
                  {selectedGroup.squads?.length || 0}
                </span>
              </div>
              {selectedGroup.squads?.length > 0 ? (
                <div className="space-y-2">
                  {selectedGroup.squads.map(squad => (
                    <div key={squad.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-scout-100 dark:bg-scout-900/40 flex items-center justify-center">
                          <Users size={14} className="text-scout-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white">{squad.troop?.name} · {squad.name}</p>
                          <p className="text-xs text-gray-400">{squad._count?.scouts || 0} คน</p>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveSquad(squad.id)} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition active:scale-95">
                        <X size={12} /> ลบออก
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 rounded-xl bg-gray-50 dark:bg-scout-800/40 border border-dashed border-gray-200 dark:border-scout-600">
                  <p className="text-sm text-gray-400">ยังไม่มีหมู่ในกลุ่มนี้</p>
                </div>
              )}
            </section>

            <div className="border-t border-gray-100 dark:border-scout-600" />

            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">หมู่ที่สามารถเพิ่มได้</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  {availableSquads.length}
                </span>
              </div>
              {availableSquads.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {availableSquads.map(squad => (
                    <div key={squad.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                          <Users size={14} className="text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white">{squad.troopName} · {squad.name}</p>
                          <p className="text-xs text-gray-400">{squad._count?.scouts || 0} คน</p>
                        </div>
                      </div>
                      <button onClick={() => handleAssignSquad(squad.id)} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95">
                        <Plus size={12} /> เพิ่ม
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 rounded-xl bg-gray-50 dark:bg-scout-800/40 border border-dashed border-gray-200 dark:border-scout-600">
                  <p className="text-sm text-gray-400">ไม่มีหมู่ที่สามารถเพิ่มได้</p>
                </div>
              )}
            </section>
          </div>

          <div className="px-6 pb-6">
            <button onClick={closeManageModal} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-600 transition">
              ปิด
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}