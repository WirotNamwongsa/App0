import { useQuery, useMutation, useQueryClient } from 'react-query'
import React, { useState, useCallback } from 'react'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Plus, ChevronRight, Users, Building2, Star, X, TrendingUp, Search, Trash2, Zap, Settings, Edit } from 'lucide-react'

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
      <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-scout-600 text-gray-400 transition-colors">
        <X size={18} />
      </button>
    </div>
  )
}

function ConfirmDeleteModal({ item, onConfirm, onCancel }) {
  if (!item) return null
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-white dark:bg-scout-900 rounded-2xl w-full max-w-xs shadow-2xl text-center">
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
          <button onClick={() => { onConfirm(); onCancel() }} className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all">
            ลบเลย
          </button>
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-scout-800 text-gray-600 dark:text-scout-300 hover:bg-gray-200 dark:hover:bg-scout-700 transition-all">
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
  const [confirmDel, setConfirmDel] = useState(null)
  const [showOrganizeModal, setShowOrganizeModal] = useState(false)
  const [organizePreview, setOrganizePreview] = useState(null)
  const [organizing, setOrganizing] = useState(false)
  const [showMaxSquadsModal, setShowMaxSquadsModal] = useState(false)
  const [maxSquadsForm, setMaxSquadsForm] = useState({ maxSquads: '4' })
  const [troopMaxSquads, setTroopMaxSquads] = useState({})
  const [showEditTroopModal, setShowEditTroopModal] = useState(false)
  const [editTroopForm, setEditTroopForm] = useState({ name: '' })
  const [showEditSquadModal, setShowEditSquadModal] = useState(false)
  const [editSquadForm, setEditSquadForm] = useState({ name: '', number: '' })
  const [editingTroop, setEditingTroop] = useState(null)
  const [editingSquad, setEditingSquad] = useState(null)
  const [moveTargets, setMoveTargets] = useState({})
  

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
    ({ troopId }) => {
      const troop = camp?.troops?.find(t => t.id === troopId)
      const currentSquads = troop?.squads || []
      const maxSquads = troop?.maxSquads || 4
      if (currentSquads.length >= maxSquads) {
        throw new Error(`ไม่สามารถสร้างหมู่ได้ เนื่องจากกองนี้มีหมู่ครบ ${maxSquads} หมู่แล้ว`)
      }
      const nextNumber = Math.max(...currentSquads.map(s => s.number || 0), 0) + 1
      return api.post(`/camps/${user.campId}/troops/${troopId}/squads`, { name: squadForm.name, number: nextNumber })
    },
    {
      onSuccess: () => { qc.invalidateQueries('camp-my'); setShowAddSquad(null); setSquadForm({ name: '', number: '' }); toast.success('เพิ่มหมู่สำเร็จ') },
      onError: (err) => toast.error(err?.response?.data?.message || err.message || 'เพิ่มหมู่ไม่สำเร็จ'),
    },
  )

  const addTroopMutation = useMutation(
    () => api.post(`/camps/${user.campId}/troops`, { name: troopForm.name, number: (camp?.troops?.length || 0) + 1 }),
    {
      onSuccess: () => { qc.invalidateQueries('camp-my'); setShowAddTroopModal(false); setTroopForm({ name: '' }); toast.success('เพิ่มกองสำเร็จ') },
      onError: (err) => toast.error(err?.response?.data?.message || 'เพิ่มกองไม่สำเร็จ'),
    },
  )

  const deleteTroopMutation = useMutation(
    (troopId) => api.delete(`/camps/${user.campId}/troops/${troopId}`),
    {
      onSuccess: () => { qc.invalidateQueries('camp-my'); qc.invalidateQueries('camp-scouts'); toast.success('ลบกองสำเร็จ') },
      onError: (err) => toast.error(err?.response?.data?.message || 'ลบกองไม่สำเร็จ'),
    },
  )

  const assignScoutMutation = useMutation(
    ({ scoutId, squadId }) => api.patch(`/camps/scouts/${scoutId}/move`, { squadId }),
    {
      onSuccess: () => { qc.invalidateQueries('camp-scouts'); qc.invalidateQueries('camp-my') },
      onError: (err) => toast.error(err?.response?.data?.message || 'จัดหมู่ไม่สำเร็จ'),
    },
  )

  const updateMaxSquadsMutation = useMutation(
    ({ troopId, maxSquads }) => api.patch(`/camps/${user.campId}/troops/${troopId}/max-squads`, { maxSquads }),
    {
      onSuccess: () => { qc.invalidateQueries('camp-my'); setShowMaxSquadsModal(false); setMaxSquadsForm({ maxSquads: '4' }); setTroopMaxSquads({}); toast.success('ตั้งค่าจำนวนหมู่สูงสุดสำเร็จ') },
      onError: (err) => toast.error(err?.response?.data?.message || 'ตั้งค่าจำนวนหมู่สูงสุดไม่สำเร็จ'),
    },
  )

  const updateTroopMutation = useMutation(
    ({ troopId, name }) => api.patch(`/camps/${user.campId}/troops/${troopId}`, { name }),
    {
      onSuccess: () => { qc.invalidateQueries('camp-my'); setShowEditTroopModal(false); setEditTroopForm({ name: '' }); setEditingTroop(null); toast.success('แก้ไขชื่อกองสำเร็จ') },
      onError: (err) => toast.error(err?.response?.data?.message || 'แก้ไขชื่อกองไม่สำเร็จ'),
    },
  )

  const updateSquadMutation = useMutation(
    ({ squadId, name, number }) => api.patch(`/camps/${user.campId}/squads/${squadId}`, { name, number }),
    {
      onSuccess: () => { qc.invalidateQueries('camp-my'); setShowEditSquadModal(false); setEditSquadForm({ name: '', number: '' }); setEditingSquad(null); toast.success('แก้ไขหมู่สำเร็จ') },
      onError: (err) => toast.error(err?.response?.data?.message || 'แก้ไขหมู่ไม่สำเร็จ'),
    },
  )

  // ── Derived state ────────────────────────────────────────────────────────────
  const totalTroops = camp?.troops?.length || 0
  const totalSquads = camp?.troops?.reduce((sum, t) => sum + (t.squads?.length || 0), 0) || 0
  const totalScouts = camp?.troops?.reduce((sum, t) => sum + (t.squads?.reduce((s2, sq) => s2 + (sq._count?.scouts || 0), 0) || 0), 0) || 0
  const unassignedScouts = scouts?.filter((s) => !s.squadId) || []
  const unassignedCount = unassignedScouts.length
  const allSquads = camp?.troops?.flatMap((troop) => (troop.squads || []).map((squad) => ({ ...squad, troopNumber: troop.number }))) || []

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleToggleExpand = useCallback((troopId) => setExpanded((e) => ({ ...e, [troopId]: !e[troopId] })), [])

  const handleAssignScout = useCallback((scoutId) => {
    const sel = document.getElementById(`squad-select-${scoutId}`)
   
    if (!sel?.value) return toast.error('กรุณาเลือกหมู่ก่อน')
    assignScoutMutation.mutate({ scoutId, squadId: sel.value })
  }, [assignScoutMutation])

  const closeStatsModal = useCallback(() => { setShowStatsModal(null); setSearchQuery('') }, [])

  // ── Auto Organize Logic ───────────────────────────────────────────────────────
  const handleAutoOrganize = useCallback(() => {
    if (!scouts || scouts.length === 0) { toast.error('ไม่มีลูกเสือในค่าย'); return }

    const allExistingSquads = camp?.troops?.flatMap((t) => t.squads || []) || []

    // ── Step 0: หาหมู่ที่ควรรวมกัน ──
    const toMerge = []
    const squadGroupMap = {}

    allExistingSquads.forEach((sq) => {
      const members = scouts.filter((s) => s.squadId === sq.id)
      if (members.length === 0) return
      const countMap = {}
      members.forEach((s) => {
        const key = `${s.school || 'ไม่ระบุ'}__${s.gender || 'ไม่ระบุ'}`
        countMap[key] = (countMap[key] || 0) + 1
      })
      const majorityKey = Object.entries(countMap).sort((a, b) => b[1] - a[1])[0][0]
      if (!squadGroupMap[majorityKey]) squadGroupMap[majorityKey] = []
      squadGroupMap[majorityKey].push({ squad: sq, members, count: members.length })
    })

    Object.values(squadGroupMap).forEach((squads) => {
      if (squads.length <= 1) return
      squads.sort((a, b) => b.count - a.count)
      for (let i = 1; i < squads.length; i++) {
        squads[i].members.forEach((s) => {
          toMerge.push({
            ...s,
            fromSquadName: squads[i].squad.name,
            toSquadName: squads[0].squad.name,
            toSquadId: squads[0].squad.id,
            mergeNow: true, // default = รวมเลย
          })
        })
      }
    })

    // ── Step 1: หาคนที่ school+gender ไม่ตรง majority ──
    const toReassign = []
    allExistingSquads.forEach((squad) => {
      const members = scouts.filter((s) => s.squadId === squad.id)
      if (members.length === 0) return
      const countMap = {}
      members.forEach((s) => {
        const key = `${s.school || 'ไม่ระบุ'}__${s.gender || 'ไม่ระบุ'}`
        countMap[key] = (countMap[key] || 0) + 1
      })
      const majorityKey = Object.entries(countMap).sort((a, b) => b[1] - a[1])[0][0]
      const [majoritySchool, majorityGender] = majorityKey.split('__')
      members.forEach((s) => {
        const school = s.school || 'ไม่ระบุ'
        const gender = s.gender || 'ไม่ระบุ'
        if (school !== majoritySchool || gender !== majorityGender) toReassign.push(s)
      })
    })

    // ── Step 2: รวมคนที่ต้องจัดใหม่ ──
    const unassigned = scouts.filter((s) => !s.squadId)
    const needsAssignment = [...unassigned, ...toReassign, ...toMerge].filter(
      (s, idx, arr) => arr.findIndex((x) => x.id === s.id) === idx
    )

    const groupMap = {}
    needsAssignment.forEach((scout) => {
      const school = scout.school || 'ไม่ระบุ'
      const gender = scout.gender || 'ไม่ระบุ'
      const key = `${school}__${gender}`
      if (!groupMap[key]) groupMap[key] = { school, gender, scouts: [] }
      groupMap[key].scouts.push(scout)
    })

    // ── Step 3: จัดแต่ละกลุ่ม ──
    const assignments = []
    const newSquads = []
    const pendingSquads = []

    const squadCountSnapshot = {}
    allExistingSquads.forEach((sq) => {
      squadCountSnapshot[sq.id] = scouts.filter(
        (s) => s.squadId === sq.id
          && !toReassign.find((e) => e.id === s.id)
          && !toMerge.find((e) => e.id === s.id)
      ).length
    })

    Object.values(groupMap).forEach(({ school, gender, scouts: groupScouts }) => {
      let remaining = [...groupScouts]

      const matchingSquads = allExistingSquads.filter((sq) => {
        const members = scouts.filter(
          (s) => s.squadId === sq.id
            && !toReassign.find((e) => e.id === s.id)
            && !toMerge.find((e) => e.id === s.id)
        )
        if (members.length === 0) return false
        const sqSchool = members[0]?.school || 'ไม่ระบุ'
        const sqGender = members[0]?.gender || 'ไม่ระบุ'
        return sqSchool === school && sqGender === gender && (squadCountSnapshot[sq.id] || 0) < 8
      })

      for (const sq of matchingSquads) {
        if (remaining.length === 0) break
        const slots = 8 - (squadCountSnapshot[sq.id] || 0)
        const toAssign = remaining.splice(0, slots)
        toAssign.forEach((s) => {
          assignments.push({ scoutId: s.id, squadId: sq.id })
          squadCountSnapshot[sq.id] = (squadCountSnapshot[sq.id] || 0) + 1
        })
      }

      while (remaining.length >= 8) {
        const chunk = remaining.splice(0, 8)
        newSquads.push({ school, gender, scoutIds: chunk.map((s) => s.id), memberCount: chunk.length })
      }

      if (remaining.length > 0) {
        pendingSquads.push({ school, gender, scoutIds: remaining.map((s) => s.id), memberCount: remaining.length, createNow: false })
      }
    })

    if (toReassign.length === 0 && toMerge.length === 0 && assignments.length === 0 && newSquads.length === 0 && pendingSquads.length === 0) {
      toast.success('ทุกหมู่จัดเรียบร้อยแล้ว ไม่มีอะไรต้องแก้ไข')
      return
    }

    setOrganizePreview({ toReassign, toMerge, assignments, newSquads, pendingSquads })
    setShowOrganizeModal(true)
  }, [scouts, camp])

  const handleConfirmOrganize = useCallback(async () => {
    if (!organizePreview) return
    setOrganizing(true)

    try {
      const { toReassign, toMerge, assignments, newSquads, pendingSquads } = organizePreview

      // Step 1: ย้ายคนที่ไม่ตรง majority ออกก่อน
      for (const scout of toReassign) {
        await assignScoutMutation.mutateAsync({ scoutId: scout.id, squadId: null })
      }

      // Step 2: ย้ายเฉพาะคนที่เลือก "รวมเลย"
      for (const scout of toMerge.filter(s => s.mergeNow)) {
        await assignScoutMutation.mutateAsync({ scoutId: scout.id, squadId: scout.toSquadId })
      }

      // Step 3: เติมเข้าหมู่เดิม
      for (const { scoutId, squadId } of assignments) {
        await assignScoutMutation.mutateAsync({ scoutId, squadId })
      }

      // Step 4: สร้างหมู่ใหม่
      const squadsToCreate = [...newSquads, ...pendingSquads.filter((p) => p.createNow)]
      if (squadsToCreate.length > 0) {
        await api.post(`/camps/${user.campId}/organize-squads`, { newSquads: squadsToCreate })
      }

      qc.invalidateQueries('camp-my')
      qc.invalidateQueries('camp-scouts')
      setShowOrganizeModal(false)
      setOrganizePreview(null)
      toast.success('จัดหมู่สำเร็จ')
    } catch (err) {
      toast.error('จัดหมู่ไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setOrganizing(false)
    }
  }, [organizePreview, assignScoutMutation, user, qc])

  const handleSetMaxSquads = useCallback((troopId) => {
    const troop = camp?.troops?.find(t => t.id === troopId)
    if (troop) { setMaxSquadsForm({ maxSquads: String(troop.maxSquads || 4) }); setShowMaxSquadsModal(true); setTroopMaxSquads({ troopId }) }
  }, [camp])

  const handleSaveMaxSquads = useCallback(() => {
    if (!troopMaxSquads.troopId || !maxSquadsForm.maxSquads) return
    const troop = camp?.troops?.find(t => t.id === troopMaxSquads.troopId)
    const currentSquadCount = troop?.squads?.length || 0
    const newMaxSquads = parseInt(maxSquadsForm.maxSquads)
    if (newMaxSquads < currentSquadCount) { toast.error(`ไม่สามารถตั้งจำนวนหมู่สูงสุดน้อยกว่าจำนวนหมู่ปัจจุบันได้ (ปัจจุบันมี ${currentSquadCount} หมู่)`); return }
    updateMaxSquadsMutation.mutate({ troopId: troopMaxSquads.troopId, maxSquads: newMaxSquads })
  }, [troopMaxSquads, maxSquadsForm, updateMaxSquadsMutation, camp])

  const handleEditTroop = useCallback((troop) => { setEditTroopForm({ name: troop.name || '' }); setEditingTroop(troop); setShowEditTroopModal(true) }, [])
  const handleSaveEditTroop = useCallback(() => {
    if (!editingTroop || !editTroopForm.name.trim()) return
    updateTroopMutation.mutate({ troopId: editingTroop.id, name: editTroopForm.name.trim() })
  }, [editingTroop, editTroopForm, updateTroopMutation])

  const handleEditSquad = useCallback((squad) => { setEditSquadForm({ name: squad.name || '', number: squad.number?.toString() || '' }); setEditingSquad(squad); setShowEditSquadModal(true) }, [])
  const handleSaveEditSquad = useCallback(() => {
    if (!editingSquad || !editSquadForm.name.trim()) return
    updateSquadMutation.mutate({ squadId: editingSquad.id, name: editSquadForm.name.trim(), number: parseInt(editSquadForm.number) || editingSquad.number })
  }, [editingSquad, editSquadForm, updateSquadMutation])

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">โครงสร้างค่าย</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">จัดการกองและหมู่ในค่ายของคุณ</p>
        </div>
        <div className="flex gap-2">
          {totalSquads > 0 && (
            <button onClick={handleAutoOrganize} className="btn-secondary text-sm px-4 py-2.5 flex items-center gap-2">
              <Zap size={16} /> จัดกองอัตโนมัติ
            </button>
          )}
          {unassignedCount > 0 && (
            <button onClick={() => setShowAssignModal(true)} className="btn-secondary text-sm px-4 py-2.5 flex items-center gap-2">
              <Users size={16} /> จัดหมู่
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{unassignedCount}</span>
            </button>
          )}
          <button onClick={() => setShowAddTroopModal(true)} className="btn-primary text-sm px-4 py-2.5">
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
          <button key={stat.label} onClick={() => setShowStatsModal(stat.type)} className="group rounded-2xl border border-gray-100 dark:border-scout-600 bg-white dark:bg-scout-800 px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-scout-100 dark:bg-scout-900/40 text-scout-600 dark:text-scout-400 flex items-center justify-center flex-shrink-0">{stat.icon}</div>
            <div className="flex-1 text-left">
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
            </div>
            <TrendingUp size={14} className="text-gray-400 group-hover:text-scout-500 transition-colors" />
          </button>
        ))}
      </div>

      {/* Unassigned banner */}
      {unassignedCount > 0 && (
        <div className="mb-5 flex items-center justify-between px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <Users size={16} />
            <span>มีลูกเสือ <strong>{unassignedCount} คน</strong> ที่ยังไม่ได้จัดหมู่</span>
          </div>
          <button onClick={() => setShowAssignModal(true)} className="text-xs font-semibold text-amber-700 dark:text-amber-400 underline underline-offset-2">จัดหมู่เลย</button>
        </div>
      )}

      {/* Troops list */}
      <div className="space-y-4">
        {camp?.troops?.map((troop, idx) => {
          const col = colorOf(idx)
          const troopScouts = troop.squads?.reduce((s, sq) => s + (sq._count?.scouts || 0), 0) || 0

          return (
            <div key={troop.id} className="relative rounded-2xl border border-gray-100 dark:border-scout-600 bg-white dark:bg-scout-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${col.bg}`} />
              <div className="pl-5 pr-5 py-5">
                <div className="flex items-center justify-between">
                  <button onClick={() => handleToggleExpand(troop.id)} className="flex-1 flex items-center gap-4 text-left">
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
                  </button>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => handleSetMaxSquads(troop.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all" title="ตั้งค่าจำนวนหมู่สูงสุด"><Edit size={12} /></button>
                    <button onClick={() => handleEditTroop(troop)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all" title="แก้ไขชื่อกอง"><Settings size={12} /></button>
                    <button onClick={() => setConfirmDel({ label: `กอง "${troop.name}"`, onConfirm: () => deleteTroopMutation.mutate(troop.id) })} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><Trash2 size={14} /></button>
                    <button onClick={() => handleToggleExpand(troop.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-scout-700 transition-all">
                      <ChevronRight size={20} className={`transition-transform duration-200 ${expanded[troop.id] ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>

                {expanded[troop.id] && (
                  <div className="mt-4 space-y-3 border-t border-gray-100 dark:border-scout-600 pt-4">
                    <div className="space-y-2">
                      {troop.squads?.map((squad) => {
                        const leader = getLeader(squad)
                        const school = squad.scouts?.[0]?.school || null
                        return (
                          <div key={squad.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:shadow-sm transition-all cursor-pointer">
                            <button onClick={() => setViewingSquad(squad)} className="flex-1 flex items-center gap-3 text-left">
                              <div className="w-8 h-8 rounded-lg bg-scout-100 dark:bg-scout-900/40 flex items-center justify-center"><Users size={14} className="text-scout-500" /></div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">{squad.name}</p>
                                <p className="text-xs text-gray-400">{squad._count?.scouts || 0} คน{leader && ` · ผู้กำกับ: ${leader.name}`}</p>
                              </div>
                            </button>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium ${school ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400'}`}>{school || 'ไม่ระบุสถานศึกษา'}</span>
                              <button onClick={() => handleEditSquad(squad)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all" title="แก้ไขหมู่"><Settings size={13} /></button>
                              <button onClick={() => setConfirmDel({ label: `หมู่ "${squad.name}"`, onConfirm: () => { toast.success('ลบหมู่สำเร็จ') } })} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" title="ลบหมู่"><Trash2 size={13} /></button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {showAddSquad === troop.id ? (
                      <div className="rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600 p-4">
                        <div className="space-y-3">
                          <input className={INPUT_CLS} placeholder="ชื่อหมู่ (เช่น ลูกเสือสามัญ)" value={squadForm.name} onChange={(e) => setSquadForm((f) => ({ ...f, name: e.target.value }))} />
                          <div className="flex gap-2">
                            <button onClick={() => addSquadMutation.mutate({ troopId: troop.id })} disabled={addSquadMutation.isLoading || !squadForm.name} className="flex-1 px-4 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition">
                              {addSquadMutation.isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                            <button onClick={() => setShowAddSquad(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition">ยกเลิก</button>
                          </div>
                        </div>
                      </div>
                    ) : troop.squads?.length >= (troop.maxSquads || 4) ? (
                      <div className="text-center py-3 rounded-xl bg-gray-50 dark:bg-scout-800/40 border border-dashed border-gray-200 dark:border-scout-600">
                        <p className="text-xs text-gray-400">สร้างได้สูงสุด {troop.maxSquads || 4} หมู่ต่อกอง</p>
                      </div>
                    ) : (
                      <button onClick={() => setShowAddSquad(troop.id)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition active:scale-95">
                        <Plus size={16} /> เพิ่มหมู่ ({troop.squads?.length || 0}/{troop.maxSquads || 4})
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {(!camp?.troops || camp.troops.length === 0) && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-scout-50 dark:bg-scout-900/30 flex items-center justify-center mb-4"><Building2 size={36} className="text-scout-400" /></div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">ยังไม่มีกองในค่าย</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">ติดต่อผู้ดูแลระบบเพื่อสร้างกองแรก</p>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <ConfirmDeleteModal item={confirmDel} onConfirm={() => confirmDel?.onConfirm()} onCancel={() => setConfirmDel(null)} />

      {/* Squad Detail Modal */}
      {viewingSquad && (
        <Modal onClose={() => setViewingSquad(null)}>
          <ModalHeader title={`หมู่ ${viewingSquad.number} · ${viewingSquad.name}`} onClose={() => setViewingSquad(null)} />
          <div className="px-6 py-5">
            {(() => {
              const leader = getLeader(viewingSquad)
              return (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-scout-50 dark:bg-scout-900/30 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-scout-100 dark:bg-scout-900/40 flex items-center justify-center"><Users size={18} className="text-scout-500" /></div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{viewingSquad._count?.scouts || 0} คน</p>
                    {leader && <p className="text-xs text-gray-400">ผู้กำกับ: {leader.name}</p>}
                  </div>
                </div>
              )
            })()}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">รายชื่อลูกเสือ</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-scout-100 dark:bg-scout-900/40 text-scout-700 dark:text-scout-300">{viewingSquad._count?.scouts || 0} คน</span>
            </div>
            {loadingSquadScouts ? (
              <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-scout-400 border-t-transparent rounded-full animate-spin" /></div>
            ) : squadScouts.length === 0 ? (
              <div className="text-center py-8 rounded-xl bg-gray-50 dark:bg-scout-800/40 border border-dashed border-gray-200 dark:border-scout-600">
                <Users size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">ไม่มีลูกเสือในหมู่นี้</p>
              </div>
            ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
  {squadScouts.map((scout) => (
    <div key={scout.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600">
      <div className="w-8 h-8 rounded-full bg-scout-100 dark:bg-scout-900/40 flex items-center justify-center text-xs font-bold text-scout-600">
        {scout.firstName?.[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {scout.firstName} {scout.lastName}
          {scout.nickname && <span className="text-gray-400 font-normal ml-1">({scout.nickname})</span>}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
            scout.gender === 'ชาย' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
            : scout.gender === 'หญิง' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-400'
          }`}>{scout.gender || 'ไม่ระบุ'}</span>
          <p className={`text-xs ${scout.school ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400'}`}>
            {scout.school || 'ไม่ระบุสถานศึกษา'}
          </p>
        </div>
      </div>

      {/* ── ย้ายหมู่ ── */}
      <select
        className="text-xs border border-gray-200 dark:border-scout-600 rounded-lg px-2 py-1.5 bg-white dark:bg-scout-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-scout-400"
        value={moveTargets[scout.id] || ''}
        onChange={e => setMoveTargets(prev => ({ ...prev, [scout.id]: e.target.value }))}
      >
        <option value="">ย้ายไป...</option>
        {allSquads
         .filter(sq => {
    // กรองหมู่ตัวเองออก
    if (sq.id === viewingSquad?.id) return false

    // ดึงข้อมูลสมาชิกในหมู่นั้น
    const scoutsInSq = scouts?.filter(s => s.squadId === sq.id) || []

    // หมู่ว่าง → รับได้เลย
    if (scoutsInSq.length === 0) return true

    // เช็คเพศ
    if (scout.gender) {
      const hasGender = scoutsInSq.filter(s => s.gender)
      if (hasGender.length > 0 && hasGender[0].gender !== scout.gender) return false
    }

    // เช็คโรงเรียน
    if (scout.school) {
      const squadSchool = scoutsInSq.find(s => s.school)?.school
      if (squadSchool && squadSchool !== scout.school) return false
    }

    return true
  })
  .map(sq => (
    <option key={sq.id} value={sq.id}>
      กอง {sq.troopNumber} · {sq.name}
    </option>
  ))
}
      </select>
      <button
        onClick={() => {
          if (!moveTargets[scout.id]) return toast.error('กรุณาเลือกหมู่ก่อน')
          assignScoutMutation.mutate(
            { scoutId: scout.id, squadId: moveTargets[scout.id] },
            { onSuccess: () => {
                setMoveTargets(prev => ({ ...prev, [scout.id]: '' }))
                qc.invalidateQueries(['squad-scouts', viewingSquad?.id])
              }
            }
          )
        }}
        disabled={assignScoutMutation.isLoading || !moveTargets[scout.id]}
        className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-scout-600 hover:bg-scout-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-semibold transition"
      >
        ย้าย
      </button>
    </div>
  ))}
</div>
            )}
          </div>
          <div className="px-6 pb-6">
            <button onClick={() => setViewingSquad(null)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition">ปิด</button>
          </div>
        </Modal>
      )}

      {/* Stats Modal */}
      {showStatsModal && (
        <Modal onClose={closeStatsModal}>
          <ModalHeader title={showStatsModal === 'troops' ? 'รายละเอียดกอง' : showStatsModal === 'squads' ? 'รายละเอียดหมู่' : 'รายละเอียดลูกเสือ'} onClose={closeStatsModal} />
          <div className="px-6 py-5">
            {showStatsModal === 'scouts' && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-scout-600">{scouts?.length || 0}</p>
                  <p className="text-sm text-gray-500">ลูกเสือทั้งหมดในค่าย</p>
                  {unassignedCount > 0 && <p className="text-xs text-amber-500 mt-1">ยังไม่ได้จัดหมู่ {unassignedCount} คน</p>}
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="ค้นหาชื่อ, สถานศึกษา..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 bg-gray-50 dark:bg-scout-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-scout-400 transition text-sm" />
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {scouts?.filter((scout) => !searchQuery || `${scout.firstName} ${scout.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) || scout.school?.toLowerCase().includes(searchQuery.toLowerCase()) || scout.nickname?.toLowerCase().includes(searchQuery.toLowerCase())).map((scout) => {
                    let col = null
                    camp?.troops?.forEach((troop, troopIdx) => { troop.squads?.forEach((squad) => { if (scout.squadId === squad.id) col = colorOf(troopIdx) }) })
                    return (
                      <div key={scout.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${col?.bg || 'from-gray-400 to-gray-500'} flex items-center justify-center`}><Star size={16} className="text-white" /></div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">{scout.firstName} {scout.lastName}{scout.nickname && <span className="text-sm text-gray-400 ml-2">({scout.nickname})</span>}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${scout.gender === 'ชาย' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : scout.gender === 'หญิง' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-400'}`}>{scout.gender || 'ไม่ระบุ'}</span>
                            {scout.school && <p className="text-xs text-blue-500 dark:text-blue-400">{scout.school}</p>}
                            {!scout.squadId && <span className="text-xs text-amber-500 font-medium">ยังไม่ได้จัดหมู่</span>}
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
            <button onClick={closeStatsModal} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition">ปิด</button>
          </div>
        </Modal>
      )}

      {/* Add Troop Modal */}
      {showAddTroopModal && (
        <Modal onClose={() => setShowAddTroopModal(false)}>
          <ModalHeader title="เพิ่มกองใหม่" onClose={() => setShowAddTroopModal(false)} />
          <div className="px-6 py-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ชื่อกอง</label>
            <input className={INPUT_CLS} placeholder="ชื่อกอง (เช่น กองที่ 1)" value={troopForm.name} onChange={(e) => setTroopForm((f) => ({ ...f, name: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter' && troopForm.name && !addTroopMutation.isLoading) addTroopMutation.mutate() }} autoFocus />
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={() => addTroopMutation.mutate()} disabled={!troopForm.name || addTroopMutation.isLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition">{addTroopMutation.isLoading ? 'กำลังบันทึก...' : 'บันทึก'}</button>
            <button onClick={() => setShowAddTroopModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition">ยกเลิก</button>
          </div>
        </Modal>
      )}

      {/* Assign Scout Modal */}
      {showAssignModal && (
        <Modal onClose={() => setShowAssignModal(false)}>
          <ModalHeader title={`จัดลูกเสือเข้าหมู่ (${unassignedCount} คน)`} onClose={() => setShowAssignModal(false)} />
          <div className="px-6 py-5 space-y-4">
            <div className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <span className="text-xs text-blue-600 dark:text-blue-400">ระบบจะไม่อนุญาตให้จัดลูกเสือชาย-หญิงอยู่ในหมู่เดียวกัน</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">ลูกเสือที่ยังไม่ได้จัดหมู่</p>
              {unassignedScouts.length === 0 ? (
                <div className="text-center py-8 rounded-xl bg-gray-50 dark:bg-scout-800/40 border border-dashed border-gray-200 dark:border-scout-600">
                  <Star size={28} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">ลูกเสือทุกคนได้รับการจัดหมู่แล้ว</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {unassignedScouts.map((scout) => {
                    const compatibleSquads = allSquads.filter((sq) => {
                      const scoutsInSq = scouts?.filter((s) => s.squadId === sq.id) || []

                      // หมู่ว่าง → รับได้เลย
                      if (scoutsInSq.length === 0) return true

                      // เช็คเพศ
                      const hasGender = scoutsInSq.filter(s => s.gender)
                      if (scout.gender && hasGender.length > 0) {
                        if (hasGender[0].gender !== scout.gender) return false
                      }

                      // เช็ค school
                      if (scout.school) {
                        const squadSchool = scoutsInSq.find(s => s.school)?.school
                        if (squadSchool && squadSchool !== scout.school) return false
                      }

                      return true
                    })
                    return (
                      <div key={scout.id} className="rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600 p-3 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${scout.gender === 'ชาย' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' : scout.gender === 'หญิง' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/40' : 'bg-amber-100 text-amber-600'}`}>{scout.firstName?.[0]}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{scout.firstName} {scout.lastName}{scout.nickname && <span className="text-gray-400 font-normal ml-1">({scout.nickname})</span>}</p>
                            <div className="flex items-center gap-2">
                              {scout.gender && <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${scout.gender === 'ชาย' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>{scout.gender}</span>}
                              {scout.school && <span className="text-xs text-gray-400 truncate">{scout.school}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <select className={INPUT_CLS + ' flex-1'} defaultValue="" id={`squad-select-${scout.id}`}>
                            <option value="">-- เลือกหมู่ --</option>
                            {compatibleSquads.map((sq) => (<option key={sq.id} value={sq.id}>{sq.name} · กอง {sq.troopNumber} ({sq._count?.scouts || 0} คน)</option>))}
                          </select>
                          <button disabled={assignScoutMutation.isLoading} onClick={() => handleAssignScout(scout.id)} className="px-3 py-2 rounded-xl bg-scout-600 hover:bg-scout-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-semibold transition flex-shrink-0">จัด</button>
                        </div>
                        {compatibleSquads.length === 0 && <p className="text-xs text-red-500">ไม่มีหมู่ที่รองรับเพศ{scout.gender}ได้แล้ว</p>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="px-6 pb-6">
            <button onClick={() => setShowAssignModal(false)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition">ปิด</button>
          </div>
        </Modal>
      )}

      {/* Max Squads Modal */}
      {showMaxSquadsModal && (
        <Modal onClose={() => setShowMaxSquadsModal(false)}>
          <ModalHeader title="ตั้งค่าจำนวนหมู่สูงสุด" onClose={() => setShowMaxSquadsModal(false)} />
          <div className="px-6 py-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">จำนวนหมู่สูงสุดต่อกอง</label>
            <input className={INPUT_CLS} type="number" min="1" max="20" placeholder="กรอกจำนวนหมู่สูงสุด" value={maxSquadsForm.maxSquads} onChange={(e) => setMaxSquadsForm((f) => ({ ...f, maxSquads: e.target.value }))} autoFocus />
            <p className="text-xs text-gray-400 mt-2">กำหนดจำนวนหมู่สูงสุดที่สามารถสร้างได้ในกองนี้</p>
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={handleSaveMaxSquads} disabled={!maxSquadsForm.maxSquads || updateMaxSquadsMutation.isLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition">{updateMaxSquadsMutation.isLoading ? 'กำลังบันทึก...' : 'บันทึก'}</button>
            <button onClick={() => setShowMaxSquadsModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition">ยกเลิก</button>
          </div>
        </Modal>
      )}

      {/* Edit Troop Modal */}
      {showEditTroopModal && (
        <Modal onClose={() => setShowEditTroopModal(false)}>
          <ModalHeader title="แก้ไขชื่อกอง" onClose={() => setShowEditTroopModal(false)} />
          <div className="px-6 py-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ชื่อกอง</label>
            <input className={INPUT_CLS} placeholder="กรอกชื่อกอง" value={editTroopForm.name} onChange={(e) => setEditTroopForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={handleSaveEditTroop} disabled={!editTroopForm.name.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition">บันทึก</button>
            <button onClick={() => setShowEditTroopModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition">ยกเลิก</button>
          </div>
        </Modal>
      )}

      {/* Edit Squad Modal */}
      {showEditSquadModal && (
        <Modal onClose={() => setShowEditSquadModal(false)}>
          <ModalHeader title="แก้ไขหมู่" onClose={() => setShowEditSquadModal(false)} />
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ชื่อหมู่</label>
              <input className={INPUT_CLS} placeholder="กรอกชื่อหมู่" value={editSquadForm.name} onChange={(e) => setEditSquadForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">หมายเลขหมู่</label>
              <input className={INPUT_CLS} type="number" placeholder="กรอกหมายเลขหมู่" value={editSquadForm.number} onChange={(e) => setEditSquadForm(f => ({ ...f, number: e.target.value }))} />
            </div>
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={handleSaveEditSquad} disabled={!editSquadForm.name.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition">บันทึก</button>
            <button onClick={() => setShowEditSquadModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition">ยกเลิก</button>
          </div>
        </Modal>
      )}

      {/* Organization Preview Modal */}
      {showOrganizeModal && organizePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowOrganizeModal(false)} />
          <div className="relative bg-white dark:bg-scout-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-scout-600">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">สรุปการจัดหมู่</h3>
              <button onClick={() => setShowOrganizeModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-scout-600 text-gray-400"><X size={18} /></button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Summary strip */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3 text-center">
                  <p className="text-xl font-bold text-red-500">{organizePreview.toReassign.length + organizePreview.toMerge.length}</p>
                  <p className="text-xs text-red-400">คนที่จะย้ายออก</p>
                </div>
                <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 px-4 py-3 text-center">
                  <p className="text-xl font-bold text-green-500">{organizePreview.assignments.length}</p>
                  <p className="text-xs text-green-400">คนที่จะเติมเข้าหมู่เดิม</p>
                </div>
                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 px-4 py-3 text-center">
                  <p className="text-xl font-bold text-blue-500">{organizePreview.newSquads.length}</p>
                  <p className="text-xs text-blue-400">หมู่ใหม่ที่จะสร้าง</p>
                </div>
                <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 px-4 py-3 text-center">
                  <p className="text-xl font-bold text-yellow-500">{organizePreview.pendingSquads.length}</p>
                  <p className="text-xs text-yellow-400">กลุ่มที่รอตัดสินใจ</p>
                </div>
              </div>

              {/* ย้ายออกเพราะ school/gender ไม่ตรง */}
              {organizePreview.toReassign.length > 0 && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4">
                  <p className="font-semibold text-red-600 text-sm mb-1">🔴 จะย้ายออกจากหมู่ ({organizePreview.toReassign.length} คน)</p>
                  <p className="text-xs text-red-400 mb-2">เพราะ school/gender ไม่ตรงกับคนส่วนใหญ่ในหมู่</p>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {organizePreview.toReassign.map((s) => (
                      <p key={s.id} className="text-xs text-red-600">• {s.firstName} {s.lastName} · {s.school || 'ไม่ระบุ'} ({s.gender || 'ไม่ระบุ'})</p>
                    ))}
                  </div>
                </div>
              )}

              {/* ✅ toMerge พร้อม toggle รวมเลย/ไว้ก่อน */}
              {organizePreview.toMerge.length > 0 && (
                <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 p-4">
                  <p className="font-semibold text-orange-600 text-sm mb-1">
                    🟠 ผู้เรียนกลุ่มเดียวกันกระจายอยู่หลายหมู่ ({organizePreview.toMerge.length} คน)
                  </p>
                  <p className="text-xs text-orange-400 mb-3">เลือกว่าจะรวมเข้าหมู่เดียวกันหรือไว้ก่อน</p>
                  <div className="space-y-2">
                    {organizePreview.toMerge.map((s, i) => (
                      <div key={s.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white dark:bg-scout-800 border border-orange-200 dark:border-orange-700">
                        <div className="min-w-0 flex-1 mr-2">
                          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {s.fromSquadName} → {s.toSquadName} · {s.school || 'ไม่ระบุ'} ({s.gender || 'ไม่ระบุ'})
                          </p>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => setOrganizePreview((prev) => ({
                              ...prev,
                              toMerge: prev.toMerge.map((p, idx) => idx === i ? { ...p, mergeNow: true } : p),
                            }))}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${s.mergeNow ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-scout-700 text-gray-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/30'}`}
                          >
                            รวมเลย
                          </button>
                          <button
                            onClick={() => setOrganizePreview((prev) => ({
                              ...prev,
                              toMerge: prev.toMerge.map((p, idx) => idx === i ? { ...p, mergeNow: false } : p),
                            }))}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${!s.mergeNow ? 'bg-gray-500 text-white' : 'bg-gray-100 dark:bg-scout-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-scout-600'}`}
                          >
                            ไว้ก่อน
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* เติมเข้าหมู่เดิม */}
              {organizePreview.assignments.length > 0 && (
                <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4">
                  <p className="font-semibold text-green-600 text-sm">🟢 จะเติมเข้าหมู่เดิม ({organizePreview.assignments.length} คน)</p>
                </div>
              )}

              {/* สร้างหมู่ใหม่ */}
              {organizePreview.newSquads.length > 0 && (
                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4">
                  <p className="font-semibold text-blue-600 text-sm mb-2">🔵 จะสร้างหมู่ใหม่ ({organizePreview.newSquads.length} หมู่)</p>
                  {organizePreview.newSquads.map((sq, i) => (
                    <p key={i} className="text-xs text-blue-500">• {sq.school} ({sq.gender}) · {sq.memberCount} คน</p>
                  ))}
                </div>
              )}

              {/* Pending */}
              {organizePreview.pendingSquads.length > 0 && (
                <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-4">
                  <p className="font-semibold text-yellow-600 text-sm mb-3">🟡 กลุ่มที่ยังไม่ครบ 8 คน — เลือกว่าจะทำอะไร</p>
                  <div className="space-y-2">
                    {organizePreview.pendingSquads.map((sq, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-scout-800 border border-yellow-200 dark:border-yellow-600">
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">{sq.school} ({sq.gender})</p>
                          <p className="text-xs text-gray-400">มี {sq.memberCount} คน · รอเพิ่มอีก {8 - sq.memberCount} คน</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setOrganizePreview((prev) => ({ ...prev, pendingSquads: prev.pendingSquads.map((p, idx) => idx === i ? { ...p, createNow: true } : p) }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${sq.createNow ? 'bg-yellow-500 text-white' : 'bg-gray-100 dark:bg-scout-700 text-gray-600 dark:text-gray-300 hover:bg-yellow-100'}`}
                          >สร้างเลย</button>
                          <button
                            onClick={() => setOrganizePreview((prev) => ({ ...prev, pendingSquads: prev.pendingSquads.map((p, idx) => idx === i ? { ...p, createNow: false } : p) }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${!sq.createNow ? 'bg-gray-500 text-white' : 'bg-gray-100 dark:bg-scout-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
                          >รอก่อน</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={handleConfirmOrganize} disabled={organizing} className="flex-1 px-4 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition">
                {organizing ? 'กำลังจัดหมู่...' : 'ยืนยัน'}
              </button>
              <button onClick={() => setShowOrganizeModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}