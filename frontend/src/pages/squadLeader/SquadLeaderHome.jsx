import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { squadLeaderApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { Plus, Users, School, X, UserPlus } from 'lucide-react';

export default function SquadLeaderHome() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [squad, setSquad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableScouts, setAvailableScouts] = useState(null);
  const [loadingScouts, setLoadingScouts] = useState(false);
  const [addingScout, setAddingScout] = useState(false);

  useEffect(() => {
    loadSquad();
  }, []);

  const loadSquad = async () => {
    try {
      setLoading(true);
      const data = await squadLeaderApi.getMySquad();
      setSquad(data);
    } catch (err) {
      toast.error('โหลดข้อมูลหมู่ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableScouts = async () => {
    try {
      setLoadingScouts(true);
      const data = await squadLeaderApi.getAvailableScouts();
      setAvailableScouts(data);
    } catch (err) {
      toast.error('โหลดรายชื่อลูกเสือไม่สำเร็จ');
    } finally {
      setLoadingScouts(false);
    }
  };

  const handleAddScout = async (scoutId) => {
    try {
      setAddingScout(true);
      await squadLeaderApi.addScout(scoutId);
      toast.success('เพิ่มลูกเสือสำเร็จ');
      setShowAddModal(false);
      loadSquad();
      loadAvailableScouts();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'เพิ่มลูกเสือไม่สำเร็จ');
    } finally {
      setAddingScout(false);
    }
  };

  const handleRemoveScout = async (scoutId) => {
    try {
      await squadLeaderApi.removeScout(scoutId);
      toast.success('นำลูกเสือออกจากหมู่สำเร็จ');
      loadSquad();
    } catch (err) {
      toast.error('ไม่สามารถนำลูกเสือออกได้');
    }
  };

  const openAddModal = () => {
    setShowAddModal(true);
    loadAvailableScouts();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-4 border-scout-200 border-t-scout-700 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="mb-5">
        <div>
          <p className="text-xs text-gray-400">ผู้กำกับหมู่</p>
          <h1 className="text-xl font-bold text-scout-900 dark:text-white">หมู่ {squad?.name}</h1>
          <p className="text-xs text-gray-400 mt-0.5">กอง {squad?.troop?.name} · ค่าย {squad?.troop?.camp?.name}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card text-center p-4">
          <p className="text-2xl font-bold text-scout-700 dark:text-scout-300">{squad?.scouts?.length || 0}</p>
          <p className="text-xs text-gray-400 mt-1">สมาชิก</p>
        </div>
        <div className="card text-center p-4">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{availableScouts?.currentCount || 0}/8</p>
          <p className="text-xs text-gray-400 mt-1">จำนวน</p>
        </div>
        <div className="card text-center p-4">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{availableScouts?.school || '-'}</p>
          <p className="text-xs text-gray-400 mt-1">สถานศึกษา</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-5">
        {availableScouts?.canAdd !== false && (
          <button
            onClick={openAddModal}
            className="flex-1 btn-primary flex items-center justify-center gap-2 py-3"
          >
            <Plus size={18} />
            <span>เพิ่มด่วน ({squad?.scouts?.length || 0}/8)</span>
          </button>
        )}
        <button
          onClick={() => navigate('/squad-leader/add-scout')}
          className={availableScouts?.canAdd !== false ? "flex-1 btn-secondary flex items-center justify-center gap-2 py-3" : "flex-1 btn-primary flex items-center justify-center gap-2 py-3"}
        >
          <UserPlus size={18} />
          <span>จัดการการเพิ่ม</span>
        </button>
      </div>

      {/* Scout List */}
      <div className="card">
        <h2 className="text-sm font-semibold text-scout-800 dark:text-scout-200 mb-4">
          สมาชิกในหมู่ ({squad?.scouts?.length || 0} คน)
        </h2>
        <div className="space-y-2">
          {squad?.scouts?.map(scout => (
            <div key={scout.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-scout-800 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-scout-100 dark:bg-scout-700 flex items-center justify-center text-sm font-bold text-scout-700 dark:text-scout-300">
                {scout.firstName?.[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-scout-900 dark:text-white">{scout.firstName} {scout.lastName}</p>
                <p className="text-xs text-gray-400">{scout.scoutCode}</p>
                {scout.school && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{scout.school}</p>
                )}
              </div>
              <button
                onClick={() => handleRemoveScout(scout.id)}
                className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {(!squad?.scouts || squad.scouts.length === 0) && (
            <div className="text-center py-8">
              <Users size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">ยังไม่มีสมาชิกในหมู่</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Scout Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false) }}>
          <div className="bg-white dark:bg-scout-900 rounded-2xl w-full max-w-md shadow-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-scout-700">
              <h2 className="font-semibold text-scout-900 dark:text-white text-lg">เพิ่มลูกเสือเข้าหมู่</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              {availableScouts && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-4 border border-green-200 dark:border-green-700">
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    สถานศึกษา: {availableScouts.school || 'ยังไม่ระบุ'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    สมาชิกปัจจุบัน: {availableScouts.currentCount}/{availableScouts.maxCount} คน
                  </p>
                </div>
              )}

              {loadingScouts ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-scout-200 border-t-scout-700 rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-gray-400 mt-3">กำลังโหลดรายชื่อ...</p>
                </div>
              ) : availableScouts?.scouts?.length === 0 ? (
                <div className="text-center py-8">
                  <School size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">
                    {availableScouts?.canAdd === false
                      ? 'หมู่เต็มแล้ว (8 คน)'
                      : 'ไม่มีลูกเสือที่สามารถเพิ่มได้'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto modal-scroll">
                  {availableScouts?.scouts?.map(scout => (
                    <div key={scout.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-scout-800 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-scout-100 dark:bg-scout-700 flex items-center justify-center text-xs font-bold text-scout-700 dark:text-scout-300">
                        {scout.firstName?.[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-scout-900 dark:text-white">{scout.firstName} {scout.lastName}</p>
                        <p className="text-xs text-gray-400">{scout.scoutCode} · {scout.school}</p>
                      </div>
                      <button
                        onClick={() => handleAddScout(scout.id)}
                        disabled={addingScout}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        {addingScout ? 'กำลังเพิ่ม...' : 'เพิ่ม'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}