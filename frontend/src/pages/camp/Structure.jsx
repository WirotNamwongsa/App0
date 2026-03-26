import { useQuery, useMutation, useQueryClient } from 'react-query'
import React, { useState, useCallback } from 'react'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import PageHeader from '../../components/PageHeader'
import toast from 'react-hot-toast'
import { Plus, ChevronRight, Users, Building2, Star, X, TrendingUp, Search, Trash2, Zap, AlertTriangle, ChevronDown } from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────
const TROOP_COLORS = [
  { bg: 'from-emerald-500 to-teal-600' },
  { bg: 'from-green-500 to-emerald-600' },
  { bg: 'from-teal-500 to-cyan-600' },
  { bg: 'from-lime-500 to-green-600' },
  { bg: 'from-green-600 to-emerald-700' },
]
const colorOf = (idx) => TROOP_COLORS[idx % TROOP_COLORS.length]

const INPUT_CLS =
  'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 bg-gray-50 dark:bg-scout-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-scout-400 focus:border-transparent transition text-sm'

// Helper: รองรับทั้ง squad.leader และ squad.leaders[]
const getLeader = (squad) => squad?.leader || squad?.leaders?.[0] || null

// ── Sub-components ─────────────────────────────────────────────────────────────
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
      <button
        onClick={onClose}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-scout-600 text-gray-400 transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  )
}

