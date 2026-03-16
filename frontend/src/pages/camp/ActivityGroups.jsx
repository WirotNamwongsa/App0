import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { campApi } from '../../services/api';
import { Card, Spinner, Button } from '../../components/common/UI.jsx';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { key: 'dashboard', icon: '📊', label: 'ภาพรวม' },
  { key: 'activity-groups', icon: '👥', label: 'กลุ่มกิจกรรม' },
  { key: 'structure', icon: '🏕️', label: 'โครงสร้าง' },
  { key: 'schedule', icon: '📅', label: 'ตาราง' },
  { key: 'report', icon: '📋', label: 'รายงาน' },
];

export default function ActivityGroups() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activityGroups, setActivityGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxScouts: ''
  });

  useEffect(() => {
    fetchActivityGroups();
  }, []);

  const fetchActivityGroups = async () => {
    try {
      const response = await campApi.getActivityGroups();
      setActivityGroups(response);
    } catch (error) {
      toast.error('ไม่สามารถดึงข้อมูลกลุ่มกิจกรรมได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await campApi.createActivityGroup({
        ...formData,
        maxScouts: formData.maxScouts ? parseInt(formData.maxScouts) : undefined
      });
      toast.success('สร้างกลุ่มกิจกรรมสำเร็จ');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', maxScouts: '' });
      fetchActivityGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || 'ไม่สามารถสร้างกลุ่มกิจกรรมได้');
    }
  };

  const handleUpdate = async () => {
    try {
      await campApi.updateActivityGroup(selectedGroup.id, {
        ...formData,
        maxScouts: formData.maxScouts ? parseInt(formData.maxScouts) : undefined
      });
      toast.success('แก้ไขกลุ่มกิจกรรมสำเร็จ');
      setShowEditModal(false);
      setSelectedGroup(null);
      setFormData({ name: '', description: '', maxScouts: '' });
      fetchActivityGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || 'ไม่สามารถแก้ไขกลุ่มกิจกรรมได้');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบกลุ่มกิจกรรมนี้ใช่หรือไม่?')) return;
    
    try {
      await campApi.deleteActivityGroup(id);
      toast.success('ลบกลุ่มกิจกรรมสำเร็จ');
      fetchActivityGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || 'ไม่สามารถลบกลุ่มกิจกรรมได้');
    }
  };

  const openEditModal = (group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      maxScouts: group.maxScouts?.toString() || ''
    });
    setShowEditModal(true);
  };

  const handleNav = (key) => {
    const routes = { 
      dashboard: '/camp/dashboard', 
      'activity-groups': '/camp/activity-groups',
      structure: '/camp/structure', 
      schedule: '/camp/schedule', 
      report: '/camp/report' 
    };
    navigate(routes[key]);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0f2440, #0a1628)', paddingBottom: 80 }}>
      <div style={{ padding: '48px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>ผู้ดูแลค่ายย่อย</p>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>จัดการกลุ่มกิจกรรม</h1>
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

        <div style={{ marginBottom: 20 }}>
          <Button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            ➕ เพิ่มกลุ่มกิจกรรม
          </Button>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {activityGroups.map((group) => (
            <Card key={group.id} style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
                    {group.name}
                  </h3>
                  {group.description && (
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 12 }}>
                      {group.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>👥</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        {group._count.squads} หมู่
                      </span>
                    </div>
                    {group.maxScouts && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>📊</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                          สูงสุด {group.maxScouts} คน
                        </span>
                      </div>
                    )}
                    {group.manager && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>👤</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                          {group.manager.name}
                        </span>
                      </div>
                    )}
                  </div>
                  {group.squads.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
                      <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 8 }}>หมู่ในกลุ่ม:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {group.squads.map((squad) => (
                          <span
                            key={squad.id}
                            style={{
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: 6,
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              color: '#93c5fd'
                            }}
                          >
                            {squad.troop.name} - {squad.name} ({squad._count.scouts} คน)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => openEditModal(group)}
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: 6,
                      color: '#93c5fd',
                      padding: '6px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 6,
                      color: '#fca5a5',
                      padding: '6px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {activityGroups.length === 0 && (
          <Card style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>ยังไม่มีกลุ่มกิจกรรม</p>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 8 }}>
              กดปุ่ม "เพิ่มกลุ่มกิจกรรม" เพื่อเริ่มสร้างกลุ่มแรก
            </p>
          </Card>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 1000
        }}>
          <div style={{
            background: '#1e293b',
            borderRadius: 12,
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>
              สร้างกลุ่มกิจกรรมใหม่
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>
                  ชื่อกลุ่มกิจกรรม *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: '#0f172a',
                    color: '#f1f5f9',
                    fontSize: '0.9rem'
                  }}
                  placeholder="เช่น กลุ่มทักษะชีวิต"
                />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>
                  รายละเอียด
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: '#0f172a',
                    color: '#f1f5f9',
                    fontSize: '0.9rem',
                    minHeight: 80,
                    resize: 'vertical'
                  }}
                  placeholder="รายละเอียดกลุ่มกิจกรรม"
                />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>
                  จำนวนลูกเสือสูงสุด
                </label>
                <input
                  type="number"
                  value={formData.maxScouts}
                  onChange={(e) => setFormData({ ...formData, maxScouts: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: '#0f172a',
                    color: '#f1f5f9',
                    fontSize: '0.9rem'
                  }}
                  placeholder="เว้นว่างไว้ถ้าไม่จำกัด"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: '', description: '', maxScouts: '' });
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.name}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: 'none',
                  background: formData.name ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'rgba(148, 163, 184, 0.3)',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                สร้าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 1000
        }}>
          <div style={{
            background: '#1e293b',
            borderRadius: 12,
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>
              แก้ไขกลุ่มกิจกรรม
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>
                  ชื่อกลุ่มกิจกรรม *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: '#0f172a',
                    color: '#f1f5f9',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>
                  รายละเอียด
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: '#0f172a',
                    color: '#f1f5f9',
                    fontSize: '0.9rem',
                    minHeight: 80,
                    resize: 'vertical'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>
                  จำนวนลูกเสือสูงสุด
                </label>
                <input
                  type="number"
                  value={formData.maxScouts}
                  onChange={(e) => setFormData({ ...formData, maxScouts: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: '#0f172a',
                    color: '#f1f5f9',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedGroup(null);
                  setFormData({ name: '', description: '', maxScouts: '' });
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpdate}
                disabled={!formData.name}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: 'none',
                  background: formData.name ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'rgba(148, 163, 184, 0.3)',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
