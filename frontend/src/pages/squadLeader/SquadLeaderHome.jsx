import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { squadLeaderApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { Users, School, X, UserPlus } from 'lucide-react';

export default function SquadLeaderHome() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [squad, setSquad] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSquad();
  }, []);

  const loadSquad = async () => {
    try {
      setLoading(true);
      const res = await squadLeaderApi.getMySquad();
      setSquad(res.data);
    } catch (err) {
      toast.error('โหลดข้อมูลหมู่ไม่สำเร็จ');
    } finally {
      setLoading(false);
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

  const scoutCount = squad?.scouts?.length || 0;

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
          <p className="text-2xl font-bold text-scout-700 dark:text-scout-300">{scoutCount}</p>
          <p className="text-xs text-gray-400 mt-1">สมาชิก</p>
        </div>
        <div className="card text-center p-4">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{scoutCount}/8</p>
          <p className="text-xs text-gray-400 mt-1">จำนวน</p>
        </div>
        <div className="card text-center p-4">
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {squad?.scouts?.[0]?.school || '-'}
          </p>
          <p className="text-xs text-gray-400 mt-1">สถานศึกษา</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={() => navigate('/squad-leader/add-scout')}
          className="flex-1 btn-primary flex items-center justify-center gap-2 py-3"
        >
          <UserPlus size={18} />
          <span>เพิ่มลูกเสือ</span>
        </button>
      </div>

      {/* Scout List */}
      <div className="card">
        <h2 className="text-sm font-semibold text-scout-800 dark:text-scout-200 mb-4">
          สมาชิกในหมู่ ({scoutCount} คน)
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
          {scoutCount === 0 && (
            <div className="text-center py-8">
              <Users size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">ยังไม่มีสมาชิกในหมู่</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}