// FIX: ConfirmDeleteModal แยกออกมา render ที่ root level ป้องกันการซ้อนกันใน troop loop
function ConfirmDeleteModal({ item, onConfirm, onCancel }) {
  if (!item) return null
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-white dark:bg-scout-900 rounded-2xl w-full max-w-xs shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 pt-6 pb-2">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <p className="font-bold text-scout-900 dark:text-white text-lg">ลบข้อมูล?</p>
          <p className="text-sm text-gray-500 dark:text-scout-400 mt-1">
            ต้องการลบ <span className="font-semibold text-red-500">{item.label}</span> ใช่หรือไม่?
          </p>
          <p className="text-xs text-gray-400 mt-1">⚠️ การลบกองจะลบหมู่ทั้งหมดในกองนี้ด้วย</p>
        </div>
        <div className="flex gap-2 p-4">
          <button
            onClick={() => { onConfirm(); onCancel() }}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all"
          >
            ลบเลย
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-scout-800 text-gray-600 dark:text-scout-300 hover:bg-gray-200 dark:hover:bg-scout-700 transition-all"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CampStructure() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const [expanded, setExpanded] = useState({})
  const [showAddSquad, setShowAddSquad] = useState(null)
  const [squadForm, setSquadForm] = useState({ name: '', number: '' })
  const [showStatsModal, setShowStatsModal] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [viewingSquad, setViewingSquad] = useState(null)
  const [showAddTroopModal, setShowAddTroopModal] = useState(false)
  const [troopForm, setTroopForm] = useState({ name: '' })
  const [confirmDel, setConfirmDel] = useState(null) // { label, onConfirm }
  const [showOrganizeModal, setShowOrganizeModal] = useState(false)
  const [organizePreview, setOrganizePreview] = useState(null)
  const [organizing, setOrganizing] = useState(false)

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: camp } = useQuery('camp-my', () => api.get('/camps/my'))
  const { data: scouts } = useQuery(
    'camp-scouts',
    () => api.get('/scouts?campId=' + (user?.campId || '')),
  )
  const { data: squadScouts = [], isLoading: loadingSquadScouts } = useQuery(
    ['squad-scouts', viewingSquad?.id],
    () => api.get(`/scouts?squadId=${viewingSquad.id}`),
    { enabled: !!viewingSquad },
  )

  // ── Mutations ────────────────────────────────────────────────────────────────
  const addSquadMutation = useMutation(
    ({ troopId }) =>
      api.post(`/camps/${user.campId}/troops/${troopId}/squads`, squadForm),
    {
      onSuccess: () => {
        qc.invalidateQueries('camp-my')
        setShowAddSquad(null)
        setSquadForm({ name: '', number: '' })
        toast.success('เพิ่มหมู่สำเร็จ')
      },
      onError: (err) =>
        toast.error(err?.response?.data?.message || 'เพิ่มหมู่ไม่สำเร็จ กรุณาลองใหม่'),
    },
  )

  const addTroopMutation = useMutation(
    () =>
      api.post(`/camps/${user.campId}/troops`, {
        name: troopForm.name,
        number: (camp?.troops?.length || 0) + 1,
      }),
    {
      onSuccess: () => {
        qc.invalidateQueries('camp-my')
        setShowAddTroopModal(false)
        setTroopForm({ name: '' })
        toast.success('เพิ่มกองสำเร็จ')
      },
      onError: (err) =>
        toast.error(err?.response?.data?.message || 'เพิ่มกองไม่สำเร็จ กรุณาลองใหม่'),
    },
  )

  const deleteTroopMutation = useMutation(
    (troopId) => api.delete(`/camps/${user.campId}/troops/${troopId}`),
    {
      onSuccess: () => {
        qc.invalidateQueries('camp-my')
        qc.invalidateQueries('camp-scouts')
        toast.success('ลบกองสำเร็จ')
      },
      onError: (err) =>
        toast.error(err?.response?.data?.message || 'ลบกองไม่สำเร็จ กรุณาลองใหม่'),
    },
  )

  const assignScoutMutation = useMutation(
    ({ scoutId, squadId }) => api.patch(`/camps/scouts/${scoutId}/move`, { squadId }),
    {
      onSuccess: () => {
        qc.invalidateQueries('camp-scouts')
        qc.invalidateQueries('camp-my')
        toast.success('จัดลูกเสือเข้าหมู่สำเร็จ')
      },
      onError: (err) =>
        toast.error(err?.response?.data?.message || 'จัดหมู่ไม่สำเร็จ กรุณาลองใหม่'),
    },
  )

  const organizeTroopsMutation = useMutation(
    (troops) => api.post(`/camps/${user.campId}/organize-troops`, { troops }),
    {
      onSuccess: () => {
        qc.invalidateQueries('camp-my')
        qc.invalidateQueries('camp-scouts')
        setShowOrganizeModal(false)
        setOrganizePreview(null)
        toast.success('จัดกองอัตโนมัติสำเร็จ')
        setOrganizing(false)
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message || 'จัดกองไม่สำเร็จ กรุณาลองใหม่')
        setOrganizing(false)
      },
    },
  )

  // ── Derived state ────────────────────────────────────────────────────────────
  const totalTroops = camp?.troops?.length || 0
  const totalSquads =
    camp?.troops?.reduce((sum, t) => sum + (t.squads?.length || 0), 0) || 0
  const totalScouts =
    camp?.troops?.reduce(
      (sum, t) =>
        sum + (t.squads?.reduce((s2, sq) => s2 + (sq._count?.scouts || 0), 0) || 0),
      0,
    ) || 0

  const unassignedScouts = scouts?.filter((s) => !s.squadId) || []
  const unassignedCount = unassignedScouts.length

  const allSquads =
    camp?.troops?.flatMap((troop) =>
      (troop.squads || []).map((squad) => ({ ...squad, troopNumber: troop.number })),
    ) || []

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleToggleExpand = useCallback(
    (troopId) => setExpanded((e) => ({ ...e, [troopId]: !e[troopId] })),
    [],
  )

  const handleAssignScout = useCallback(
    (scoutId) => {
      const sel = document.getElementById(`squad-select-${scoutId}`)
      if (!sel?.value) return toast.error('กรุณาเลือกหมู่ก่อน')
      assignScoutMutation.mutate({ scoutId, squadId: sel.value })
    },
    [assignScoutMutation],
  )

  const closeStatsModal = useCallback(() => {
    setShowStatsModal(null)
    setSearchQuery('')
  }, [])

  // ── Organization Logic ─────────────────────────────────────────────────────
  const handleAutoOrganize = useCallback(() => {
    const squads = allSquads
    if (squads.length === 0) {
      toast.error('ไม่มีหมู่ในค่าย')
      return
    }

    // แยกหมู่ตามเพศ
   const getSquadGender = (squad) => {
  const scoutsInSquad = scouts?.filter(s => s.squadId === squad.id)
  if (scoutsInSquad.length === 0) return 'ไม่ระบุ'
  return scoutsInSquad[0].gender || 'ไม่ระบุ'
}
 
const squadsByGender = squads.reduce((acc, squad) => {
  const gender = getSquadGender(squad)
  if (!acc[gender]) acc[gender] = []
  acc[gender].push(squad)
  return acc
}, {})
 
// จัดหมู่เข้ากอง กองละ 4 หมู่
const organizedTroops = []
let troopNumber = 1
 
Object.entries(squadsByGender).forEach(([gender, genderSquads]) => {
  for (let i = 0; i < genderSquads.length; i += 4) {
    const troopSquads = genderSquads.slice(i, i + 4)
    organizedTroops.push({
      number: troopNumber++,
      gender,
      squads: troopSquads.map(squad => ({
        id: squad.id,
        name: squad.name
      }))
    })
  }
})
 
setOrganizePreview(organizedTroops)
setShowOrganizeModal(true)

  }, [allSquads])

  const handleConfirmOrganize = useCallback(() => {
    if (!organizePreview) return
    
    setOrganizing(true)
    organizeTroopsMutation.mutate(organizePreview)
  }, [organizePreview, organizeTroopsMutation])

  const handleAssignRemainingSquad = useCallback((squadId, targetTroopNumber) => {
    setOrganizePreview(prev => {
      const squad = prev.flatMap(t => t.squads).find(s => s.id === squadId)
      if (!squad) return prev

      return prev.map(troop => {
        if (troop.number === targetTroopNumber) {
          return {
            ...troop,
            squads: [...troop.squads, squad]
          }
        }
        // ลบหมู่จากกองเดิม
        return {
          ...troop,
          squads: troop.squads.filter(s => s.id !== squadId)
        }
      }).filter(troop => troop.squads.length > 0) // ลบกองที่ว่างเปล่า
    })
  }, [])

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">โครงสร้างค่าย</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            จัดการกองและหมู่ในค่ายของคุณ
          </p>
        </div>
        <div className="flex gap-2">
          {totalSquads > 0 && (
            <button
              onClick={handleAutoOrganize}
              className="btn-secondary text-sm px-4 py-2.5 flex items-center gap-2"
            >
              <Zap size={16} />
              จัดกองอัตโนมัติ
            </button>
          )}
          {unassignedCount > 0 && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="btn-secondary text-sm px-4 py-2.5 flex items-center gap-2"
            >
              <Users size={16} />
              จัดหมู่
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unassignedCount}
              </span>
            </button>
          )}
          <button
            onClick={() => setShowAddTroopModal(true)}
            className="btn-primary text-sm px-4 py-2.5"
          >
            <Plus size={16} /> เพิ่มกอง
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        {[
          { label: 'กองทั้งหมด', value: totalTroops, icon: <Building2 size={16} />, type: 'troops' },
          { label: 'หมู่ทั้งหมด', value: totalSquads, icon: <Users size={16} />, type: 'squads' },
          { label: 'ลูกเสือทั้งหมด', value: totalScouts, icon: <Star size={16} />, type: 'scouts' },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => setShowStatsModal(stat.type)}
            className="group rounded-2xl border border-gray-100 dark:border-scout-600 bg-white dark:bg-scout-800 px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-scout-100 dark:bg-scout-900/40 text-scout-600 dark:text-scout-400 flex items-center justify-center flex-shrink-0">
              {stat.icon}
            </div>
            <div className="flex-1 text-left">
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
            </div>
            <TrendingUp
              size={14}
              className="text-gray-400 group-hover:text-scout-500 transition-colors"
            />
          </button>
        ))}
      </div>

      {/* Unassigned banner */}
      {unassignedCount > 0 && (
        <div className="mb-5 flex items-center justify-between px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <Users size={16} />
            <span>
              มีลูกเสือ <strong>{unassignedCount} คน</strong> ที่ยังไม่ได้จัดหมู่
            </span>
          </div>
          <button
            onClick={() => setShowAssignModal(true)}
            className="text-xs font-semibold text-amber-700 dark:text-amber-400 underline underline-offset-2"
          >
            จัดหมู่เลย
          </button>
        </div>
      )}

      {/* Troops list */}
      <div className="space-y-4">
        {camp?.troops?.map((troop, idx) => {
          const col = colorOf(idx)
          const troopScouts =
            troop.squads?.reduce((s, sq) => s + (sq._count?.scouts || 0), 0) || 0

          return (
            <div
              key={troop.id}
              className="relative rounded-2xl border border-gray-100 dark:border-scout-600 bg-white dark:bg-scout-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${col.bg}`} />

              <div className="pl-5 pr-5 py-5">
                {/* Troop header */}
                <div className="flex items-center justify-between">
                  {/* FIX: แยก expand click ออกจาก delete button เพื่อป้องกัน event bubbling */}
                  <button
                    onClick={() => handleToggleExpand(troop.id)}
                    className="flex-1 flex items-center gap-4 text-left"
                  >
                    <div
                      className={`w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br ${col.bg} flex items-center justify-center shadow-lg`}
                    >
                      <span className="text-white text-xl font-bold">{troop.number}</span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-baseline gap-2 mb-1">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                          กอง {troop.number}
                        </h3>
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
                  </button>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() =>
                        setConfirmDel({
                          label: `กอง "${troop.name}"`,
                          onConfirm: () => deleteTroopMutation.mutate(troop.id),
                        })
                      }
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => handleToggleExpand(troop.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-scout-700 transition-all"
                    >
                      <ChevronRight
                        size={20}
                        className={`transition-transform duration-200 ${expanded[troop.id] ? 'rotate-90' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded squads */}
                {expanded[troop.id] && (
                  <div className="mt-4 space-y-3 border-t border-gray-100 dark:border-scout-600 pt-4">
                    <div className="space-y-2">
                      {troop.squads?.map((squad) => {
                        const leader = getLeader(squad)
                        const school = squad.school || null
                        return (
                          <button
                            key={squad.id}
                            onClick={() => setViewingSquad(squad)}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600 hover:border-scout-300 dark:hover:border-scout-500 hover:shadow-sm transition-all text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-scout-100 dark:bg-scout-900/40 flex items-center justify-center">
                                <Users size={14} className="text-scout-500" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                  {squad.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {squad._count?.scouts || 0} คน
                                  {leader && ` · ผู้กำกับ: ${leader.name}`}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-xs font-medium ${school ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400'}`}
                            >
                              {school || 'ไม่ระบุสถานศึกษา'}
                            </span>
                          </button>
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
                            onChange={(e) =>
                              setSquadForm((f) => ({ ...f, name: e.target.value }))
                            }
                          />
                          <input
                            className={INPUT_CLS}
                            type="number"
                            placeholder="หมายเลขหมู่ (เช่น 1, 2, 3)"
                            value={squadForm.number}
                            onChange={(e) =>
                              setSquadForm((f) => ({ ...f, number: e.target.value }))
                            }
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => addSquadMutation.mutate({ troopId: troop.id })}
                              disabled={addSquadMutation.isLoading || !squadForm.name}
                              className="flex-1 px-4 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
                            >
                              {addSquadMutation.isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
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
                    ) : troop.squads?.length >= 4 ? (
                      <div className="text-center py-3 rounded-xl bg-gray-50 dark:bg-scout-800/40 border border-dashed border-gray-200 dark:border-scout-600">
                        <p className="text-xs text-gray-400">สร้างได้สูงสุด 4 หมู่ต่อกอง</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddSquad(troop.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition active:scale-95"
                      >
                        <Plus size={16} /> เพิ่มหมู่ ({troop.squads?.length || 0}/4)
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
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
              ยังไม่มีกองในค่าย
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              ติดต่อผู้ดูแลระบบเพื่อสร้างกองแรก
            </p>
          </div>
        )}
      </div>

      {/* ── Modals (rendered at root level — ไม่ซ้อนใน loop) ──────────────── */}

      {/* Confirm Delete Modal — FIX: ย้ายออกมา render ที่ root level */}
      <ConfirmDeleteModal
        item={confirmDel}
        onConfirm={() => confirmDel?.onConfirm()}
        onCancel={() => setConfirmDel(null)}
      />

      {/* Squad Detail Modal */}
      {viewingSquad && (
        <Modal onClose={() => setViewingSquad(null)}>
          <ModalHeader
            title={`หมู่ ${viewingSquad.number} · ${viewingSquad.name}`}
            onClose={() => setViewingSquad(null)}
          />
          <div className="px-6 py-5">
            {(() => {
              const leader = getLeader(viewingSquad)
              return (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-scout-50 dark:bg-scout-900/30 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-scout-100 dark:bg-scout-900/40 flex items-center justify-center">
                    <Users size={18} className="text-scout-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {viewingSquad._count?.scouts || 0} คน
                    </p>
                    {leader && <p className="text-xs text-gray-400">ผู้กำกับ: {leader.name}</p>}
                  </div>
                </div>
              )
            })()}

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                รายชื่อลูกเสือ
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-scout-100 dark:bg-scout-900/40 text-scout-700 dark:text-scout-300">
                {viewingSquad._count?.scouts || 0} คน
              </span>
            </div>

            {loadingSquadScouts ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-scout-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : squadScouts.length === 0 ? (
              <div className="text-center py-8 rounded-xl bg-gray-50 dark:bg-scout-800/40 border border-dashed border-gray-200 dark:border-scout-600">
                <Users size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">ไม่มีลูกเสือในหมู่นี้</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {squadScouts.map((scout) => (
                  <div
                    key={scout.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600"
                  >
                    <div className="w-8 h-8 rounded-full bg-scout-100 dark:bg-scout-900/40 flex items-center justify-center text-xs font-bold text-scout-600">
                      {scout.firstName?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {scout.firstName} {scout.lastName}
                        {scout.nickname && (
                          <span className="text-gray-400 font-normal ml-1">
                            ({scout.nickname})
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                            scout.gender === 'ชาย'
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                              : scout.gender === 'หญิง'
                                ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-400'
                          }`}
                        >
                          {scout.gender || 'ไม่ระบุ'}
                        </span>
                        <p
                          className={`text-xs ${scout.school ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400'}`}
                        >
                          {scout.school || 'ไม่ระบุสถานศึกษา'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-6 pb-6">
            <button
              onClick={() => setViewingSquad(null)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-600 transition"
            >
              ปิด
            </button>
          </div>
        </Modal>
      )}

      {/* Stats Modal */}
      {showStatsModal && (
        <Modal onClose={closeStatsModal}>
          <ModalHeader
            title={
              showStatsModal === 'troops'
                ? 'รายละเอียดกอง'
                : showStatsModal === 'squads'
                  ? 'รายละเอียดหมู่'
                  : 'รายละเอียดลูกเสือ'
            }
            onClose={closeStatsModal}
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
                    const troopScouts =
                      troop.squads?.reduce((s, sq) => s + (sq._count?.scouts || 0), 0) || 0
                    return (
                      <div
                        key={troop.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600"
                      >
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${col.bg} flex items-center justify-center`}
                        >
                          <span className="text-white font-bold">{troop.number}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {troop.name || `กอง ${troop.number}`}
                          </p>
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
                  <p className="text-xs text-gray-400 mt-1">
                    เฉลี่ย{' '}
                    {totalTroops > 0 ? (totalSquads / totalTroops).toFixed(1) : 0} หมู่ต่อกอง
                  </p>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {camp?.troops?.map((troop) =>
                    troop.squads?.map((squad) => {
                      const troopIdx = camp.troops.findIndex((t) => t.id === troop.id)
                      const col = colorOf(troopIdx)
                      const leader = getLeader(squad)
                      const school = squad.school || null
                      return (
                        <div
                          key={squad.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600"
                        >
                          <div
                            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${col.bg} flex items-center justify-center`}
                          >
                            <Users size={16} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {squad.name}
                            </p>
                            <p className="text-sm text-gray-500">กอง {troop.number}</p>
                            <div className="flex gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                              <span>{squad._count?.scouts || 0} คน</span>
                              {leader && <span>· ผู้กำกับ: {leader.name}</span>}
                              <span className={school ? 'text-blue-500' : 'text-gray-400'}>
                                · {school || 'ไม่ระบุสถานศึกษา'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }),
                  )}
                </div>
              </div>
            )}

            {showStatsModal === 'scouts' && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-scout-600">{scouts?.length || 0}</p>
                  <p className="text-sm text-gray-500">ลูกเสือทั้งหมดในค่าย</p>
                  {unassignedCount > 0 && (
                    <p className="text-xs text-amber-500 mt-1">
                      ยังไม่ได้จัดหมู่ {unassignedCount} คน
                    </p>
                  )}
                </div>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ, สถานศึกษา..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 bg-gray-50 dark:bg-scout-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-scout-400 transition text-sm"
                  />
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {scouts
                    ?.filter(
                      (scout) =>
                        !searchQuery ||
                        `${scout.firstName} ${scout.lastName}`
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        scout.school?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        scout.nickname?.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((scout) => {
                      let col = null
                      camp?.troops?.forEach((troop, troopIdx) => {
                        troop.squads?.forEach((squad) => {
                          if (scout.squadId === squad.id) col = colorOf(troopIdx)
                        })
                      })
                      return (
                        <div
                          key={scout.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600"
                        >
                          <div
                            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${col?.bg || 'from-gray-400 to-gray-500'} flex items-center justify-center`}
                          >
                            <Star size={16} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {scout.firstName} {scout.lastName}
                              {scout.nickname && (
                                <span className="text-sm text-gray-400 ml-2">
                                  ({scout.nickname})
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                                  scout.gender === 'ชาย'
                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                                    : scout.gender === 'หญิง'
                                      ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400'
                                      : 'bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-400'
                                }`}
                              >
                                {scout.gender || 'ไม่ระบุ'}
                              </span>
                              {scout.school && (
                                <p className="text-xs text-blue-500 dark:text-blue-400">
                                  {scout.school}
                                </p>
                              )}
                              {!scout.squadId && (
                                <span className="text-xs text-amber-500 font-medium">
                                  ยังไม่ได้จัดหมู่
                                </span>
                              )}
                            </div>
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
              onClick={closeStatsModal}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition"
            >
              ปิด
            </button>
          </div>
        </Modal>
      )}

      {/* Add Troop Modal */}
      {showAddTroopModal && (
        <Modal onClose={() => setShowAddTroopModal(false)}>
          <ModalHeader title="เพิ่มกองใหม่" onClose={() => setShowAddTroopModal(false)} />
          <div className="px-6 py-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ชื่อกอง
                </label>
                <input
                  className={INPUT_CLS}
                  placeholder="ชื่อกอง (เช่น กองที่ 1)"
                  value={troopForm.name}
                  onChange={(e) => setTroopForm((f) => ({ ...f, name: e.target.value }))}
                  // FIX: Enter to submit
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && troopForm.name && !addTroopMutation.isLoading)
                      addTroopMutation.mutate()
                  }}
                  autoFocus
                />
              </div>
            </div>
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => addTroopMutation.mutate()}
              disabled={!troopForm.name || addTroopMutation.isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
            >
              {addTroopMutation.isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button
              onClick={() => setShowAddTroopModal(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition"
            >
              ยกเลิก
            </button>
          </div>
        </Modal>
      )}

      {/* Assign Scout Modal */}
      {showAssignModal && (
        <Modal
          onClose={() => {
            setShowAssignModal(false)
          }}
        >
          <ModalHeader
            title={`จัดลูกเสือเข้าหมู่ (${unassignedCount} คน)`}
            onClose={() => setShowAssignModal(false)}
          />
          <div className="px-6 py-5 space-y-4">
            <div className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <span className="text-xs text-blue-600 dark:text-blue-400">
                ระบบจะไม่อนุญาตให้จัดลูกเสือชาย-หญิงอยู่ในหมู่เดียวกัน
              </span>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                ลูกเสือที่ยังไม่ได้จัดหมู่
              </p>
              {unassignedScouts.length === 0 ? (
                <div className="text-center py-8 rounded-xl bg-gray-50 dark:bg-scout-800/40 border border-dashed border-gray-200 dark:border-scout-600">
                  <Star size={28} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">ลูกเสือทุกคนได้รับการจัดหมู่แล้ว</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {unassignedScouts.map((scout) => {
                    const compatibleSquads = allSquads.filter((sq) => {
                      if (!scout.gender) return true
                      const scoutsInSq =
                        scouts?.filter((s) => s.squadId === sq.id && s.gender) || []
                      if (scoutsInSq.length === 0) return true
                      return scoutsInSq[0].gender === scout.gender
                    })

                    return (
                      <div
                        key={scout.id}
                        className="rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600 p-3 space-y-2"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                              ${
                                scout.gender === 'ชาย'
                                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40'
                                  : scout.gender === 'หญิง'
                                    ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/40'
                                    : 'bg-amber-100 text-amber-600'
                              }`}
                          >
                            {scout.firstName?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {scout.firstName} {scout.lastName}
                              {scout.nickname && (
                                <span className="text-gray-400 font-normal ml-1">
                                  ({scout.nickname})
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-2">
                              {scout.gender && (
                                <span
                                  className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${scout.gender === 'ชาย' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}
                                >
                                  {scout.gender}
                                </span>
                              )}
                              {scout.school && (
                                <span className="text-xs text-gray-400 truncate">
                                  {scout.school}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <select
                            className={INPUT_CLS + ' flex-1'}
                            defaultValue=""
                            id={`squad-select-${scout.id}`}
                          >
                            <option value="">-- เลือกหมู่ --</option>
                            {compatibleSquads.map((sq) => (
                              <option key={sq.id} value={sq.id}>
                                {sq.name} · กอง {sq.troopNumber} ({sq._count?.scouts || 0} คน)
                              </option>
                            ))}
                          </select>
                          <button
                            disabled={assignScoutMutation.isLoading}
                            onClick={() => handleAssignScout(scout.id)}
                            className="px-3 py-2 rounded-xl bg-scout-600 hover:bg-scout-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-semibold transition flex-shrink-0"
                          >
                            จัด
                          </button>
                        </div>
                        {compatibleSquads.length === 0 && (
                          <p className="text-xs text-red-500">
                            ไม่มีหมู่ที่รองรับเพศ{scout.gender}ได้แล้ว
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="px-6 pb-6">
            <button
              onClick={() => setShowAssignModal(false)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition"
            >
              ปิด
            </button>
          </div>
        </Modal>
      )}

      {/* Organization Preview Modal */}
      {showOrganizeModal && organizePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowOrganizeModal(false)} />
          <div className="relative bg-white dark:bg-scout-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-scout-600">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">จัดกองอัตโนมัติ - ตัวอย่าง</h3>
              <button
                onClick={() => setShowOrganizeModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-scout-600 text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="px-6 py-5">
              <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-400">
                    <p className="font-semibold mb-1">การจัดกองอัตโนมัติจะ:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• แยกหมู่ตามเพศ (ชายอยู่กับชาย, หญิงอยู่กับหญิง)</li>
                      <li>• จัดหมู่เข้ากอง กองละ 4 หมู่</li>
                      <li>• หมู่ที่เหลือจากการจัดจะแสดงเป็นกล่องเหลือง</li>
                      <li>• ข้อมูลเดิมจะถูกแทนที่ทั้งหมด</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {organizePreview.map((troop, idx) => {
                  const col = colorOf(idx)
                  const isFull = troop.squads.length === 4
                  
                  return (
                    <div
                      key={troop.number}
                      className={`rounded-2xl border ${isFull ? 'border-gray-100 dark:border-scout-600' : 'border-yellow-200 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'} bg-white dark:bg-scout-800 overflow-hidden`}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${col.bg}`} />
                      
                      <div className="pl-5 pr-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${col.bg} flex items-center justify-center`}>
                              <span className="text-white font-bold">{troop.number}</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                กอง {troop.number}
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  troop.gender === 'ชาย' 
                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                                    : troop.gender === 'หญิง'
                                      ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400'
                                      : 'bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-400'
                                }`}>
                                  {troop.gender}
                                </span>
                                <span className={`text-xs ${isFull ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400 font-medium'}`}>
                                  {troop.squads.length}/4 หมู่
                                </span>
                              </div>
                            </div>
                          </div>
                          {!isFull && (
                            <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                              <AlertTriangle size={16} />
                              <span className="text-xs font-medium">ยังไม่เต็ม</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {troop.squads.map((squad) => (
                            <div
                              key={squad.id}
                              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600"
                            >
                              <p className="text-sm font-medium text-gray-800 dark:text-white">
                                {squad.name}
                              </p>
                            </div>
                          ))}
                          {!isFull && (
                            <div className="px-3 py-2 rounded-lg border-2 border-dashed border-yellow-300 dark:border-yellow-600 bg-yellow-100 dark:bg-yellow-900/40">
                              <p className="text-xs text-yellow-700 dark:text-yellow-400 text-center">
                                ว่าง {4 - troop.squads.length} หมู่
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Remaining squads warning */}
                {organizePreview.some(troop => troop.squads.length < 4) && (
                  <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-600">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-700 dark:text-yellow-400">
                        <p className="font-semibold mb-2">มีหมู่ที่ยังไม่ได้จัดกอง</p>
                        <p className="text-xs">คุณสามารถรองรับหมู่ที่เหลือโดยเพิ่มลงในกองที่ยังไม่เต็ม หรือยืนยันเพื่อสร้างกองใหม่</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleConfirmOrganize}
                disabled={organizing}
                className="flex-1 px-4 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
              >
                {organizing ? 'กำลังจัดกอง...' : 'ยืนยันการจัดกอง'}
              </button>
              <button
                onClick={() => setShowOrganizeModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}