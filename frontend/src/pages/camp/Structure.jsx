import { useQuery, useMutation, useQueryClient } from 'react-query'
import React, { useState } from 'react'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import PageHeader from '../../components/PageHeader'
import toast from 'react-hot-toast'
import { Plus, ChevronRight, Users, Building2, Star, X, TrendingUp, Search } from 'lucide-react'

// ── Sub-components outside main to prevent issues ────────────────────────────
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-scout-700 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-scout-600">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-scout-600 text-gray-400 transition-colors">
        <X size={18} />
      </button>
    </div>
  )
}

const INPUT_CLS = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 bg-gray-50 dark:bg-scout-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-scout-400 focus:border-transparent transition text-sm"

const TROOP_COLORS = [
  { bg: 'from-emerald-500 to-teal-600' },
  { bg: 'from-green-500 to-emerald-600' },
  { bg: 'from-teal-500 to-cyan-600' },
  { bg: 'from-lime-500 to-green-600' },
  { bg: 'from-green-600 to-emerald-700' },
]
const colorOf = (idx) => TROOP_COLORS[idx % TROOP_COLORS.length]

// ── Main component ────────────────────────────────────────────────────────────
export default function CampStructure() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState({})
  const [showAddSquad, setShowAddSquad] = useState(null)
  const [squadForm, setSquadForm] = useState({ name: '', number: '' })
  const [showStatsModal, setShowStatsModal] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: camp } = useQuery('camp-my', () => api.get('/camps/my'))
  const { data: scouts } = useQuery('camp-scouts', () => api.get('/scouts?campId=' + (user?.campId || '')))

  const addSquadMutation = useMutation(
    ({ troopId }) => api.post(`/camps/${user.campId}/troops/${troopId}/squads`, squadForm),
    {
      onSuccess: () => {
        qc.invalidateQueries('camp-my')
        setShowAddSquad(null)
        setSquadForm({ name: '', number: '' })
        toast.success('เพิ่มหมู่สำเร็จ')
      }
    }
  )

  const totalTroops = camp?.troops?.length || 0
  const totalSquads = camp?.troops?.reduce((sum, t) => sum + (t.squads?.length || 0), 0) || 0
  const totalScouts = camp?.troops?.reduce((sum, t) =>
    sum + (t.squads?.reduce((s2, sq) => s2 + (sq._count?.scouts || 0), 0) || 0), 0
  ) || 0

  return (
    <div className="page">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">โครงสร้างค่าย</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">จัดการกองและหมู่ในค่ายของคุณ</p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        {[
          { label: 'กองทั้งหมด',    value: totalTroops, icon: <Building2 size={16} />, type: 'troops' },
          { label: 'หมู่ทั้งหมด',   value: totalSquads, icon: <Users     size={16} />, type: 'squads' },
          { label: 'ลูกเสือทั้งหมด', value: totalScouts, icon: <Star      size={16} />, type: 'scouts' },
        ].map(stat => (
          <button
            key={stat.label}
            onClick={() => setShowStatsModal(stat.type)}
            className="group rounded-2xl border border-gray-100 dark:border-scout-600 bg-white dark:bg-scout-800 px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-scout-100 dark:bg-scout-900/40 text-scout-600 dark:text-scout-400 flex items-center justify-center flex-shrink-0">
              {stat.icon}
            </div>
            <div className="flex-1 text-left">
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
            </div>
            <TrendingUp size={14} className="text-gray-400 group-hover:text-scout-500 transition-colors" />
          </button>
        ))}
      </div>

      {/* Troops list */}
      <div className="space-y-4">
        {camp?.troops?.map((troop, idx) => {
          const col = colorOf(idx)
          const troopScouts = troop.squads?.reduce((s, sq) => s + (sq._count?.scouts || 0), 0) || 0

          return (
            <div key={troop.id} className="relative rounded-2xl border border-gray-100 dark:border-scout-600 bg-white dark:bg-scout-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${col.bg}`} />

              <div className="pl-5 pr-5 py-5">
                {/* Troop header */}
                <button
                  onClick={() => setExpanded(e => ({ ...e, [troop.id]: !e[troop.id] }))}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br ${col.bg} flex items-center justify-center shadow-lg`}>
                      <span className="text-white text-xl font-bold">{troop.number}</span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-baseline gap-2 mb-1">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">กอง {troop.number}</h3>
                        <span className="text-xs text-gray-400">· {troop.name || 'ไม่ระบุชื่อ'}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-scout-900/40 text-gray-600 dark:text-gray-300">
                          <Users size={11} /> {troop.squads?.length || 0} หมู่
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-scout-900/40 text-gray-600 dark:text-gray-300">
                          <Star size={11} /> {troopScouts} คน
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className={`text-gray-400 transition-transform duration-200 ${expanded[troop.id] ? 'rotate-90' : ''}`}
                  />
                </button>

                {/* Expanded squads */}
                {expanded[troop.id] && (
                  <div className="mt-4 space-y-3 border-t border-gray-100 dark:border-scout-600 pt-4">
                    <div className="space-y-2">
                      {troop.squads?.map(squad => {
                        // หา school จากลูกเสือในหมู่ (ถ้า backend ส่งมา) หรือจาก leader
                        const school = squad.scouts?.[0]?.school || null

                        return (
                          <div key={squad.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-scout-100 dark:bg-scout-900/40 flex items-center justify-center">
                                <Users size={14} className="text-scout-500" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                  หมู่ {squad.number} · {squad.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {squad._count?.scouts || 0} คน
                                  {squad.leader && ` · ผู้กำกับ: ${squad.leader.name}`}
                                  {school && (
                                    <span className="ml-1 text-blue-500 dark:text-blue-400">· {school}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Add squad */}
                    {showAddSquad === troop.id ? (
                      <div className="rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600 p-4">
                        <div className="space-y-3">
                          <input
                            className={INPUT_CLS}
                            placeholder="ชื่อหมู่ (เช่น ลูกเสือสามัญ)"
                            value={squadForm.name}
                            onChange={e => setSquadForm(f => ({ ...f, name: e.target.value }))}
                          />
                          <input
                            className={INPUT_CLS}
                            type="number"
                            placeholder="หมายเลขหมู่ (เช่น 1, 2, 3)"
                            value={squadForm.number}
                            onChange={e => setSquadForm(f => ({ ...f, number: e.target.value }))}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => addSquadMutation.mutate({ troopId: troop.id })}
                              className="flex-1 px-4 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 text-white text-sm font-semibold transition"
                            >
                              บันทึก
                            </button>
                            <button
                              onClick={() => setShowAddSquad(null)}
                              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddSquad(troop.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition active:scale-95"
                      >
                        <Plus size={16} /> เพิ่มหมู่
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Empty state */}
        {(!camp?.troops || camp.troops.length === 0) && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-scout-50 dark:bg-scout-900/30 flex items-center justify-center mb-4">
              <Building2 size={36} className="text-scout-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">ยังไม่มีกองในค่าย</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">ติดต่อผู้ดูแลระบบเพื่อสร้างกองแรก</p>
          </div>
        )}
      </div>

      {/* Stats Modal */}
      {showStatsModal && (
        <Modal onClose={() => { setShowStatsModal(null); setSearchQuery('') }}>
          <ModalHeader
            title={
              showStatsModal === 'troops' ? 'รายละเอียดกอง' :
              showStatsModal === 'squads' ? 'รายละเอียดหมู่' : 'รายละเอียดลูกเสือ'
            }
            onClose={() => { setShowStatsModal(null); setSearchQuery('') }}
          />

          <div className="px-6 py-5">
            {showStatsModal === 'troops' && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-scout-600">{totalTroops}</p>
                  <p className="text-sm text-gray-500">กองทั้งหมดในค่าย</p>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {camp?.troops?.map((troop, idx) => {
                    const col = colorOf(idx)
                    const troopScouts = troop.squads?.reduce((s, sq) => s + (sq._count?.scouts || 0), 0) || 0
                    return (
                      <div key={troop.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${col.bg} flex items-center justify-center`}>
                          <span className="text-white font-bold">{troop.number}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">{troop.name || `กอง ${troop.number}`}</p>
                          <div className="flex gap-3 mt-1 text-xs text-gray-400">
                            <span>{troop.squads?.length || 0} หมู่</span>
                            <span>·</span>
                            <span>{troopScouts} คน</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {showStatsModal === 'squads' && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-scout-600">{totalSquads}</p>
                  <p className="text-sm text-gray-500">หมู่ทั้งหมดในค่าย</p>
                  <p className="text-xs text-gray-400 mt-1">เฉลี่ย {totalTroops > 0 ? (totalSquads / totalTroops).toFixed(1) : 0} หมู่ต่อกอง</p>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {camp?.troops?.map(troop =>
                    troop.squads?.map(squad => {
                      const troopIdx = camp.troops.findIndex(t => t.id === troop.id)
                      const col = colorOf(troopIdx)
                      const school = squad.scouts?.[0]?.school || null
                      return (
                        <div key={squad.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${col.bg} flex items-center justify-center`}>
                            <Users size={16} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">หมู่ {squad.number} · {squad.name}</p>
                            <p className="text-sm text-gray-500">กอง {troop.number}</p>
                            <div className="flex gap-3 mt-1 text-xs text-gray-400">
                              <span>{squad._count?.scouts || 0} คน</span>
                              {squad.leader && <span>· ผู้กำกับ: {squad.leader.name}</span>}
                              {school && <span className="text-blue-500">· {school}</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {showStatsModal === 'scouts' && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-scout-600">{scouts?.length || 0}</p>
                  <p className="text-sm text-gray-500">ลูกเสือทั้งหมดในค่าย</p>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ, สถานศึกษา..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 bg-gray-50 dark:bg-scout-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-scout-400 transition text-sm"
                  />
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {scouts?.filter(scout =>
                    !searchQuery ||
                    `${scout.firstName} ${scout.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    scout.school?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    scout.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(scout => {
                    let col = null
                    camp?.troops?.forEach((troop, troopIdx) => {
                      troop.squads?.forEach(squad => {
                        if (scout.squadId === squad.id) col = colorOf(troopIdx)
                      })
                    })
                    return (
                      <div key={scout.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${col?.bg || 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
                          <Star size={16} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {scout.firstName} {scout.lastName}
                            {scout.nickname && <span className="text-sm text-gray-400 ml-2">({scout.nickname})</span>}
                          </p>
                          {scout.school && <p className="text-xs text-blue-500 dark:text-blue-400">{scout.school}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 pb-6">
            <button
              onClick={() => { setShowStatsModal(null); setSearchQuery('') }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition"
            >
              ปิด
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}