import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { squadLeaderApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { Plus, Users, School, X, ArrowLeft } from 'lucide-react';

export default function SquadLeaderAddScout() {
  const { user, logout } = useAuthStore();
  const [squad, setSquad] = useState(null);
  const [availableScouts, setAvailableScouts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingScouts, setLoadingScouts] = useState(false);
  const [addingScout, setAddingScout] = useState(false);

  useEffect(() => {
    // โหลดข้อมูลหมู่และลูกเสือที่เพิ่มได้
    Promise.all([
      squadLeaderApi.getMySquad(),
      squadLeaderApi.getAvailableScouts()
    ]).then(([squadRes, scoutsRes]) => {
      setSquad(squadRes.data);
      setAvailableScouts(scoutsRes.data);
    }).catch(error => {
      console.error('Error loading data:', error);
      toast.error('โหลดข้อมูลไม่สำเร็จ');
    }).finally(() => setLoading(false));
  }, []);

  const handleAddScout = async (scoutId) => {
    setAddingScout(true);
    try {
      await squadLeaderApi.addScout({ scoutId });
      toast.success('เพิ่มลูกเสือสำเร็จ');
      
      // โหลดข้อมูลใหม่
      const [squadRes, scoutsRes] = await Promise.all([
        squadLeaderApi.getMySquad(),
        squadLeaderApi.getAvailableScouts()
      ]);
      setSquad(squadRes.data);
      setAvailableScouts(scoutsRes.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'เพิ่มลูกเสือไม่สำเร็จ');
    } finally {
      setAddingScout(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-scout-200 border-t-scout-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.history.back()}
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-scout-800 flex items-center justify-center text-gray-600 dark:text-scout-300 hover:bg-gray-200 dark:hover:bg-scout-700 transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-scout-900 dark:text-white">เพิ่มลูกเสือ</h1>
            <p className="text-xs text-gray-400">หมู่ {squad?.name} · กอง {squad?.troop?.name}</p>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="card mb-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Users size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-scout-900 dark:text-white">สถานะหมู่</h2>
            <p className="text-sm text-gray-400">ตรวจสอบข้อมูลก่อนเพิ่มสมาชิก</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-scout-800 rounded-lg p-3">
            <p className="text-xs text-gray-400">สมาชิกปัจจุบัน</p>
            <p className="text-xl font-bold text-scout-700 dark:text-scout-300">
              {squad?.scouts?.length || 0}/8 คน
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-scout-800 rounded-lg p-3">
            <p className="text-xs text-gray-400">สถานศึกษา</p>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {availableScouts?.school || 'ยังไม่ระบุ'}
            </p>
          </div>
        </div>
      </div>

      {/* Available Scouts */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Plus size={20} className="text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-scout-900 dark:text-white">
            ลูกเสือที่สามารถเพิ่มได้
          </h2>
        </div>

        {!availableScouts?.canAdd ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
              <X size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <p className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
              หมู่เต็มแล้ว
            </p>
            <p className="text-sm text-gray-400">
              หมู่นี้มีสมาชิกครบ 8 คนแล้ว ไม่สามารถเพิ่มได้อีก
            </p>
          </div>
        ) : loadingScouts ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-scout-200 border-t-scout-700 rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-400 mt-3">กำลังโหลดรายชื่อ...</p>
          </div>
        ) : availableScouts?.scouts?.length === 0 ? (
          <div className="text-center py-8">
            <School size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              ไม่มีลูกเสือที่สามารถเพิ่มได้
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {availableScouts?.school 
                ? `ลูกเสือจาก ${availableScouts.school} ทั้งหมดมีหมู่แล้ว`
                : 'ไม่พบลูกเสือที่ยังไม่มีหมู่'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto modal-scroll">
            {availableScouts?.scouts?.map(scout => (
              <div key={scout.id} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-scout-800 rounded-lg hover:bg-gray-100 dark:hover:bg-scout-700 transition-all">
                <div className="w-12 h-12 rounded-full bg-scout-100 dark:bg-scout-700 flex items-center justify-center text-sm font-bold text-scout-700 dark:text-scout-300">
                  {scout.firstName?.[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-scout-900 dark:text-white">
                    {scout.firstName} {scout.lastName}
                  </p>
                  <p className="text-xs text-gray-400">{scout.scoutCode}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{scout.school}</p>
                </div>
                <button
                  onClick={() => handleAddScout(scout.id)}
                  disabled={addingScout}
                  className="btn-primary text-sm px-4 py-2"
                >
                  {addingScout ? 'กำลังเพิ่ม...' : 'เพิ่ม'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="card mt-4">
        <h3 className="text-sm font-semibold text-scout-800 dark:text-scout-200 mb-3">📋 เงื่อนไขการเพิ่มลูกเสือ</h3>
        <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>หมู่ละไม่เกิน 8 คน</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>ลูกเสือต้องมาจากสถานศึกษาเดียวกัน</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>ลูกเสือต้องยังไม่มีหมู่</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
