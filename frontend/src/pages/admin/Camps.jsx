import { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, X, ChevronRight, Users, ArrowRight, Flag, Tent,
  Shield, School, Eye, Search, Hash, Pencil, MoreVertical,
  UserPlus, AlertCircle, CheckCircle2, Layers, MoveRight
} from 'lucide-react'

// ── Dropdown Menu ──────────────────────────────────────────────────────────────
function DropdownMenu({ items, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(v => !v)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-scout-700 transition-all">
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1 z-50 min-w-[160px] bg-white dark:bg-scout-900 border border-gray-100 dark:border-scout-700 rounded-xl shadow-xl overflow-hidden`} style={{ animation: 'dropIn 0.12s ease' }}>
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="h-px bg-gray-100 dark:bg-scout-700 my-1" />
            ) : (
              <button key={i} onClick={() => { item.onClick(); setOpen(false) }} className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors text-left ${item.danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-scout-800'}`}>
                {item.icon}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ── Icon Button ────────────────────────────────────────────────────────────────
function IconBtn({ icon, onClick, title, variant = 'default', size = 8 }) {
  const variants = {
    default: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-scout-700',
    blue: 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    green: 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
  }
  return (
    <button onClick={e => { e.stopPropagation(); onClick?.() }} title={title} className={`w-${size} h-${size} rounded-lg flex items-center justify-center transition-all ${variants[variant]}`}>
      {icon}
    </button>
  )
}

// ── Capacity Bar ───────────────────────────────────────────────────────────────
function CapacityBar({ current, max = 8 }) {
  const pct = Math.min((current / max) * 100, 100)
  const color = current >= max ? 'bg-emerald-500' : current >= max * 0.75 ? 'bg-amber-400' : 'bg-scout-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-scout-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${current >= max ? 'text-emerald-500' : 'text-gray-400'}`}>{current}/{max}</span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AdminCamps() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [expandedCamp, setExpandedCamp] = useState(null)
  const [expandedTroop, setExpandedTroop] = useState(null)
  const [expandedSquad, setExpandedSquad] = useState(null)
  const [expandedFloating, setExpandedFloating] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('ALL')
  const [showMaxSquadsModal, setShowMaxSquadsModal] = useState(false)
  const [maxSquadsForm, setMaxSquadsForm] = useState({ maxSquads: '4' })
  const [troopMaxSquads, setTroopMaxSquads] = useState({})
  const [selectedCampId, setSelectedCampId] = useState(null)
  const [activeCampTab, setActiveCampTab] = useState({}) // { [campId]: 'troops' | 'floating' }

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: camps = [], isLoading: campsLoading, error: campsError } = useQuery(
    'camps-full', () => api.get('/camps'),
    { refetchOnWindowFocus: true, onError: () => toast.error('ไม่สามารถโหลดข้อมูลค่ายได้') }
  )
  const { data: allScouts = [], isLoading: scoutsLoading, error: scoutsError } = useQuery(
    'all-scouts', () => api.get('/scouts'),
    { refetchOnWindowFocus: true, onError: () => toast.error('ไม่สามารถโหลดข้อมูลลูกเสือได้') }
  )

  const { data: allFloatingSquads = [] } = useQuery(
    ['floating-squads-all', camps.map(c => c.id).join(',')],
    async () => {
      if (camps.length === 0) return []
      const results = await Promise.all(
        camps.map(camp => api.get(`/camps/${camp.id}/floating-squads`).then(data => ({ campId: camp.id, squads: data })))
      )
      return results
    },
    { enabled: camps.length > 0 }
  )

  const floatingSquadsByCamp = {}
  allFloatingSquads.forEach(({ campId, squads }) => {
    floatingSquadsByCamp[campId] = squads || []
  })

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createCamp = useMutation(d => api.post('/camps', d), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); qc.invalidateQueries('camps'); closeModal(); toast.success('สร้างค่ายสำเร็จ') }
  })
  const createTroop = useMutation(d => {
    const camp = camps.find(c => c.id === d.campId)
    const nextNumber = Math.max(...(camp?.troops || []).map(t => t.number || 0), 0) + 1
    return api.post(`/camps/${d.campId}/troops`, { name: d.name, number: nextNumber })
  }, { onSuccess: () => { qc.invalidateQueries('camps-full'); closeModal(); toast.success('สร้างกองสำเร็จ') } })

  const createSquad = useMutation(d => {
    const troop = camps.flatMap(c => c.troops || []).find(t => t.id === d.troopId)
    const currentSquads = troop?.squads || []
    const maxSquads = troop?.maxSquads || 4
    if (currentSquads.length >= maxSquads) throw new Error(`กองนี้มีหมู่ครบ ${maxSquads} หมู่แล้ว`)
    const nextNumber = Math.max(...currentSquads.map(s => s.number || 0), 0) + 1
    return api.post(`/camps/${d.campId}/troops/${d.troopId}/squads`, { name: d.name, number: nextNumber })
  }, {
    onSuccess: () => { qc.invalidateQueries('camps-full'); closeModal(); toast.success('สร้างหมู่สำเร็จ') },
    onError: (e) => toast.error(e.message || 'ไม่สามารถสร้างหมู่ได้')
  })

  const createFloatingSquad = useMutation(
    (campId) => api.post(`/camps/${campId}/floating-squads`, {}),
    {
      onSuccess: (_, campId) => {
        qc.invalidateQueries('floating-squads-all')
        // auto-switch to floating tab
        setActiveCampTab(prev => ({ ...prev, [campId]: 'floating' }))
        toast.success('สร้างหมู่ลอยสำเร็จ')
      },
      onError: () => toast.error('สร้างหมู่ลอยไม่สำเร็จ')
    }
  )

  const assignFloatingSquad = useMutation(
    ({ campId, squadId, troopId }) => api.patch(`/camps/${campId}/squads/${squadId}/assign-troop`, { troopId }),
    {
      onSuccess: (_, { campId }) => {
        qc.invalidateQueries('camps-full')
        qc.invalidateQueries('floating-squads-all')
        closeModal()
        toast.success('ย้ายหมู่เข้ากองสำเร็จ')
      },
      onError: (err) => toast.error(err?.response?.data?.message || 'ย้ายหมู่ไม่สำเร็จ')
    }
  )

  const updateCamp = useMutation(d => api.patch(`/camps/${d.id}`, { name: d.name }), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); qc.invalidateQueries('camps'); closeModal(); toast.success('แก้ไขชื่อค่ายสำเร็จ') }
  })
  const deleteCamp = useMutation(id => api.delete(`/camps/${id}`), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); qc.invalidateQueries('camps'); toast.success('ลบค่ายสำเร็จ') }
  })
  const deleteSquad = useMutation(({ campId, squadId }) => api.delete(`/camps/${campId}/squads/${squadId}`), {
    onSuccess: () => {
      qc.invalidateQueries('camps-full')
      qc.invalidateQueries('floating-squads-all')
      toast.success('ลบหมู่สำเร็จ')
    }
  })
  const deleteTroop = useMutation(({ campId, troopId }) => api.delete(`/camps/${campId}/troops/${troopId}`), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); toast.success('ลบกองสำเร็จ') }
  })
  const updateTroop = useMutation(d => api.patch(`/camps/${d.campId}/troops/${d.id}`, { name: d.name }), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); closeModal(); toast.success('แก้ไขชื่อกองสำเร็จ') }
  })
  const updateSquad = useMutation(d => api.patch(`/camps/${d.campId}/squads/${d.id}`, { name: d.name }), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); closeModal(); toast.success('แก้ไขชื่อหมู่สำเร็จ') }
  })
  const moveScout = useMutation(({ scoutId, squadId }) => api.patch(`/camps/scouts/${scoutId}/move`, { squadId }), {
    onSuccess: () => {
      qc.invalidateQueries('camps-full')
      qc.invalidateQueries('all-scouts')
      qc.invalidateQueries('floating-squads-all')
      closeModal()
      toast.success('ย้ายลูกเสือสำเร็จ')
    }
  })

  const handleSetMaxSquads = useCallback((troop, campId) => {
    setMaxSquadsForm({ maxSquads: String(troop.maxSquads || 4) })
    setShowMaxSquadsModal(true)
    setTroopMaxSquads({ troopId: troop.id, campId })
  }, [])

  const handleSaveMaxSquads = useCallback(() => {
    if (!troopMaxSquads.troopId || !troopMaxSquads.campId || !maxSquadsForm.maxSquads) return
    const camp = camps.find(c => c.id === troopMaxSquads.campId)
    const troop = camp?.troops?.find(t => t.id === troopMaxSquads.troopId)
    const currentSquadCount = troop?.squads?.length || 0
    const newMax = parseInt(maxSquadsForm.maxSquads)
    if (newMax < currentSquadCount) { toast.error(`ไม่สามารถตั้งน้อยกว่าจำนวนหมู่ปัจจุบัน (${currentSquadCount} หมู่)`); return }
    api.patch(`/camps/${troopMaxSquads.campId}/troops/${troopMaxSquads.troopId}/max-squads`, { maxSquads: newMax })
      .then(() => { qc.invalidateQueries('camps-full'); setShowMaxSquadsModal(false); toast.success('ตั้งค่าสำเร็จ') })
      .catch(err => toast.error(err?.response?.data?.message || 'ตั้งค่าไม่สำเร็จ'))
  }, [troopMaxSquads, maxSquadsForm, camps, qc])

  // ── Loading / Error ──────────────────────────────────────────────────────────
  if (campsError || scoutsError) return (
    <div className="page flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4"><X size={24} className="text-red-500" /></div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">เกิดข้อผิดพลาด</h3>
        <p className="text-sm text-gray-400">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่</p>
      </div>
    </div>
  )

  if (campsLoading || scoutsLoading) return (
    <div className="page flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-scout-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  )

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function closeModal() { setModal(null) }

  function handleSubmit() {
    const d = modal.formData
    if (modal.type === 'camp') { if (d.id) updateCamp.mutate(d); else createCamp.mutate({ name: d.name }) }
    else if (modal.type === 'troop') { if (d.id) updateTroop.mutate(d); else createTroop.mutate(d) }
    else if (modal.type === 'squad') { if (d.id) updateSquad.mutate(d); else createSquad.mutate(d) }
    else if (modal.type === 'add-scout-to-squad') {
      const squadScouts = allScouts.filter(s => s.squadId === modal.squadId)
      if (squadScouts.length >= 8) { toast.error('หมู่นี้มีลูกเสือครบ 8 คนแล้ว'); return }
      if (!d.scoutId) { toast.error('กรุณาเลือกลูกเสือ'); return }
      moveScout.mutate({ scoutId: d.scoutId, squadId: modal.squadId })
    }
    else if (modal.type === 'assign-floating-squad') {
      if (!d.troopId) { toast.error('กรุณาเลือกกอง'); return }
      assignFloatingSquad.mutate({ campId: modal.campId, squadId: modal.squadId, troopId: d.troopId })
    }
    else if (modal.type === 'move') setModal(m => ({ ...m, type: 'move-confirm' }))
  }

  function confirmMove() { moveScout.mutate({ scoutId: modal.scout.id, squadId: modal.formData.squadId || null }) }

  const allSquads = camps.flatMap(c =>
    (c.troops || []).flatMap(t =>
      (t.squads || []).map(s => ({ ...s, troopName: t.name, campName: c.name }))
    )
  ).sort((a, b) => {
    if (a.campName !== b.campName) return a.campName.localeCompare(b.campName)
    if (a.troopName !== b.troopName) return a.troopName.localeCompare(b.troopName)
    return a.number - b.number
  })

  const filteredScouts = allScouts.filter(scout => {
    const searchMatch = !searchTerm ||
      `${scout.firstName} ${scout.lastName} ${scout.scoutCode || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    const schoolMatch = selectedSchool === 'ALL' || scout.school === selectedSchool
    return searchMatch && schoolMatch
  })

  const allSchools = [...new Set(allScouts.map(s => s.school).filter(Boolean))].sort()

  const getSchoolStats = (scouts) => {
    const m = {}
    scouts.forEach(s => { if (s.school) m[s.school] = (m[s.school] || 0) + 1 })
    return Object.entries(m).map(([school, count]) => ({ school, count })).sort((a, b) => b.count - a.count)
  }

  const openDetailsModal = (type, data) => {
    if (type === 'camp') {
      const campScouts = (data.troops || []).flatMap(t => (t.squads || []).flatMap(s => allScouts.filter(sc => sc.squadId === s.id)))
      setModal({ type: 'view-camp-details', camp: data, scouts: campScouts, schoolStats: getSchoolStats(campScouts) })
    } else if (type === 'troop') {
      const troopScouts = (data.squads || []).flatMap(s => allScouts.filter(sc => sc.squadId === s.id))
      setModal({ type: 'view-troop-details', troop: data, scouts: troopScouts, schoolStats: getSchoolStats(troopScouts) })
    } else if (type === 'squad') {
      const squadScouts = allScouts.filter(sc => sc.squadId === data.id)
      setModal({ type: 'view-squad-details', squad: data, scouts: squadScouts, schoolStats: getSchoolStats(squadScouts) })
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="page pb-24">
      <style>{`
        @keyframes dropIn { from { opacity: 0; transform: translateY(-6px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        .squad-card { transition: all 0.18s ease; }
        .squad-card:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .floating-card { transition: all 0.18s ease; }
        .floating-card:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-scout-900 dark:text-white">จัดการค่าย</h1>
          <p className="text-xs text-gray-400 mt-0.5">{camps.length} ค่ายย่อย · {allScouts.length} ลูกเสือ</p>
        </div>
        <button onClick={() => setModal({ type: 'camp', formData: { name: '' } })} className="btn-primary text-sm px-4 py-2.5 flex items-center gap-1.5">
          <Plus size={15} /> เพิ่มค่าย
        </button>
      </div>

      {/* ── Camp list ── */}
      <div className="space-y-2.5">
        {camps.map(camp => {
          const totalScouts = (camp.troops || []).flatMap(t => t.squads || []).reduce((s, sq) => s + (sq._count?.scouts || 0), 0)
          const isOpen = expandedCamp === camp.id
          const floatingSquads = floatingSquadsByCamp[camp.id] || []
          const hasFloating = floatingSquads.length > 0
          const activeTab = activeCampTab[camp.id] ?? 'troops'

          return (
            <div key={camp.id} className="rounded-2xl border border-gray-100 dark:border-scout-700 bg-white dark:bg-scout-800 overflow-visible shadow-sm">

              {/* Camp row */}
              <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none rounded-2xl hover:bg-gray-50 dark:hover:bg-scout-700/40" onClick={() => setExpandedCamp(isOpen ? null : camp.id)}>
                <div className="w-9 h-9 rounded-xl bg-scout-700 dark:bg-scout-900 flex items-center justify-center flex-shrink-0">
                  <Tent size={16} className="text-scout-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-scout-900 dark:text-white truncate">{camp.name}</p>
                    {hasFloating && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        {floatingSquads.length} หมู่ลอย
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{(camp.troops || []).length} กอง · {totalScouts} คน</p>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <IconBtn icon={<Eye size={14} />} onClick={() => openDetailsModal('camp', camp)} title="ดูรายละเอียด" variant="blue" />
                  <IconBtn icon={<Plus size={14} />} onClick={() => setModal({ type: 'troop', formData: { name: '', campId: camp.id } })} title="เพิ่มกอง" variant="green" />
                  <IconBtn
                    icon={<Layers size={14} />}
                    onClick={() => createFloatingSquad.mutate(camp.id)}
                    title="สร้างหมู่ลอย"
                    variant="default"
                  />
                  <DropdownMenu items={[
                    { label: 'แก้ไขชื่อค่าย', icon: <Pencil size={13} />, onClick: () => setModal({ type: 'camp', formData: { name: camp.name, id: camp.id } }) },
                    { divider: true },
                    { label: 'ลบค่าย', icon: <Trash2 size={13} />, danger: true, onClick: () => setConfirmDel({ label: `ค่าย "${camp.name}"`, onConfirm: () => deleteCamp.mutate(camp.id) }) }
                  ]} />
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-scout-700 transition-all cursor-pointer" onClick={() => setExpandedCamp(isOpen ? null : camp.id)}>
                    <ChevronRight size={15} className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-gray-100 dark:border-scout-700">

                  {/* ── Tabs ── */}
                  <div className="flex border-b border-gray-100 dark:border-scout-700">
                    <button
                      onClick={() => setActiveCampTab(prev => ({ ...prev, [camp.id]: 'troops' }))}
                      className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === 'troops'
                          ? 'text-scout-700 dark:text-white border-b-2 border-scout-500'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <Flag size={11} />
                        กอง ({(camp.troops || []).length})
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveCampTab(prev => ({ ...prev, [camp.id]: 'floating' }))}
                      className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === 'floating'
                          ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-400'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <Layers size={11} />
                        หมู่ลอย
                        {hasFloating && (
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${activeTab === 'floating'
                              ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                              : 'bg-gray-100 text-gray-500 dark:bg-scout-700 dark:text-scout-400'
                            }`}>
                            {floatingSquads.length}
                          </span>
                        )}
                      </span>
                    </button>
                  </div>

                  {/* ── Tab: กอง ── */}
                  {activeTab === 'troops' && (
                    <div>
                      {(camp.troops || []).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <Flag size={20} className="text-gray-300" />
                          <p className="text-xs text-gray-400">ยังไม่มีกอง — กด + เพื่อเพิ่มกอง</p>
                        </div>
                      ) : (camp.troops || []).map(troop => {
                        const troopOpen = expandedTroop === troop.id
                        const squadCount = (troop.squads || []).length
                        const maxSquads = troop.maxSquads || 4

                        return (
                          <div key={troop.id} className="border-b border-gray-50 dark:border-scout-700/60 last:border-0">
                            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-scout-700/30" onClick={() => setExpandedTroop(troopOpen ? null : troop.id)}>
                              <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-scout-700 flex items-center justify-center flex-shrink-0">
                                <Flag size={12} className="text-gray-500 dark:text-scout-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-scout-900 dark:text-white truncate">{troop.name}</p>
                                <p className="text-xs text-gray-400">{squadCount}/{maxSquads} หมู่</p>
                              </div>
                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <IconBtn icon={<Eye size={13} />} onClick={() => openDetailsModal('troop', troop)} title="ดูรายละเอียด" variant="blue" size={7} />
                                <IconBtn icon={<Plus size={13} />} onClick={() => setModal({ type: 'squad', formData: { name: '', troopId: troop.id, campId: camp.id } })} title="เพิ่มหมู่" variant="green" size={7} />
                                <DropdownMenu items={[
                                  { label: 'แก้ไขชื่อกอง', icon: <Pencil size={13} />, onClick: () => setModal({ type: 'troop', formData: { name: troop.name, id: troop.id, campId: camp.id } }) },
                                  { label: 'ตั้งค่าหมู่สูงสุด', icon: <Hash size={13} />, onClick: () => handleSetMaxSquads(troop, camp.id) },
                                  { divider: true },
                                  { label: 'ลบกอง', icon: <Trash2 size={13} />, danger: true, onClick: () => setConfirmDel({ label: `กอง "${troop.name}"`, onConfirm: () => deleteTroop.mutate({ campId: camp.id, troopId: troop.id }) }) }
                                ]} />
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-scout-600 transition-all cursor-pointer" onClick={() => setExpandedTroop(troopOpen ? null : troop.id)}>
                                  <ChevronRight size={13} className={`transition-transform duration-200 ${troopOpen ? 'rotate-90' : ''}`} />
                                </div>
                              </div>
                            </div>

                            {troopOpen && (
                              <div className="px-4 py-3 space-y-2 bg-gray-50/50 dark:bg-scout-900/20">
                                {(troop.squads || []).length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                                    <Shield size={18} className="text-gray-300" />
                                    <p className="text-xs text-gray-400">ยังไม่มีหมู่</p>
                                  </div>
                                ) : (troop.squads || []).sort((a, b) => a.number - b.number).map(squad => {
                                  const squadScouts = allScouts.filter(s => s.squadId === squad.id)
                                  const sqOpen = expandedSquad === squad.id
                                  const isFull = squadScouts.length >= 8

                                  return (
                                    <div key={squad.id} className="squad-card rounded-xl border border-gray-200 dark:border-scout-700 overflow-hidden bg-white dark:bg-scout-800 cursor-pointer" onClick={() => setExpandedSquad(sqOpen ? null : squad.id)}>
                                      <div className="flex items-center gap-3 px-3 py-2.5">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isFull ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-semibold text-scout-900 dark:text-white">{squad.name}</p>
                                            {isFull && <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">เต็ม</span>}
                                          </div>
                                          <CapacityBar current={squadScouts.length} max={8} />
                                        </div>
                                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                          <button onClick={() => openDetailsModal('squad', squad)} className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"><Eye size={11} /></button>
                                          <button onClick={() => setModal({ type: 'squad', formData: { name: squad.name, id: squad.id, troopId: troop.id, campId: camp.id } })} className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"><Pencil size={11} /></button>
                                          <button onClick={() => setConfirmDel({ label: `หมู่ "${squad.name}"`, onConfirm: () => deleteSquad.mutate({ campId: camp.id, squadId: squad.id }) })} className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><Trash2 size={11} /></button>
                                          <ChevronRight size={12} className={`text-gray-400 transition-transform duration-200 ml-1 ${sqOpen ? 'rotate-90' : ''}`} />
                                        </div>
                                      </div>

                                      {sqOpen && (
                                        <div className="border-t border-gray-100 dark:border-scout-700" onClick={e => e.stopPropagation()}>
                                          <div className="flex flex-col items-center justify-center px-3 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-b border-gray-100 dark:border-scout-700">
                                            {isFull ? (
                                              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 size={14} />
                                                <span className="text-xs font-medium">หมู่นี้มีลูกเสือครบ 8 คนแล้ว</span>
                                              </div>
                                            ) : (
                                              <button onClick={() => setModal({ type: 'add-scout-to-squad', squadId: squad.id, squadName: squad.name, formData: { scoutId: '' } })} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 rounded-xl shadow-sm hover:shadow-md hover:scale-105 transition-all">
                                                <UserPlus size={12} /> เพิ่มลูกเสือ ({8 - squadScouts.length} ที่ว่าง)
                                              </button>
                                            )}
                                          </div>
                                          <div className="divide-y divide-gray-50 dark:divide-scout-700/30">
                                            {squadScouts.length === 0 ? (
                                              <div className="flex flex-col items-center justify-center py-5 gap-1.5">
                                                <Users size={16} className="text-gray-300" />
                                                <p className="text-xs text-gray-400">ยังไม่มีลูกเสือในหมู่นี้</p>
                                              </div>
                                            ) : squadScouts.map(s => (
                                              <div key={s.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-scout-700/20 transition-colors group">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.gender === 'ชาย' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : s.gender === 'หญิง' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400' : 'bg-scout-100 text-scout-700 dark:bg-scout-700 dark:text-scout-300'}`}>
                                                  {s.firstName?.[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-medium text-scout-900 dark:text-white truncate">{s.firstName} {s.lastName}</p>
                                                  <p className="text-xs text-gray-400 truncate">{s.school || '-'}</p>
                                                </div>
                                                {s.gender && (
                                                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${s.gender === 'ชาย' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'}`}>
                                                    {s.gender}
                                                  </span>
                                                )}
                                                <button onClick={() => setModal({ type: 'move', scout: s, formData: { squadId: s.squadId || '' } })} className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-white bg-gradient-to-r from-scout-500 to-scout-600 px-2 py-1 rounded-lg font-medium transition-all">
                                                  <ArrowRight size={10} /> ย้าย
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
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
                  )}

                  {/* ── Tab: หมู่ลอย ── */}
                  {activeTab === 'floating' && (
                    <div className="px-4 py-3">
                      {floatingSquads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <Layers size={20} className="text-gray-300" />
                          <p className="text-xs text-gray-400">ไม่มีหมู่ลอย</p>
                          <button
                            onClick={() => createFloatingSquad.mutate(camp.id)}
                            className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 rounded-xl shadow-sm hover:shadow-md transition-all"
                          >
                            <Plus size={12} /> สร้างหมู่ลอย
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {floatingSquads.map(squad => {
                            const squadScouts = squad.scouts || []
                            const isFull = squadScouts.length >= 8
                            const fqOpen = expandedFloating === squad.id

                            return (
                              <div key={squad.id} className="floating-card rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-scout-800 overflow-hidden cursor-pointer" onClick={() => setExpandedFloating(fqOpen ? null : squad.id)}>
                                <div className="flex items-center gap-3 px-3 py-2.5">
                                  <div className="w-2 h-2 rounded-full flex-shrink-0 bg-amber-400" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-semibold text-scout-900 dark:text-white">{squad.name}</p>
                                      {isFull && <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-1.5 py-0.5 rounded-full font-medium">เต็ม</span>}
                                    </div>
                                    <CapacityBar current={squadScouts.length} max={8} />
                                  </div>
                                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                    <button
                                      onClick={() => setModal({
                                        type: 'assign-floating-squad',
                                        squadId: squad.id,
                                        squadName: squad.name,
                                        campId: camp.id,
                                        formData: { troopId: '' }
                                      })}
                                      disabled={squadScouts.length === 0}
                                      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${squadScouts.length === 0
                                          ? 'text-gray-400 bg-gray-100 dark:bg-scout-700 dark:text-scout-500 cursor-not-allowed'
                                          : 'text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-md'
                                        }`}
                                    >
                                      <MoveRight size={11} /> ย้ายเข้ากอง
                                    </button>
                                    <button
                                      onClick={() => setConfirmDel({ label: `หมู่ "${squad.name}"`, onConfirm: () => deleteSquad.mutate({ campId: camp.id, squadId: squad.id }) })}
                                      className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                    <ChevronRight size={12} className={`text-gray-400 transition-transform duration-200 ml-1 ${fqOpen ? 'rotate-90' : ''}`} />
                                  </div>
                                </div>

                                {fqOpen && (
                                  <div className="border-t border-amber-100 dark:border-amber-900/30" onClick={e => e.stopPropagation()}>
                                    <div className="flex flex-col items-center justify-center px-3 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-b border-amber-100 dark:border-amber-900/30">
                                      {isFull ? (
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                          <CheckCircle2 size={14} />
                                          <span className="text-xs font-medium">หมู่นี้มีลูกเสือครบ 8 คนแล้ว</span>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setModal({ type: 'add-scout-to-squad', squadId: squad.id, squadName: squad.name, formData: { scoutId: '' } })}
                                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 rounded-xl shadow-sm hover:shadow-md hover:scale-105 transition-all"
                                        >
                                          <UserPlus size={12} /> เพิ่มลูกเสือ ({8 - squadScouts.length} ที่ว่าง)
                                        </button>
                                      )}
                                    </div>
                                    <div className="divide-y divide-gray-50 dark:divide-scout-700/30">
                                      {squadScouts.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-5 gap-1.5">
                                          <Users size={16} className="text-gray-300" />
                                          <p className="text-xs text-gray-400">ยังไม่มีลูกเสือในหมู่นี้</p>
                                        </div>
                                      ) : squadScouts.map(s => (
                                        <div key={s.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-scout-700/20 transition-colors group">
                                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.gender === 'ชาย' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : s.gender === 'หญิง' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400' : 'bg-scout-100 text-scout-700 dark:bg-scout-700 dark:text-scout-300'}`}>
                                            {s.firstName?.[0]}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-scout-900 dark:text-white truncate">{s.firstName} {s.lastName}</p>
                                            <p className="text-xs text-gray-400 truncate">{s.school || '-'}</p>
                                          </div>
                                          {s.gender && (
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${s.gender === 'ชาย' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'}`}>
                                              {s.gender}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          )
        })}

        {camps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-scout-50 dark:bg-scout-900/30 flex items-center justify-center"><Tent size={28} className="text-scout-400" /></div>
            <p className="text-sm font-semibold text-gray-700 dark:text-white">ยังไม่มีค่าย</p>
            <p className="text-xs text-gray-400">กดปุ่ม "เพิ่มค่าย" เพื่อเริ่มต้น</p>
          </div>
        )}
      </div>

      {/* ── Scout list ── */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <p className="text-sm font-semibold text-scout-800 dark:text-scout-200">
            รายชื่อลูกเสือทั้งหมด <span className="ml-2 text-xs font-normal text-gray-400">({filteredScouts.length} คน)</span>
          </p>
          <div className="flex gap-2">
            <div className="relative">
              <input type="text" placeholder="ค้นหาชื่อ, รหัส..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input pl-9 pr-4 text-sm w-48" />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="relative">
              <select value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)} className="input pl-9 pr-8 text-sm appearance-none cursor-pointer">
                <option value="ALL">โรงเรียนทั้งหมด</option>
                {allSchools.map(school => <option key={school} value={school}>{school}</option>)}
              </select>
              <School size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredScouts.length === 0 ? (
            <div className="text-center py-8"><p className="text-sm text-gray-500">{searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีข้อมูลลูกเสือ'}</p></div>
          ) : filteredScouts.map(s => (
            <div key={s.id} className="card flex items-center gap-3 group hover:border-scout-300 dark:hover:border-scout-500 transition-all cursor-pointer">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${s.gender === 'ชาย' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : s.gender === 'หญิง' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400' : 'bg-scout-100 text-scout-700 dark:bg-scout-700 dark:text-scout-300'}`}>
                {s.firstName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-scout-900 dark:text-white truncate">{s.firstName} {s.lastName}</p>
                <p className="text-xs text-gray-400">{s.scoutCode}</p>
                {s.school && <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 truncate">{s.school}</p>}
              </div>
              <div className="flex items-center gap-2">
                {s.gender && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.gender === 'ชาย' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-pink-100 text-pink-600 dark:bg-pink-900/30'}`}>{s.gender}</span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${s.squadId ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                  {s.squadId ? 'มีหมู่' : 'ไม่มีหมู่'}
                </span>
                <button onClick={() => setModal({ type: 'move', scout: s, formData: { squadId: s.squadId || '' } })} className="opacity-0 group-hover:opacity-100 btn-primary text-xs px-3 py-1.5 flex items-center gap-1 transition-all">
                  <ArrowRight size={12} /> ย้ายหมู่
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)', animation: 'fadeIn 0.15s ease' }} onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="bg-white dark:bg-scout-900 rounded-2xl w-full max-w-sm shadow-2xl" style={{ animation: 'slideUp 0.2s ease' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-scout-700">
              <h3 className="font-semibold text-scout-900 dark:text-white">
                {modal.type === 'camp' ? (modal.formData?.id ? 'แก้ไขค่าย' : 'เพิ่มค่ายย่อย')
                  : modal.type === 'troop' ? (modal.formData?.id ? 'แก้ไขกอง' : 'เพิ่มกอง')
                    : modal.type === 'squad' ? (modal.formData?.id ? 'แก้ไขหมู่' : 'เพิ่มหมู่')
                      : modal.type === 'add-scout-to-squad' ? `เพิ่มลูกเสือใน ${modal.squadName}`
                        : modal.type === 'assign-floating-squad' ? `ย้ายหมู่ "${modal.squadName}" เข้ากอง`
                          : modal.type === 'view-camp-details' ? `ค่าย "${modal.camp?.name}"`
                            : modal.type === 'view-troop-details' ? `กอง "${modal.troop?.name}"`
                              : modal.type === 'view-squad-details' ? `หมู่ "${modal.squad?.name}"`
                                : modal.type === 'move' || modal.type === 'move-confirm' ? 'ย้ายหมู่' : ''}
              </h3>
              <button onClick={closeModal} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-scout-700 transition-colors"><X size={18} /></button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {modal.type === 'assign-floating-squad' ? (() => {
                const camp = camps.find(c => c.id === modal.campId)
                const availableTroops = (camp?.troops || []).filter(t => (t.squads?.length || 0) < (t.maxSquads || 4))
                return (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                      <AlertCircle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ชื่อหมู่จะเปลี่ยนเป็น "หมู่ที่ X" ตามลำดับในกองที่เลือกอัตโนมัติ
                      </p>
                    </div>
                    <select className="input w-full" value={modal.formData.troopId} onChange={e => setModal(m => ({ ...m, formData: { ...m.formData, troopId: e.target.value } }))} autoFocus>
                      <option value="">เลือกกอง...</option>
                      {availableTroops.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.squads?.length || 0}/{t.maxSquads || 4} หมู่)</option>
                      ))}
                    </select>
                    {availableTroops.length === 0 && (
                      <p className="text-xs text-center text-red-500 py-1">ทุกกองในค่ายนี้มีหมู่เต็มแล้ว</p>
                    )}
                  </div>
                )
              })()

                : modal.type === 'move-confirm' ? (
                  <div className="text-center space-y-2 py-2">
                    <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto"><ArrowRight size={22} className="text-amber-500" /></div>
                    <p className="text-sm text-gray-600 dark:text-scout-300">ย้าย <span className="font-semibold text-scout-900 dark:text-white">"{modal.scout?.firstName} {modal.scout?.lastName}"</span></p>
                    <p className="text-sm text-gray-600 dark:text-scout-300">ไปยัง <span className="font-semibold text-scout-900 dark:text-white">{modal.formData.squadId ? allSquads.find(s => s.id === modal.formData.squadId)?.name || 'หมู่ที่เลือก' : 'ไม่มีหมู่'}</span></p>
                  </div>

                ) : modal.type === 'move' ? (() => {
                  const scoutGender = modal.scout?.gender
                  const scoutSchool = modal.scout?.school
                  const filteredSquads = allSquads.filter(sq => {
                    const squadMembers = allScouts.filter(s => s.squadId === sq.id)
                    if (squadMembers.length === 0) return true
                    const squadGender = squadMembers[0]?.gender
                    const squadSchool = squadMembers[0]?.school
                    const genderMatch = !scoutGender || !squadGender || squadGender === scoutGender
                    const schoolMatch = !scoutSchool || !squadSchool || squadSchool === scoutSchool
                    return genderMatch && schoolMatch
                  })
                  return (
                    <div className="space-y-2">
                      {(scoutGender || scoutSchool) && (
                        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                          <AlertCircle size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            แสดงเฉพาะหมู่ที่ตรงเงื่อนไข
                            {scoutGender && <span> · เพศ<span className="font-semibold">{scoutGender}</span></span>}
                            {scoutSchool && <span> · โรงเรียน<span className="font-semibold">{scoutSchool}</span></span>}
                          </p>
                        </div>
                      )}
                      <select className="input w-full" value={modal.formData.squadId} onChange={e => setModal(m => ({ ...m, formData: { ...m.formData, squadId: e.target.value } }))}>
                        <option value="">ไม่มีหมู่ (ลอยอิสระ)</option>
                        {filteredSquads.map(s => (
                          <option key={s.id} value={s.id}>{s.campName} &gt; {s.troopName} &gt; {s.name}</option>
                        ))}
                      </select>
                      {filteredSquads.length === 0 && (
                        <p className="text-xs text-center text-amber-500 py-1">ไม่มีหมู่ที่ตรงเงื่อนไข</p>
                      )}
                    </div>
                  )
                })()

                  : modal.type === 'add-scout-to-squad' ? (() => {
                    const squadScouts = allScouts.filter(s => s.squadId === modal.squadId)
                    const isFull = squadScouts.length >= 8
                    const squadSchool = squadScouts[0]?.school || null
                    const squadGender = squadScouts[0]?.gender || null
                    const available = allScouts.filter(s => {
                      if (s.squadId) return false
                      if (squadSchool && s.school !== squadSchool) return false
                      if (squadGender && s.gender !== squadGender) return false
                      return true
                    })
                    if (isFull) return (
                      <div className="flex flex-col items-center justify-center py-4 gap-2">
                        <CheckCircle2 size={24} className="text-emerald-500" />
                        <p className="text-sm font-semibold text-emerald-600">หมู่นี้มีลูกเสือครบ 8 คนแล้ว</p>
                      </div>
                    )
                    return (
                      <div className="space-y-2">
                        {(squadSchool || squadGender) && (
                          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                            <AlertCircle size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              แสดงเฉพาะลูกเสือที่ยังไม่มีหมู่{squadSchool && ` · โรงเรียน "${squadSchool}"`}{squadGender && ` · เพศ${squadGender}`}
                            </p>
                          </div>
                        )}
                        <select className="input w-full" value={modal.formData.scoutId} onChange={e => setModal(m => ({ ...m, formData: { ...m.formData, scoutId: e.target.value } }))} autoFocus>
                          <option value="">เลือกลูกเสือ...</option>
                          {available.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.scoutCode})</option>)}
                        </select>
                        {available.length === 0 && <p className="text-xs text-center text-amber-500 py-1">ไม่มีลูกเสือที่ตรงเงื่อนไข</p>}
                        <p className="text-xs text-gray-400 text-center">ที่ว่างในหมู่นี้: {8 - squadScouts.length} คน</p>
                      </div>
                    )
                  })()

                    : modal.type === 'view-camp-details' || modal.type === 'view-troop-details' || modal.type === 'view-squad-details' ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
                            <p className="text-xl font-bold text-blue-600">{modal.scouts.length}</p>
                            <p className="text-xs text-gray-500 mt-0.5">ลูกเสือ</p>
                          </div>
                          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-center">
                            <p className="text-xl font-bold text-green-600">{modal.schoolStats.length}</p>
                            <p className="text-xs text-gray-500 mt-0.5">สถานศึกษา</p>
                          </div>
                        </div>
                        {modal.schoolStats.length > 0 && (
                          <div className="space-y-1.5">
                            {modal.schoolStats.map((stat, i) => (
                              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-scout-800">
                                <p className="text-xs text-gray-700 dark:text-gray-300">{stat.school}</p>
                                <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">{stat.count} คน</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {modal.scouts.map(scout => (
                            <div key={scout.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-scout-800">
                              <div className="w-6 h-6 rounded-full bg-scout-100 dark:bg-scout-700 flex items-center justify-center text-xs font-bold text-scout-700 dark:text-scout-300">{scout.firstName?.[0]}</div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-scout-900 dark:text-white">{scout.firstName} {scout.lastName}</p>
                                <p className="text-xs text-gray-500">{scout.school || '-'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <input className="input w-full" placeholder="ชื่อ" autoFocus value={modal.formData.name} onChange={e => setModal(m => ({ ...m, formData: { ...m.formData, name: e.target.value } }))} onKeyDown={e => { if (e.key === 'Enter' && modal.formData.name) handleSubmit() }} />
                    )}
            </div>

            <div className="flex gap-2 px-5 pb-5">
              {modal.type === 'move-confirm' ? (
                <>
                  <button onClick={confirmMove} className="btn-primary flex-1">ยืนยันย้าย</button>
                  <button onClick={() => setModal(m => ({ ...m, type: 'move' }))} className="btn-secondary flex-1">ย้อนกลับ</button>
                </>
              ) : modal.type === 'view-camp-details' || modal.type === 'view-troop-details' || modal.type === 'view-squad-details' ? (
                <button onClick={closeModal} className="btn-secondary flex-1">ปิด</button>
              ) : modal.type === 'add-scout-to-squad' && allScouts.filter(s => s.squadId === modal.squadId).length >= 8 ? (
                <button onClick={closeModal} className="btn-secondary flex-1">ปิด</button>
              ) : modal.type === 'assign-floating-squad' && (camps.find(c => c.id === modal.campId)?.troops || []).filter(t => (t.squads?.length || 0) < (t.maxSquads || 4)).length === 0 ? (
                <button onClick={closeModal} className="btn-secondary flex-1">ปิด</button>
              ) : (
                <>
                  <button onClick={handleSubmit} disabled={modal.formData?.name === '' && modal.type !== 'add-scout-to-squad' && modal.type !== 'move' && modal.type !== 'assign-floating-squad'} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">บันทึก</button>
                  <button onClick={closeModal} className="btn-secondary flex-1">ยกเลิก</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete ── */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)', animation: 'fadeIn 0.15s ease' }} onClick={e => { if (e.target === e.currentTarget) setConfirmDel(null) }}>
          <div className="bg-white dark:bg-scout-900 rounded-2xl w-full max-w-xs shadow-2xl text-center" style={{ animation: 'slideUp 0.2s ease' }}>
            <div className="px-6 pt-6 pb-2">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3"><Trash2 size={22} className="text-red-500" /></div>
              <p className="font-bold text-scout-900 dark:text-white text-lg">ลบข้อมูล?</p>
              <p className="text-sm text-gray-500 dark:text-scout-400 mt-1">ต้องการลบ <span className="font-semibold text-red-500">{confirmDel.label}</span> ใช่หรือไม่?</p>
              <p className="text-xs text-gray-400 mt-1">
                {confirmDel.label.includes('ค่าย') ? '⚠️ จะลบกองและหมู่ทั้งหมดด้วย' : confirmDel.label.includes('กอง') ? '⚠️ จะลบหมู่ทั้งหมดในกองนี้ด้วย' : 'ข้อมูลจะหายถาวร'}
              </p>
            </div>
            <div className="flex gap-2 p-4">
              <button onClick={() => { confirmDel.onConfirm(); setConfirmDel(null) }} className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-500 hover:bg-red-600 transition-all">ลบเลย</button>
              <button onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-scout-800 text-gray-600 dark:text-scout-300 hover:bg-gray-200 transition-all">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Max Squads Modal ── */}
      {showMaxSquadsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)', animation: 'fadeIn 0.15s ease' }} onClick={e => { if (e.target === e.currentTarget) setShowMaxSquadsModal(false) }}>
          <div className="bg-white dark:bg-scout-900 rounded-2xl w-full max-w-sm shadow-2xl" style={{ animation: 'slideUp 0.2s ease' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-scout-700">
              <h3 className="font-semibold text-scout-900 dark:text-white">ตั้งค่าหมู่สูงสุด</h3>
              <button onClick={() => setShowMaxSquadsModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-scout-700 transition-colors"><X size={18} /></button>
            </div>
            <div className="px-5 py-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">จำนวนหมู่สูงสุดต่อกอง</label>
              <input className="input w-full" type="number" min="1" max="20" placeholder="เช่น 10" value={maxSquadsForm.maxSquads} onChange={e => setMaxSquadsForm(f => ({ ...f, maxSquads: e.target.value }))} autoFocus />
              <p className="text-xs text-gray-400 mt-2">กำหนดจำนวนหมู่สูงสุดที่สามารถสร้างได้ในกองนี้</p>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={handleSaveMaxSquads} disabled={!maxSquadsForm.maxSquads} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">บันทึก</button>
              <button onClick={() => setShowMaxSquadsModal(false)} className="btn-secondary flex-1">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}