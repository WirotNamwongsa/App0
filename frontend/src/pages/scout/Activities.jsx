import { useQuery } from 'react-query'
import api from '../../lib/api'
import PageHeader from '../../components/PageHeader'
import BottomNav from '../../components/BottomNav'

const TYPE_CONFIG = {
  MAIN:    { label: 'กิจกรรมหลัก',    emoji: '⭐', bg: 'from-emerald-500 to-teal-600',    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800' },
  SPECIAL: { label: 'กิจกรรมพิเศษ',   emoji: '🏆', bg: 'from-amber-500 to-orange-500',    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',         ring: 'ring-amber-200 dark:ring-amber-800' },
  FREE:    { label: 'กิจกรรมยามว่าง', emoji: '🎯', bg: 'from-violet-500 to-purple-600',   badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',     ring: 'ring-violet-200 dark:ring-violet-800' },
}

function ProgressRing({ value, max, color }) {
  const pct = max === 0 ? 0 : Math.min(value / max, 1)
  const r = 20
  const circ = 2 * Math.PI * r
  const dash = circ * pct

  return (
    <svg width="52" height="52" className="flex-shrink-0 -rotate-90">
      <circle cx="26" cy="26" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-100 dark:text-scout-700" />
      <circle
        cx="26" cy="26" r={r} fill="none"
        stroke="url(#grad)" strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color[0]} />
          <stop offset="100%" stopColor={color[1]} />
        </linearGradient>
      </defs>
      <text
        x="26" y="26"
        textAnchor="middle" dominantBaseline="central"
        className="rotate-90 fill-scout-900 dark:fill-white"
        style={{ transform: 'rotate(90deg)', transformOrigin: '26px 26px', fontSize: '9px', fontWeight: 700 }}
      >
        {value}/{max}
      </text>
    </svg>
  )
}

export default function ScoutActivities() {
  const { data: scout } = useQuery('my-scout', () => api.get('/scouts/my'))
  const { data: allActivities } = useQuery('activities', () => api.get('/activities'))

  const attended = new Set(scout?.attendances?.map(a => a.activityId))

  const groups = { MAIN: [], SPECIAL: [], FREE: [] }
  allActivities?.forEach(a => { if (groups[a.type]) groups[a.type].push(a) })

  const totalAll = allActivities?.length || 0
  const doneAll  = allActivities?.filter(a => attended.has(a.id)).length || 0
  const pctAll   = totalAll === 0 ? 0 : Math.round((doneAll / totalAll) * 100)

  return (
    <div className="page pb-28">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        .act-item { animation: fadeUp 0.3s ease both }
        .act-item:hover { transform: translateX(3px); }
        .act-item { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .act-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
      `}</style>

      <PageHeader title="กิจกรรมของฉัน" />

      {/* ── Summary card ── */}
      <div className="mx-0 mb-6 rounded-2xl bg-gradient-to-br from-scout-600 to-teal-700 p-4 sm:p-5 text-white shadow-lg overflow-hidden relative">
        {/* decorative circles */}
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-4 w-36 h-36 rounded-full bg-white/5" />

        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-white/60 mb-1 font-medium tracking-wide uppercase">ความคืบหน้าทั้งหมด</p>
            <p className="text-4xl font-black tabular-nums leading-none">{pctAll}<span className="text-xl font-bold text-white/70">%</span></p>
            <p className="text-sm text-white/70 mt-1">ผ่านแล้ว {doneAll} จาก {totalAll} กิจกรรม</p>
          </div>

          {/* mini bars */}
          <div className="flex flex-col gap-2 min-w-[120px]">
            {Object.entries(groups).map(([type, acts]) => {
              const cfg = TYPE_CONFIG[type]
              const done = acts.filter(a => attended.has(a.id)).length
              const pct = acts.length === 0 ? 0 : Math.round((done / acts.length) * 100)
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-xs text-white/60 w-[72px] truncate">{cfg.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white/80"
                      style={{ width: `${pct}%`, transition: 'width 0.5s ease' }}
                    />
                  </div>
                  <span className="text-xs text-white/60 tabular-nums w-6 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Activity groups ── */}
      <div className="space-y-6">
        {Object.entries(groups).map(([type, acts], gi) => {
          const cfg = TYPE_CONFIG[type]
          const done = acts.filter(a => attended.has(a.id)).length

          return (
            <div key={type} style={{ animationDelay: `${gi * 0.08}s` }}>

              {/* Group header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cfg.bg} flex items-center justify-center text-base shadow-sm`}>
                    {cfg.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-scout-900 dark:text-white leading-none">{cfg.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">ผ่านแล้ว {done}/{acts.length}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                  {acts.length === 0 ? '0%' : Math.round((done / acts.length) * 100) + '%'}
                </span>
              </div>

              {/* Activity list */}
              {acts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 rounded-2xl border border-dashed border-gray-200 dark:border-scout-700 gap-2">
                  <span className="text-2xl opacity-30">📭</span>
                  <p className="text-xs text-gray-400">ยังไม่มีกิจกรรม</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {acts.map((a, i) => {
                    const isDone = attended.has(a.id)
                    return (
                      <div
                        key={a.id}
                        className={`act-item flex items-center gap-3 px-4 py-3 rounded-2xl border bg-white dark:bg-scout-800 ${
                          isDone
                            ? `border-transparent ring-1 ${cfg.ring}`
                            : 'border-gray-100 dark:border-scout-700'
                        }`}
                        style={{ animationDelay: `${gi * 0.08 + i * 0.04}s` }}
                      >
                        {/* Check icon */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isDone
                            ? `bg-gradient-to-br ${cfg.bg} shadow-sm`
                            : 'bg-gray-100 dark:bg-scout-700'
                        }`}>
                          {isDone
                            ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5L5.5 9.5L10.5 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            : <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-scout-500" />
                          }
                        </div>

                        {/* Name */}
                        <p className={`flex-1 text-sm leading-snug ${
                          isDone
                            ? 'font-semibold text-scout-900 dark:text-white'
                            : 'text-gray-400 dark:text-scout-400'
                        }`}>
                          {a.name}
                        </p>

                        {/* Done badge */}
                        {isDone && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.badge}`}>
                            ผ่านแล้ว
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}