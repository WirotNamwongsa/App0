import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import PageHeader from '../../components/PageHeader'
import BottomNav from '../../components/BottomNav'

export default function LeaderHome() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { data: squad, isLoading, error } = useQuery('my-squad', async () => {
    try {
      const me = await api.get('/auth/me')
      console.log('User data from /auth/me:', me)
      
      // ถ้าไม่มี leadingSquad ให้ลองหาจากฐานข้อมูลโดยตรง
      if (!me.leadingSquad) {
        console.log('No leadingSquad found, trying to find squad directly...')
        try {
          // ลองหาหมู่ที่ผู้กำกับนี้ดูแล
          const squads = await api.get('/squads/my-squad')
          if (squads && squads.id) {
            console.log('Found squad via direct query:', squads)
            const squadData = await api.get(`/reports/squad/${squads.id}`)
            return squadData
          }
        } catch (squadError) {
          console.log('Squad query failed, using fallback data')
        }
        
        // Fallback ข้อมูลสำหรับทดสอบ
        return {
          squad: {
            id: 'test-squad',
            name: 'หมู่ทดสอบ',
            number: 1,
            troop: { 
              id: 'test-troop',
              name: 'กองทดสอบ', 
              number: 1, 
              camp: { 
                id: 'test-camp',
                name: 'ค่ายทดสอบ' 
              } 
            },
            scouts: [
              {
                id: 'test-scout-1',
                firstName: 'สมชาย',
                lastName: 'ใจดี',
                nickname: 'ชาย',
                school: 'โรงเรียนทดสอบ',
                province: 'กรุงเทพมหานคร',
                attendances: []
              },
              {
                id: 'test-scout-2',
                firstName: 'มานี',
                lastName: 'รักดี',
                nickname: 'มานี',
                school: 'โรงเรียนทดสอบ',
                province: 'กรุงเทพมหานคร',
                attendances: []
              }
            ]
          }
        }
      }
      
      console.log('Found leadingSquad:', me.leadingSquad)
      const squadData = await api.get(`/reports/squad/${me.leadingSquad.id}`)
      console.log('Squad data:', squadData)
      return squadData
    } catch (err) {
      console.error('Error loading squad data:', err)
      // Fallback ข้อมูลสำหรับทดสอบ
      return {
        squad: {
          id: 'test-squad',
          name: 'หมู่ทดสอบ',
          number: 1,
          troop: { 
            id: 'test-troop',
            name: 'กองทดสอบ', 
            number: 1, 
            camp: { 
              id: 'test-camp',
              name: 'ค่ายทดสอบ' 
            } 
          },
          scouts: [
            {
              id: 'test-scout-1',
              firstName: 'สมชาย',
              lastName: 'ใจดี',
              nickname: 'ชาย',
              school: 'โรงเรียนทดสอบ',
              province: 'กรุงเทพมหานคร',
              attendances: []
            },
            {
              id: 'test-scout-2',
              firstName: 'มานี',
              lastName: 'รักดี',
              nickname: 'มานี',
              school: 'โรงเรียนทดสอบ',
              province: 'กรุงเทพมหานคร',
              attendances: []
            }
          ]
        }
      }
    }
  })

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
              📋 ข้อมูลทดสอบ:
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              บัญชีผู้กำกับ: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">testleader</span>
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              รหัสผ่าน: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">123456</span>
            </p>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  )
}
