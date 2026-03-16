import { useState } from 'react'
import { useQuery } from 'react-query'
import api from '../../lib/api'
import PageHeader from '../../components/PageHeader'
import { ChevronDown, ChevronUp } from 'lucide-react'

const roleStyle = {
  ADMIN:        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CAMP_MANAGER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  TROOP_LEADER: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  STAFF:        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  SCOUT:        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const actionStyle = {
  UPDATE_SCOUT_PROFILE: { label: 'แก้ข้อมูลลูกเสือ', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', icon: '✏️' },
  MOVE_SCOUT:           { label: 'ย้ายหมู่', color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400', icon: '🔀' },
  CREATE_SCOUT:         { label: 'เพิ่มลูกเสือ', color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400', icon: '➕' },
  DELETE_SCOUT:         { label: 'ลบลูกเสือ', color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400', icon: '🗑️' },
  CREATE_ACCOUNT:       { label: 'สร้างบัญชี', color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400', icon: '👤' },
  UPDATE_ACCOUNT:       { label: 'แก้ไขบัญชี', color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400', icon: '🔧' },
  DELETE_ACCOUNT:       { label: 'ลบบัญชี', color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400', icon: '❌' },
}

// แสดงเฉพาะ field ที่เปลี่ยน
function DiffView({ before, after }) {
  let b = {}, a = {}
  try { b = JSON.parse(before) } catch {}
  try { a = JSON.parse(after) } catch {}

  const changed = Object.keys({ ...b, ...a }).filter(k => {
    if (['updatedAt', 'createdAt', 'qrData'].includes(k)) return false
    return JSON.stringify(b[k]) !== JSON.stringify(a[k])
  })

  if (changed.length === 0) return null

  const fieldLabel = {
    firstName: 'ชื่อ', lastName: 'นามสกุล', nickname: 'ชื่อเล่น',
    school: 'โรงเรียน', province: 'จังหวัด', phone: 'โทร',
    email: 'อีเมล', squadId: 'หมู่', role: 'Role', username: 'ชื่อผู้ใช้'
  }

  return (
    <div className="mt-3 space-y-2">
      {changed.map(k => (
        <div key={k} className="grid grid-cols-3 gap-2 items-center">
          <span className="text-xs text-gray-400 dark:text-gray-500">{fieldLabel[k] || k}</span>
          <div className="col-span-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-lg line-through">
              {String(b[k] ?? '-')}
            </span>
            <span className="text-gray-400 text-xs">→</span>
            <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-lg font-medium">
              {String(a[k] ?? '-')}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function AuditCard({ log }) {
  const [open, setOpen] = useState(false)
  const action = actionStyle[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: '📝' }
  const hasDiff = !!(log.before && log.after)

  return (
    <div className="card">
      {/* Row 1: user + time */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleStyle[log.user?.role] || 'bg-gray-100 text-gray-600'}`}>
            {log.user?.name || 'ไม่ทราบ'}
          </span>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
          {new Date(log.createdAt).toLocaleString('th-TH', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
          })}
        </span>
      </div>

      {/* Row 2: action badge */}
      <div className="flex items-center justify-between">
        <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 ${action.color}`}>
          <span>{action.icon}</span>
          {action.label}
        </span>
        {hasDiff && (
          <button onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {open ? <><ChevronUp size={14} /> ซ่อน</> : <><ChevronDown size={14} /> ดูการเปลี่ยนแปลง</>}
          </button>
        )}
      </div>

      {/* Diff */}
      {open && hasDiff && <DiffView before={log.before} after={log.after} />}
    </div>
  )
}

export default function AdminAudit() {
  const { data: logs = [], isLoading } = useQuery(
    'audit-logs',
    () => api.get('/admin/audit?limit=100'),
    { refetchInterval: 15000 }
  )

  return (
    <div className="page">
      <PageHeader title="Audit Log" />

      {/* Summary */}
      <div className="card mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">รายการทั้งหมด</p>
        <span className="text-lg font-bold text-scout-700 dark:text-scout-300">{logs.length}</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-scout-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p>ยังไม่มี Log</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => <AuditCard key={log.id} log={log} />)}
        </div>
      )}

    </div>
  )
}