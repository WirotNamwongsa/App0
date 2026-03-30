import { useQuery } from 'react-query'
import api from '../../lib/api'
import PageHeader from '../../components/PageHeader'

const TYPE_CONFIG = {
  MAIN:    { label: 'กิจกรรมหลัก',    emoji: '⭐', bg: 'from-emerald-500 to-teal-600',  badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800', bar: 'from-emerald-400 to-teal-500' },
  SPECIAL: { label: 'กิจกรรมพิเศษ',   emoji: '🏆', bg: 'from-amber-500 to-orange-500',  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',         ring: 'ring-amber-200 dark:ring-amber-800',   bar: 'from-amber-400 to-orange-400' },
  FREE:    { label: 'กิจกรรมยามว่าง', emoji: '🎯', bg: 'from-violet-500 to-purple-600', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',     ring: 'ring-violet-200 dark:ring-violet-800', bar: 'from-violet-400 to-purple-500' },
}

export default function LeaderReport() {
  const { data: me } = useQuery('me', () => api.get('/auth/me'))
  const squadId = me?.leadingSquads?.[0]?.id

  const { data, isLoading } = useQuery(
    ['squad-report', squadId],
    () => api.get(`/reports/squad/${squadId}`),
    { enabled: !!squadId }
  )

  const { data: allActivities = [] } = useQuery('activities', () => api.get('/activities'))

  const scouts = data?.squad?.scouts || []
  const squadName = data?.squad?.name || 'หมู่ของฉัน'

  const groups = { MAIN: [], SPECIAL: [], FREE: [] }
  allActivities.forEach(a => { if (groups[a.type]) groups[a.type].push(a) })

  const totalActs = allActivities.length
  const totalPossible = scouts.length * totalActs
  const totalAttended = scouts.reduce((sum, sc) => sum + (sc.attendances?.length || 0), 0)
  const pctAll = totalPossible === 0 ? 0 : Math.round((totalAttended / totalPossible) * 100)

  const stats = Object.entries(groups).map(([type, acts]) => {
    const attended = scouts.reduce((sum, sc) => {
      const count = sc.attendances?.filter(a => acts.some(act => act.id === a.activityId)).length || 0
      return sum + count
    }, 0)
    const total = scouts.length * acts.length
    return { type, attended, total, pct: total ? Math.round(attended / total * 100) : 0 }
  })

  return (
    <div className="page pb-10">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        .fade-up { animation: fadeUp 0.3s ease both }
        .scout-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .scout-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
      `}</style>

      <PageHeader title="รายงานหมู่" showBack />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-scout-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <>
          {/* ── Summary banner ── */}
          <div className="mb-6 rounded-2xl bg-gradient-to-br from-scout-600 to-teal-700 p-4 sm:p-5 text-white shadow-lg overflow-hidden relative fade-up">
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-4 w-36 h-36 rounded-full bg-white/5" />

            <div className="relative">
              <p className="text-xs text-white/60 mb-1 font-medium tracking-wide uppercase">ภาพรวม · {squadName}</p>
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <p className="text-4xl font-black tabular-nums leading-none">
                    {pctAll}<span className="text-xl font-bold text-white/70">%</span>
                  </p>
                  <p className="text-sm text-white/70 mt-1">
                    {scouts.length} คน · {totalActs} กิจกรรม
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">{scouts.filter(sc => {
                    const att = new Set(sc.attendances?.map(a => a.activityId))
                    return groups.MAIN.filter(a => att.has(a.id)).length >= 5 &&
                           groups.SPECIAL.filter(a => att.has(a.id)).length >= 3
                  }).length}</p>
                  <p className="text-xs text-white/60">คนได้รางวัล</p>
                </div>
              </div>

              {/* mini bars */}
              <div className="flex flex-col gap-2">
                {stats.map(s => {
                  const cfg = TYPE_CONFIG[s.type]
                  return (
                    <div key={s.type} className="flex items-center gap-2">
                      <span className="text-xs text-white/60 w-[80px] truncate">{cfg.label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
                        <div className="h-full rounded-full bg-white/80" style={{ width: `${s.pct}%`, transition: 'width 0.5s ease' }} />
                      </div>
                      <span className="text-xs text-white/60 tabular-nums w-8 text-right">{s.pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Group overview ── */}
          <div className="grid grid-cols-3 gap-2 mb-6 fade-up" style={{ animationDelay: '0.08s' }}>
            {stats.map(s => {
              const cfg = TYPE_CONFIG[s.type]
              return (
                <div key={s.type} className="rounded-2xl border border-gray-100 dark:border-scout-700 bg-white dark:bg-scout-800 p-3 text-center">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cfg.bg} flex items-center justify-center text-sm mx-auto mb-2 shadow-sm`}>
                    {cfg.emoji}
                  </div>
                  <p className="text-lg font-black text-scout-900 dark:text-white tabular-nums">{s.pct}<span className="text-xs font-normal text-gray-400">%</span></p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{cfg.label}</p>
                  <div className="mt-2 h-1 rounded-full bg-gray-100 dark:bg-scout-700 overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${cfg.bar}`} style={{ width: `${s.pct}%`, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Individual scouts ── */}
          <p className="text-sm font-bold text-scout-900 dark:text-white mb-3 fade-up" style={{ animationDelay: '0.12s' }}>
            รายบุคคล
            <span className="ml-2 text-xs font-normal text-gray-400">{scouts.length} คน</span>
          </p>

          <div className="space-y-3">
            {scouts.map((sc, i) => {
              const attended = new Set(sc.attendances?.map(a => a.activityId))
              const mainDone    = groups.MAIN.filter(a => attended.has(a.id)).length
              const specialDone = groups.SPECIAL.filter(a => attended.has(a.id)).length
              const freeDone    = groups.FREE.filter(a => attended.has(a.id)).length
              const totalDone   = mainDone + specialDone + freeDone
              const totalScout  = allActivities.length
              const pct         = totalScout === 0 ? 0 : Math.round((totalDone / totalScout) * 100)
              const award       = mainDone >= 5 && specialDone >= 3
              const missing     = [...groups.MAIN, ...groups.SPECIAL].filter(a => !attended.has(a.id))

              return (
                <div
                  key={sc.id}
                  className="scout-card fade-up rounded-2xl border border-gray-100 dark:border-scout-700 bg-white dark:bg-scout-800 overflow-hidden"
                  style={{ animationDelay: `${0.16 + i * 0.05}s` }}
                >
                  {/* Scout header */}
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50 dark:border-scout-700">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        award
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-scout-700 text-gray-600 dark:text-scout-300'
                      }`}>
                        {sc.firstName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-scout-900 dark:text-white leading-none">
                          {sc.firstName} {sc.lastName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{sc.school || '-'}</p>
                      </div>
                    </div>
                    {award ? (
                      <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                        🏆 ได้รางวัล
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 dark:bg-scout-700 text-gray-500 dark:text-scout-400 px-2.5 py-1 rounded-full">
                        ยังไม่ครบ
                      </span>
                    )}
                  </div>

                  <div className="px-4 py-3">
                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-scout-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-scout-400 to-teal-500"
                          style={{ width: `${pct}%`, transition: 'width 0.5s ease' }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-500 tabular-nums">{pct}%</span>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { type: 'MAIN',    done: mainDone,    total: groups.MAIN.length },
                        { type: 'SPECIAL', done: specialDone, total: groups.SPECIAL.length },
                        { type: 'FREE',    done: freeDone,    total: groups.FREE.length },
                      ].map(({ type, done, total }) => {
                        const cfg = TYPE_CONFIG[type]
                        const pctItem = total === 0 ? 0 : Math.round((done / total) * 100)
                        return (
                          <div key={type} className="bg-gray-50 dark:bg-scout-800/60 rounded-xl p-2.5 text-center">
                            <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${cfg.bg} flex items-center justify-center text-xs mx-auto mb-1.5`}>
                              {cfg.emoji}
                            </div>
                            <p className="text-base font-black text-scout-900 dark:text-white tabular-nums leading-none">
                              {done}<span className="text-xs font-normal text-gray-400">/{total}</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{cfg.label.replace('กิจกรรม', '')}</p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Missing activities */}
                    {missing.length > 0 && (
                      <div className="pt-2.5 border-t border-gray-100 dark:border-scout-700">
                        <p className="text-xs text-gray-400 mb-1.5">ยังขาด {missing.length} กิจกรรม:</p>
                        <div className="flex flex-wrap gap-1">
                          {missing.map(a => (
                            <span key={a.id} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-500 px-2 py-0.5 rounded-full">
                              {a.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {scouts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-scout-700">
                <span className="text-3xl opacity-30">👥</span>
                <p className="text-sm text-gray-400">ยังไม่มีลูกเสือในหมู่</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}