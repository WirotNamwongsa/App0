import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import BottomNav from '../../components/BottomNav'
import PageHeader from '../../components/PageHeader'

export default function LeaderHome() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { data: squad, isLoading } = useQuery('my-squad', async () => {
    const me = await api.get('/auth/me')
    if (!me.leadingSquad) return null
    return api.get(`/reports/squad/${me.leadingSquad.id}`)
  })

  return (
    <div className="page">
      <PageHeader title={`หมู่ ${squad?.squad?.number || '-'}`} showLogout />
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-scout-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : squad ? (
        <>
          <div className="card mb-4">
            <p className="text-xs text-gray-500">กอง {squad.squad?.troop?.number} · {squad.squad?.troop?.camp?.name}</p>
            <p className="text-2xl font-display font-bold text-scout-900 mt-1">{squad.squad?.scouts?.length || 0} คน</p>
          </div>
          <h2 className="font-semibold text-scout-800 mb-3">สมาชิก</h2>
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
                    <p className="text-xs text-gray-400">หลัก {main}/6 · พิเศษ {special}/4 · ว่าง {free}/11</p>
                  </div>
                  <span className="text-gray-300">›</span>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="card text-center py-8 text-gray-400">ไม่พบข้อมูลหมู่</div>
      )}
      <BottomNav />
    </div>
  )
}
