import { useState, useMemo } from 'react'
import { useQuery } from 'react-query'
import api from '../../lib/api'
import {
  ChevronDown, ChevronUp, Search, SlidersHorizontal, Download,
  ChevronLeft, ChevronRight, X, Calendar, User, Activity,
  Tent, UserCog, RefreshCw
} from 'lucide-react'

// ── Styles ────────────────────────────────────────────────────────────────────
const roleStyle = {
  ADMIN:        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CAMP_MANAGER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  TROOP_LEADER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  STAFF:        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  SCOUT:        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const actionStyle = {
  UPDATE_SCOUT_PROFILE: { label: 'แก้ข้อมูลลูกเสือ',  color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',             dot: 'bg-blue-400',    icon: '✏️', group: 'ลูกเสือ' },
  MOVE_SCOUT:           { label: 'ย้ายหมู่',            color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',     dot: 'bg-violet-400',  icon: '🔀', group: 'ลูกเสือ' },
  CREATE_SCOUT:         { label: 'เพิ่มลูกเสือ',        color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', dot: 'bg-emerald-400', icon: '➕', group: 'ลูกเสือ' },
  DELETE_SCOUT:         { label: 'ลบลูกเสือ',           color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',                 dot: 'bg-red-400',     icon: '🗑️', group: 'ลูกเสือ' },
  CREATE_ACCOUNT:       { label: 'สร้างบัญชี',          color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', dot: 'bg-emerald-400', icon: '👤', group: 'บัญชี' },
  UPDATE_ACCOUNT:       { label: 'แก้ไขบัญชี',          color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',         dot: 'bg-amber-400',   icon: '🔧', group: 'บัญชี' },
  DELETE_ACCOUNT:       { label: 'ลบบัญชี',             color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',                 dot: 'bg-red-400',     icon: '❌', group: 'บัญชี' },
  CREATE_CAMP:          { label: 'สร้างค่าย',           color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',             dot: 'bg-teal-400',    icon: '⛺', group: 'ค่าย' },
  UPDATE_CAMP:          { label: 'แก้ไขค่าย',           color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',             dot: 'bg-teal-400',    icon: '🏕️', group: 'ค่าย' },
  DELETE_CAMP:          { label: 'ลบค่าย',              color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',                 dot: 'bg-red-400',     icon: '🗑️', group: 'ค่าย' },
  CREATE_TROOP:         { label: 'สร้างกอง',            color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',     dot: 'bg-indigo-400',  icon: '🚩', group: 'ค่าย' },
  UPDATE_TROOP:         { label: 'แก้ไขกอง',            color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',     dot: 'bg-indigo-400',  icon: '✏️', group: 'ค่าย' },
  DELETE_TROOP:         { label: 'ลบกอง',               color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',                 dot: 'bg-red-400',     icon: '🗑️', group: 'ค่าย' },
  CREATE_SQUAD:         { label: 'สร้างหมู่',           color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',             dot: 'bg-cyan-400',    icon: '🛡️', group: 'ค่าย' },
  UPDATE_SQUAD:         { label: 'แก้ไขหมู่',           color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',             dot: 'bg-cyan-400',    icon: '✏️', group: 'ค่าย' },
  DELETE_SQUAD:         { label: 'ลบหมู่',              color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',                 dot: 'bg-red-400',     icon: '🗑️', group: 'ค่าย' },
}

const fieldLabel = {
  firstName: 'ชื่อ', lastName: 'นามสกุล', nickname: 'ชื่อเล่น',
  school: 'โรงเรียน', province: 'จังหวัด', phone: 'โทร',
  email: 'อีเมล', squadId: 'หมู่', role: 'Role',
  username: 'ชื่อผู้ใช้', gender: 'เพศ', name: 'ชื่อ',
  maxSquads: 'หมู่สูงสุด', number: 'หมายเลข',
}

const PAGE_SIZE = 20

// ── helpers ───────────────────────────────────────────────────────────────────
function getTargetName(log) {
  let name = log.targetName || ''
  if (!name && (log.before || log.after)) {
    try {
      const d = JSON.parse(log.after || log.before)
      if (d.firstName) name = `${d.firstName} ${d.lastName || ''}`.trim()
      else if (d.name) name = d.name
      else if (d.username) name = d.username
    } catch {}
  }
  return name
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('th-TH', {
    day: 'numeric', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

// ── DiffView ──────────────────────────────────────────────────────────────────
function DiffView({ before, after, action }) {
  let b = {}, a = {}
  try { b = JSON.parse(before) } catch {}
  try { a = JSON.parse(after) } catch {}

  if (action === 'MOVE_SCOUT') {
    return (
      <div className="flex items-center gap-2 flex-wrap mt-1">
        <span className="text-xs text-gray-400">ย้ายจาก</span>
        <span className="text-xs bg-red-50 dark:bg-red-900/20 text-red-500 px-2 py-0.5 rounded-lg line-through">{b.squadId || 'ไม่มีหมู่'}</span>
        <span className="text-gray-300 dark:text-gray-600">→</span>
        <span className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-2 py-0.5 rounded-lg font-medium">{a.squadId || 'ไม่มีหมู่'}</span>
      </div>
    )
  }

  const changed = Object.keys({ ...b, ...a }).filter(k => {
    if (['updatedAt', 'createdAt', 'qrData', 'id'].includes(k)) return false
    return JSON.stringify(b[k]) !== JSON.stringify(a[k])
  })

  if (changed.length === 0) return <p className="text-xs text-gray-400 mt-2">ไม่มีการเปลี่ยนแปลง</p>

  return (
    <div className="mt-2 space-y-1.5">
      {changed.map(k => (
        <div key={k} className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 w-20 flex-shrink-0">{fieldLabel[k] || k}</span>
          <span className="text-xs bg-red-50 dark:bg-red-900/20 text-red-500 px-2 py-0.5 rounded-lg line-through">{String(b[k] ?? '-')}</span>
          <span className="text-gray-300 dark:text-gray-600 text-xs">→</span>
          <span className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-2 py-0.5 rounded-lg font-medium">{String(a[k] ?? '-')}</span>
        </div>
      ))}
    </div>
  )
}

// ── AuditCard ─────────────────────────────────────────────────────────────────
function AuditCard({ log }) {
  const [open, setOpen] = useState(false)
  const action = actionStyle[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-400', icon: '📝' }
  const hasDiff = !!(log.before || log.after)
  const targetName = getTargetName(log)

  return (
    <div className="group relative bg-white dark:bg-scout-800 rounded-2xl border border-gray-100 dark:border-scout-700 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-200 dark:hover:border-scout-600">
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${action.dot} opacity-60`} />

      <div className="pl-4 pr-3 py-3 sm:py-3.5">
        {/* Row 1: actor + time */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-scout-400 to-scout-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {(log.user?.name || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-semibold text-scout-900 dark:text-white truncate">
                  {log.user?.name || 'ไม่ทราบ'}
                </span>
                {log.user?.role && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium hidden sm:inline-flex ${roleStyle[log.user.role] || 'bg-gray-100 text-gray-600'}`}>
                    {log.user.role}
                  </span>
                )}
              </div>
              {targetName && (
                <div className="flex items-center gap-1 mt-0.5">
                  <User size={10} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-400 truncate">{targetName}</span>
                </div>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
            {formatDate(log.createdAt)}
          </span>
        </div>

        {/* Row 2: action + toggle */}
        <div className="flex items-center justify-between gap-2 pl-9 sm:pl-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${action.color}`}>
              <span>{action.icon}</span>
              {action.label}
            </span>
            {log.ipAddress && (
              <span className="text-xs text-gray-300 dark:text-gray-600 font-mono hidden sm:block">{log.ipAddress}</span>
            )}
          </div>
          {hasDiff && (
            <button
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-scout-500 dark:hover:text-scout-400 transition-colors flex-shrink-0"
            >
              {open
                ? <><ChevronUp size={13} /><span className="hidden sm:inline">ซ่อน</span></>
                : <><ChevronDown size={13} /><span className="hidden sm:inline">รายละเอียด</span></>
              }
            </button>
          )}
        </div>

        {/* Diff */}
        {open && hasDiff && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-scout-700 pl-9 sm:pl-10">
            <DiffView before={log.before} after={log.after} action={log.action} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 sm:p-4 rounded-2xl border transition-all duration-200 ${
        active
          ? 'border-scout-400 bg-scout-50 dark:bg-scout-900/40 shadow-sm'
          : 'border-gray-100 dark:border-scout-700 bg-white dark:bg-scout-800 hover:border-gray-200 dark:hover:border-scout-600 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? 'bg-scout-100 dark:bg-scout-800' : 'bg-gray-50 dark:bg-scout-700'}`}>
          {icon}
        </div>
        <span className={`text-xl sm:text-2xl font-bold tabular-nums ${active ? 'text-scout-600 dark:text-scout-300' : 'text-gray-800 dark:text-white'}`}>
          {value}
        </span>
      </div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 truncate">{label}</p>
    </button>
  )
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportCSV(logs) {
  const headers = ['วันที่', 'ผู้ทำ', 'Role', 'Action', 'Target', 'IP']
  const rows = logs.map(log => [
    formatDate(log.createdAt),
    log.user?.name || '',
    log.user?.role || '',
    actionStyle[log.action]?.label || log.action,
    getTargetName(log),
    log.ipAddress || '',
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminAudit() {
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('ALL')
  const [filterGroup, setFilterGroup] = useState('ALL') // ✅ เพิ่ม filterGroup
  const [filterDate, setFilterDate] = useState('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const { data: logs = [], isLoading, refetch, isFetching } = useQuery(
    'audit-logs',
    () => api.get('/admin/audit?limit=500'),
    { refetchInterval: 15000 }
  )

  // ── Filtered ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return logs.filter(log => {
      if (search) {
        const hay = `${log.user?.name || ''} ${getTargetName(log)}`.toLowerCase()
        if (!hay.includes(search.toLowerCase())) return false
      }
      if (filterAction !== 'ALL' && log.action !== filterAction) return false
      // ✅ filter ตามกลุ่ม
      if (filterGroup !== 'ALL' && actionStyle[log.action]?.group !== filterGroup) return false
      if (filterDate) {
        const logDate = new Date(log.createdAt).toISOString().slice(0, 10)
        if (logDate !== filterDate) return false
      }
      return true
    })
  }, [logs, search, filterAction, filterGroup, filterDate])

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const resetFilters = () => {
    setSearch('')
    setFilterAction('ALL')
    setFilterGroup('ALL')
    setFilterDate('')
    setPage(1)
  }

  const hasFilter = search || filterAction !== 'ALL' || filterGroup !== 'ALL' || filterDate

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const counts = {}
    logs.forEach(l => { counts[l.action] = (counts[l.action] || 0) + 1 })
    return counts
  }, [logs])

  const scoutCount   = Object.entries(actionStyle).filter(([, v]) => v.group === 'ลูกเสือ').reduce((s, [k]) => s + (stats[k] || 0), 0)
  const accountCount = Object.entries(actionStyle).filter(([, v]) => v.group === 'บัญชี').reduce((s, [k]) => s + (stats[k] || 0), 0)
  const campCount    = Object.entries(actionStyle).filter(([, v]) => v.group === 'ค่าย').reduce((s, [k]) => s + (stats[k] || 0), 0)

  // ── Page numbers ─────────────────────────────────────────────────────────────
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push('...')
      acc.push(p)
      return acc
    }, [])

  return (
    <div className="page pb-24">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-scout-900 dark:text-white">Audit Log</h1>
          <p className="text-xs text-gray-400 mt-0.5">{logs.length} รายการทั้งหมด</p>
        </div>
        <button
          onClick={() => refetch()}
          title="รีเฟรช"
          className={`w-9 h-9 rounded-xl border border-gray-200 dark:border-scout-700 flex items-center justify-center text-gray-400 hover:text-scout-500 hover:border-scout-400 transition-all ${isFetching ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {/* ✅ ทุก card กด filter ตามกลุ่มได้จริงแล้ว */}
        <StatCard
          icon={<Activity size={15} className="text-scout-500" />}
          label="ทั้งหมด"
          value={logs.length}
          onClick={() => resetFilters()}
          active={filterGroup === 'ALL' && filterAction === 'ALL' && !search && !filterDate}
        />
        <StatCard
          icon={<User size={15} className="text-blue-500" />}
          label="เกี่ยวกับลูกเสือ"
          value={scoutCount}
          onClick={() => { setFilterGroup('ลูกเสือ'); setFilterAction('ALL'); setPage(1) }}
          active={filterGroup === 'ลูกเสือ'}
        />
        <StatCard
          icon={<UserCog size={15} className="text-amber-500" />}
          label="เกี่ยวกับบัญชี"
          value={accountCount}
          onClick={() => { setFilterGroup('บัญชี'); setFilterAction('ALL'); setPage(1) }}
          active={filterGroup === 'บัญชี'}
        />
        <StatCard
          icon={<Tent size={15} className="text-teal-500" />}
          label="ค่าย/กอง/หมู่"
          value={campCount}
          onClick={() => { setFilterGroup('ค่าย'); setFilterAction('ALL'); setPage(1) }}
          active={filterGroup === 'ค่าย'}
        />
      </div>

      {/* ── Active group badge ── */}
      {filterGroup !== 'ALL' && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">กรองกลุ่ม:</span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-scout-100 dark:bg-scout-900/40 text-scout-600 dark:text-scout-300">
            {filterGroup}
          </span>
          <button
            onClick={() => { setFilterGroup('ALL'); setPage(1) }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <X size={11} /> ล้าง
          </button>
        </div>
      )}

      {/* ── Search + toolbar ── */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            placeholder="ค้นหาชื่อผู้ทำ หรือ target..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input pl-9 pr-9 text-sm w-full"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={13} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 h-10 rounded-xl border text-sm font-medium transition-all flex-shrink-0 ${
            showFilters || filterAction !== 'ALL' || filterDate
              ? 'border-scout-400 text-scout-600 dark:text-scout-300 bg-scout-50 dark:bg-scout-900/30'
              : 'border-gray-200 dark:border-scout-700 text-gray-500 hover:border-gray-300 dark:hover:border-scout-600'
          }`}
        >
          <SlidersHorizontal size={14} />
          <span className="hidden sm:inline">ตัวกรอง</span>
          {(filterAction !== 'ALL' || filterDate) && <span className="w-1.5 h-1.5 rounded-full bg-scout-500" />}
        </button>

        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-1.5 px-3 h-10 rounded-xl border border-gray-200 dark:border-scout-700 text-sm text-gray-500 hover:border-gray-300 dark:hover:border-scout-600 transition-all flex-shrink-0"
          title="Export CSV"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="bg-white dark:bg-scout-800 border border-gray-100 dark:border-scout-700 rounded-2xl p-3 sm:p-4 mb-3 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">ประเภท Action</label>
            <select
              className="input w-full text-sm"
              value={filterAction}
              onChange={e => { setFilterAction(e.target.value); setFilterGroup('ALL'); setPage(1) }}
            >
              <option value="ALL">ทั้งหมด</option>
              {['ลูกเสือ', 'บัญชี', 'ค่าย'].map(group => (
                <optgroup key={group} label={`── ${group} ──`}>
                  {Object.entries(actionStyle)
                    .filter(([, v]) => v.group === group)
                    .map(([key, val]) => (
                      <option key={key} value={key}>{val.icon} {val.label}</option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
              <Calendar size={11} /> วันที่
            </label>
            <input
              type="date"
              className="input w-full text-sm"
              value={filterDate}
              onChange={e => { setFilterDate(e.target.value); setPage(1) }}
            />
          </div>
          {hasFilter && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-red-100 dark:border-red-900/30 w-full sm:w-auto justify-center flex-shrink-0"
            >
              <X size={13} /> ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      )}

      {/* ── Result info ── */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <p className="text-xs text-gray-400">
          {filtered.length > 0 ? (
            <>
              แสดง{' '}
              <span className="font-medium text-gray-600 dark:text-gray-300">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}
              </span>
              {' '}จาก{' '}
              <span className="font-medium text-gray-600 dark:text-gray-300">{filtered.length}</span>
              {' '}รายการ
              {hasFilter && <span className="text-scout-500 ml-1">(กรองแล้ว)</span>}
            </>
          ) : 'ไม่มีรายการ'}
        </p>
        {totalPages > 1 && (
          <p className="text-xs text-gray-400">หน้า {currentPage}/{totalPages}</p>
        )}
      </div>

      {/* ── Log list ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-scout-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">กำลังโหลด...</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-scout-800 border border-gray-100 dark:border-scout-700 flex items-center justify-center text-2xl">
            📋
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {hasFilter ? 'ไม่พบรายการที่ตรงเงื่อนไข' : 'ยังไม่มี Log'}
          </p>
          {hasFilter && (
            <button onClick={resetFilters} className="text-xs text-scout-500 hover:text-scout-600 underline underline-offset-2">
              ล้างตัวกรอง
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map((log) => <AuditCard key={log.id} log={log} />)}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-6 flex-wrap">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-scout-700 flex items-center justify-center text-gray-400 hover:border-scout-400 hover:text-scout-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={15} />
          </button>

          {pageNumbers.map((p, i) =>
            p === '...' ? (
              <span key={`dot-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-300 text-sm">…</span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl border text-sm font-medium transition-all ${
                  p === currentPage
                    ? 'border-scout-500 bg-scout-500 text-white shadow-sm'
                    : 'border-gray-200 dark:border-scout-700 text-gray-500 hover:border-scout-400 hover:text-scout-500'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-scout-700 flex items-center justify-center text-gray-400 hover:border-scout-400 hover:text-scout-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}