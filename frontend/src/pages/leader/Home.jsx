import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import PageHeader from '../../components/PageHeader'
import BottomNav from '../../components/BottomNav'

export default function LeaderHome() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  
  // ดึงข้อมูลหมู่ของผู้กำกับโดยตรง
  const { data: squad, isLoading, error } = useQuery(
    'my-squad', 
    () => api.get('/squads/my-squad'),
    {
      retry: 2,
      onError: (error) => {
        console.error('Error loading squad:', error)
        // ไม่ต้องแสดง fallback ให้ผู้ใช้เห็น
      }
    }
  )

  return (
    <div className="page">
      <PageHeader title={`หมู่ ${squad?.squad?.number || squad?.squad?.name || '-'}`} />
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-scout-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : squad ? (
        <>
          <div className="card mb-4">
            <p className="text-xs text-gray-500">
              กอง {squad.squad?.troop?.number} · {squad.squad?.troop?.camp?.name}
            </p>
            <p className="text-2xl font-display font-bold text-scout-900 mt-1">
              {squad.squad?.scouts?.length || 0} คน
            </p>
          </div>
          <h2 className="font-semibold text-scout-800 mb-3">สมาชิกในหมู่</h2>
          <div className="space-y-2">
            {squad.squad?.scouts?.map(sc => {
              const main = sc.attendances?.filter(a => a.activity?.type === 'MAIN').length || 0
              const special = sc.attendances?.filter(a => a.activity?.type === 'SPECIAL').length || 0
              const free = sc.attendances?.filter(a => a.activity?.type === 'FREE').length || 0
              const ok = main >= 5 && special >= 3
              return (
                <div key={sc.id} className="card flex items-center gap-3 cursor-pointer hover:bg-scout-50 transition-colors"
                  onClick={() => navigate(`/leader/member/${sc.id}`)}>
                  <span className="text-xl">{ok ? '✅' : '⚠️'}</span>
                  <div className="flex-1">
                    <p className="font-medium text-scout-900">{sc.firstName} {sc.lastName}</p>
                    <p className="text-xs text-gray-400">
                      หลัก {main}/6 · พิเศษ {special}/4 · ว่าง {free}/11
                    </p>
                    {sc.school && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        📍 {sc.school}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-300">›</span>
                </div>
              )
            })}
          </div>
          
          {squad.squad?.scouts?.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-gray-400 mb-2">ยังไม่มีสมาชิกในหมู่นี้</p>
              <p className="text-sm text-gray-400">รอการจัดสรรจากผู้ดูแลระบบ</p>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-8">
          <p className="text-gray-400 mb-2">ไม่พบข้อมูลหมู่</p>
          <p className="text-sm text-gray-400 mb-4">คุณอาจยังไม่ได้รับมอบหมายหมู่</p>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
              ℹ️ ข้อมูลผู้กำกับ: {user?.username}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              ติดต่อ: {user?.role}
            </p>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  )
}
