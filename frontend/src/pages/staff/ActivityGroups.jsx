import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffApi, campApi } from '../../services/api';
import { Card, Spinner, Button } from '../../components/common/UI.jsx';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { key: 'scan', icon: '📷', label: 'สแกน' },
  { key: 'activity-groups', icon: '👥', label: 'จัดกลุ่ม' },
  { key: 'scanned', icon: '✅', label: 'ประวัติ' },
];

export default function StaffActivityGroups() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activityGroups, setActivityGroups] = useState([]);
  const [availableSquads, setAvailableSquads] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchActivityGroups();
    fetchAvailableSquads();
  }, []);

  const fetchActivityGroups = async () => {
    try {
      const response = await staffApi.getActivityGroups();
      setActivityGroups(response);
    } catch (error) {
      toast.error('ไม่สามารถดึงข้อมูลกลุ่มกิจกรรมได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSquads = async () => {
    try {
      const response = await campApi.getStructure();
      const camp = response;
      
      // ดึงหมู่ทั้งหมดในค่าย
      const allSquads = [];
      camp.troops.forEach(troop => {
        troop.squads.forEach(squad => {
          allSquads.push({
            ...squad,
            troopName: troop.name,
            troopNumber: troop.number
          });
        });
      });
      
      setAvailableSquads(allSquads);
    } catch (error) {
      toast.error('ไม่สามารถดึงข้อมูลหมู่ได้');
    }
  };

  const handleAssignSquad = async (squadId) => {
    if (!selectedGroup) return;
    
    try {
      await staffApi.assignSquadToGroup(selectedGroup.id, squadId);
      toast.success('จัดหมู่เข้ากลุ่มกิจกรรมสำเร็จ');
      setShowAssignModal(false);
      setSelectedGroup(null);
      fetchActivityGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || 'ไม่สามารถจัดหมู่ได้');
    }
  };

  const handleRemoveSquad = async (groupId, squadId) => {
    if (!confirm('คุณต้องการถอนหมู่นี้จากกลุ่มกิจกรรมใช่หรือไม่?')) return;
    
    try {
      await staffApi.removeSquadFromGroup(groupId, squadId);
      toast.success('ถอนหมู่จากกลุ่มกิจกรรมสำเร็จ');
      fetchActivityGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || 'ไม่สามารถถอนหมู่ได้');
    }
  };

  const openAssignModal = (group) => {
    setSelectedGroup(group);
    setShowAssignModal(true);
  };

  const getSquadsNotInGroup = () => {
    if (!selectedGroup) return [];
    
    const squadIdsInGroup = selectedGroup.squads.map(s => s.id);
    return availableSquads.filter(squad => !squadIdsInGroup.includes(squad.id));
  };

  const handleNav = (key) => {
    const routes = { 
      scan: '/staff/scan', 
      'activity-groups': '/staff/activity-groups',
      scanned: '/staff/scanned'
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
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>ผู้จัดกิจกรรมค่ายย่อย</p>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>จัดหมู่ลูกเสือเข้ากลุ่มกิจกรรม</h1>
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
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
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
                  </div>
                  
                  {group.squads.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 8 }}>หมู่ในกลุ่ม:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {group.squads.map((squad) => (
                          <div
                            key={squad.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              background: 'rgba(34, 197, 94, 0.15)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              borderRadius: 6,
                              padding: '6px 10px',
                              fontSize: '0.75rem',
                              color: '#86efac'
                            }}
                          >
                            <span>{squad.troop.name} - {squad.name}</span>
                            <span style={{ color: '#64748b' }}>({squad._count.scouts} คน)</span>
                            <button
                              onClick={() => handleRemoveSquad(group.id, squad.id)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: 'none',
                                borderRadius: 4,
                                color: '#fca5a5',
                                padding: '2px 6px',
                                fontSize: '0.7rem',
                                cursor: 'pointer'
                              }}
                            >
                              ถอน
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => openAssignModal(group)}
                  style={{
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    border: 'none',
                    borderRadius: 6,
                    color: 'white',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ➕ เพิ่มหมู่
                </button>
              </div>
            </Card>
          ))}
        </div>

        {activityGroups.length === 0 && (
          <Card style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>ยังไม่มีกลุ่มกิจกรรม</p>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 8 }}>
              กรุณาติดต่อผู้ดูแลค่ายย่อยเพื่อสร้างกลุ่มกิจกรรม
            </p>
          </Card>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedGroup && (
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
            maxWidth: 500,
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>
              เพิ่มหมู่เข้ากลุ่ม: {selectedGroup.name}
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 8 }}>
                หมู่ที่สามารถเพิ่มได้:
              </p>
              {getSquadsNotInGroup().length > 0 ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {getSquadsNotInGroup().map((squad) => (
                    <div
                      key={squad.id}
                      style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: 8,
                        padding: 12,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <p style={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600 }}>
                          {squad.troopName} - {squad.name}
                        </p>
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                          {squad._count.scouts} คน
                        </p>
                      </div>
                      <button
                        onClick={() => handleAssignSquad(squad.id)}
                        style={{
                          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                          border: 'none',
                          borderRadius: 6,
                          color: 'white',
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        เพิ่ม
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: 20 }}>
                  ไม่มีหมู่ที่สามารถเพิ่มได้
                </p>
              )}
            </div>
            
            <button
              onClick={() => {
                setShowAssignModal(false);
                setSelectedGroup(null);
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
