import { useQuery } from 'react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import api from '../../lib/api'
import PageHeader from '../../components/PageHeader'

const SLOTS = {
  MORNING: 'เช้า',
  AFTERNOON: 'บ่าย', 
  EVENING: 'เย็น'
}

export default function ScheduleParticipants() {
  const { scheduleId } = useParams()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const { data: scheduleData, isLoading, error } = useQuery(
    ['schedule-participants', scheduleId],
    () => api.get(`/attendance/schedule/${scheduleId}/participants`),
    { 
      enabled: !!scheduleId,
      onError: (err) => {
        console.error('❌ Query error:', err)
      }
    }
  )

  const { schedule, participants, stats } = scheduleData || {}

  console.log('📊 Schedule data:', scheduleData)
  console.log('📊 Query error:', error)
  console.log('📊 Loading:', isLoading)
  
  // Debug: ตรวจสอบว่าได้รับข้อมูลจาก backend หรือไม่
  if (scheduleData) {
    console.log('📊 Received data from backend:', {
      hasSchedule: !!schedule,
      hasParticipants: !!participants,
      hasStats: !!stats,
      participantsCount: participants?.length
    })
  }

  if (isLoading) {
    return (
      <div className="page">
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-scout-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!schedule) {
    console.log('❌ No schedule data found')
    return (
      <div className="page">
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-scout-700 bg-scout-50 hover:bg-scout-100"
          >
            ← กลับ
          </button>
        </div>
        <div className="card text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📅</p>
          <p>ไม่พบข้อมูลตารางกิจกรรม</p>
        </div>
      </div>
    )
  }

  // กรองผู้เข้าร่วมตามสถานะ
  const filteredParticipants = participants?.filter(p => {
    if (filter === 'all') return true
    if (filter === 'scanned') return p.status === 'scanned'
    if (filter === 'not_scanned') return p.status === 'not_scanned'
    return true
  }) || []

  return (
    <div className="page">
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-scout-700 bg-scout-50 hover:bg-scout-100"
        >
          ← กลับ
        </button>
      </div>

      <PageHeader 
        title="รายชื่อผู้เข้าร่วมกิจกรรม"
        subtitle={schedule ? `${schedule.activity?.name} - ${SLOTS[schedule.slot]}` : ''}
      />

      {schedule && (
        <div className="card mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-scout-900">{stats.total}</p>
              <p className="text-xs text-gray-500">ทั้งหมด</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.scanned}</p>
              <p className="text-xs text-gray-500">มาแล้ว</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.notScanned}</p>
              <p className="text-xs text-gray-500">ยังไม่มา</p>
            </div>
          </div>
        </div>
      )}

      {/* ปุ่มกรอง */}
      <div className="card mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-scout-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ทั้งหมด ({stats.total})
          </button>
          <button
            onClick={() => setFilter('scanned')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filter === 'scanned' 
                ? 'bg-green-500 text-white' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            มาแล้ว ({stats.scanned})
          </button>
          <button
            onClick={() => setFilter('not_scanned')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filter === 'not_scanned' 
                ? 'bg-red-500 text-white' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            ยังไม่มา ({stats.notScanned})
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">รายชื่อลูกเสือ ({filteredParticipants.length} คน)</h3>
        <div className="space-y-2">
          {filteredParticipants.map(participant => (
            <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{participant.displayName || participant.firstName + ' ' + participant.lastName}</p>
                <p className="text-sm text-gray-500">
                  {participant.squad?.name} - {participant.squad?.troop?.name}
                </p>
                {participant.scoutCode && (
                  <p className="text-xs text-gray-400">รหัส: {participant.scoutCode}</p>
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                participant.status === 'scanned' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {participant.status === 'scanned' ? 'มาแล้ว' : 'ยังไม่มา'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
