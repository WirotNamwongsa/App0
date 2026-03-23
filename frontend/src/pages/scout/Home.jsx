import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import StatCard from '../../components/StatCard'
import BottomNav from '../../components/BottomNav'

export default function ScoutHome() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data: scout, isLoading } = useQuery('my-scout', () => api.get('/scouts/my'))

  // กิจกรรมที่ scout คนนี้เข้าร่วมแล้ว (จาก attendances)
  const activities = scout?.attendances || []
  const main    = activities.filter(a => a.activity.type === 'MAIN')
  const special = activities.filter(a => a.activity.type === 'SPECIAL')
  const free    = activities.filter(a => a.activity.type === 'FREE')

  // campId ของ scout คนนี้
  const campId = scout?.squad?.troop?.camp?.id

  // ✅ ดึงเฉพาะกิจกรรมที่ถูก schedule ไว้ใน camp ของ scout คนนี้
  const { data: campActivities = [] } = useQuery(
    ['camp-activities', campId],
    () => api.get(`/activities/by-camp/${campId}`),
    { enabled: !!campId }
  )

  // นับจำนวนกิจกรรมแต่ละประเภทของ camp นี้ (ใช้เป็น max)
  const mainTotal    = campActivities.filter(a => a.type === 'MAIN').length
  const specialTotal = campActivities.filter(a => a.type === 'SPECIAL').length
  const freeTotal    = campActivities.filter(a => a.type === 'FREE').length

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-scout-600 text-sm">สวัสดี 👋</p>
          <h1 className="text-2xl font-display font-bold text-scout-900">
            {scout?.nickname || user?.name}
          </h1>
          {scout?.squad && (
            <p className="text-xs text-gray-500 mt-0.5">
              หมู่ {scout.squad.number} · กอง {scout.squad.troop?.number} · {scout.squad.troop?.camp?.name}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-scout-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="card mb-4">
            <h2 className="font-semibold text-scout-800 mb-3 text-sm">ความคืบหน้า</h2>
            <div className="flex gap-3">
              <StatCard
                label="กิจกรรมหลัก"
                value={main.length}
                max={mainTotal}
                icon="🏅"
              />
              <StatCard
                label="กิจกรรมพิเศษ"
                value={special.length}
                max={specialTotal}
                icon="⭐"
              />
            </div>
            <div className="flex gap-3 mt-3">
              <StatCard
                label="กิจกรรมยามว่าง"
                value={free.length}
                max={freeTotal}
                icon="🎯"
              />
            </div>
          </div>

          {main.length >= 5 && special.length >= 3 && (
            <div className="card bg-gradient-to-r from-gold-400 to-gold-500 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏆</span>
                <div>
                  <p className="font-bold text-white">Jamboree Award</p>
                  <p className="text-white/80 text-sm">ยินดีด้วย! คุณผ่านเกณฑ์แล้ว</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/scout/activities')}
            className="btn-primary w-full"
          >
            ดูกิจกรรมทั้งหมด
          </button>
        </>
      )}

      <BottomNav />
    </div>
  )
}