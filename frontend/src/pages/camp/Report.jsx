import { useQuery } from 'react-query'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import PageHeader from '../../components/PageHeader'
import BottomNav from '../../components/BottomNav'

const TYPE_CONFIG = {
  MAIN:    { label: 'กิจกรรมหลัก',    emoji: '⭐', bg: 'from-emerald-500 to-teal-600',  badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800', bar: 'from-emerald-400 to-teal-500' },
  SPECIAL: { label: 'กิจกรรมพิเศษ',   emoji: '🏆', bg: 'from-amber-500 to-orange-500',  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',         ring: 'ring-amber-200 dark:ring-amber-800',   bar: 'from-amber-400 to-orange-400' },
  FREE:    { label: 'กิจกรรมยามว่าง', emoji: '🎯', bg: 'from-violet-500 to-purple-600', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',     ring: 'ring-violet-200 dark:ring-violet-800', bar: 'from-violet-400 to-purple-500' },
}

export default function CampReport() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery('camp-report', () => api.get(`/reports/camp/${user.campId}`))

  const allActivities = data?.activityStats || []
  const totalAll = allActivities.length
  const doneAll  = allActivities.filter(a => a.percentage === 100).length
  const pctAll   = totalAll === 0 ? 0 : Math.round(allActivities.reduce((s, a) => s + a.percentage, 0) / totalAll)

  const groups = { MAIN: [], SPECIAL: [], FREE: [] }
  allActivities.forEach(a => { if (groups[a.type]) groups[a.type].push(a) })

  return (
    <div className="page pb-28">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        .act-item { animation: fadeUp 0.3s ease both; transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .act-item:hover { transform: translateX(3px); box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
      `}</style>

      <PageHeader title="รายงานค่าย" />

      {/* ── Summary card ── */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-scout-600 to-teal-700 p-4 sm:p-5 text-white shadow-lg overflow-hidden relative">
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-4 w-36 h-36 rounded-full bg-white/5" />

        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-white/60 mb-1 font-medium tracking-wide uppercase">ภาพรวมค่าย</p>
            <p className="text-4xl font-black tabular-nums leading-none">
              {pctAll}<span className="text-xl font-bold text-white/70">%</span>
            </p>
            <p className="text-sm text-white/70 mt-1">เฉลี่ยจาก {totalAll} กิจกรรม</p>
          </div>

          <div className="flex flex-col gap-2 min-w-[120px]">
            {Object.entries(groups).map(([type, acts]) => {
              const cfg = TYPE_CONFIG[type]
              const avg = acts.length === 0 ? 0 : Math.round(acts.reduce((s, a) => s + a.percentage, 0) / acts.length)
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-xs text-white/60 w-[72px] truncate">{cfg.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
                    <div className="h-full rounded-full bg-white/80" style={{ width: `${avg}%`, transition: 'width 0.5s ease' }} />
                  </div>
                  <span className="text-xs text-white/60 tabular-nums w-6 text-right">{avg}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-scout-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">กำลังโหลด...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([type, acts], gi) => {
            const cfg = TYPE_CONFIG[type]
            const avg = acts.length === 0 ? 0 : Math.round(acts.reduce((s, a) => s + a.percentage, 0) / acts.length)

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
                      <p className="text-xs text-gray-400 mt-0.5">{acts.length} กิจกรรม</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                    เฉลี่ย {avg}%
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
                      const isHigh = a.percentage >= 80
                      return (
                        <div
                          key={a.id}
                          className={`act-item px-4 py-3 rounded-2xl border bg-white dark:bg-scout-800 ${
                            isHigh
                              ? `border-transparent ring-1 ${cfg.ring}`
                              : 'border-gray-100 dark:border-scout-700'
                          }`}
                          style={{ animationDelay: `${gi * 0.08 + i * 0.04}s` }}
                        >
                          {/* Row 1: icon + name + badge */}
                          <div className="flex items-center gap-3 mb-2.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isHigh ? `bg-gradient-to-br ${cfg.bg} shadow-sm` : 'bg-gray-100 dark:bg-scout-700'
                            }`}>
                              {isHigh
                                ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5L5.5 9.5L10.5 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                : <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-scout-500" />
                              }
                            </div>
                            <p className={`flex-1 text-sm font-semibold leading-snug ${isHigh ? 'text-scout-900 dark:text-white' : 'text-gray-600 dark:text-scout-300'}`}>
                              {a.name}
                            </p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.badge}`}>
                              {a.percentage}%
                            </span>
                          </div>

                          {/* Row 2: progress bar */}
                          <div className="h-1.5 bg-gray-100 dark:bg-scout-700 rounded-full overflow-hidden mb-1.5">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${cfg.bar}`}
                              style={{ width: `${a.percentage}%`, transition: 'width 0.6s ease' }}
                            />
                          </div>

                          {/* Row 3: count */}
                          <p className="text-xs text-gray-400 pl-10">{a.attended}/{a.total} คน เข้าร่วม</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <BottomNav />
    </div>
  )
}