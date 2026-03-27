import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, X, ChevronRight, Users, ArrowRight, Flag, Tent, Shield, School, MapPin, Eye, Search, Settings, Edit } from 'lucide-react'

export default function AdminCamps() {
  try {
    const qc = useQueryClient()
    const fileRef = useRef()
    const [modal, setModal] = useState(null)
    console.log('AdminCamps component initialized')
    const [confirmDel, setConfirmDel] = useState(null)
    const [expandedCamp, setExpandedCamp] = useState(null)
    const [expandedTroop, setExpandedTroop] = useState(null)
    const [expandedSquad, setExpandedSquad] = useState(null)
    const [searchTerm, setSearchTerm] = useState('') // { label, onConfirm }
    const [selectedSchool, setSelectedSchool] = useState('ALL') // สำหรับกรองตามโรงเรียน
    const [showMaxSquadsModal, setShowMaxSquadsModal] = useState(false)
    const [maxSquadsForm, setMaxSquadsForm] = useState({ maxSquads: '4' })
    const [troopMaxSquads, setTroopMaxSquads] = useState({})

  const { data: camps = [], isLoading: campsLoading, error: campsError } = useQuery('camps-full', () => api.get('/camps'), { 
    refetchOnWindowFocus: true,
    onError: (error) => {
      console.error('Camps API Error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลค่ายได้');
    }
  })
  const { data: allScouts = [], isLoading: scoutsLoading, error: scoutsError } = useQuery('all-scouts', () => api.get('/scouts'), { 
    refetchOnWindowFocus: true,
    onError: (error) => {
      console.error('Scouts API Error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลลูกเสือได้');
    }
  })

  // Show error state
  if (campsError || scoutsError) {
    return (
      <div className="page flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <X size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-sm text-gray-400">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่</p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (campsLoading || scoutsLoading) {
    return (
      <div className="page flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-scout-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  // Additional safety check
  if (!camps || !allScouts) {
    return (
      <div className="page flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <Settings size={24} className="text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">กำลังเริ่มต้นระบบ</h3>
          <p className="text-sm text-gray-400">กรุณารอสักครู่...</p>
        </div>
      </div>
    )
  }

  const createCamp = useMutation(d => api.post('/camps', d), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); qc.invalidateQueries('camps'); closeModal(); toast.success('สร้างค่ายพร้อมโครงสร้างสำเร็จ (1 กอง, 4 หมู่)') }
  })
  const createTroop = useMutation(d => {
    // Find the camp to get current troops and auto-assign next number
    const camp = camps.find(c => c.id === d.campId)
    const currentTroops = camp?.troops || []
    const nextNumber = Math.max(...currentTroops.map(t => t.number || 0), 0) + 1
    
    return api.post(`/camps/${d.campId}/troops`, { name: d.name, number: nextNumber })
  }, {
    onSuccess: () => { qc.invalidateQueries('camps-full'); closeModal(); toast.success('สร้างกองพร้อม 4 หมู่สำเร็จ') }
  })
  const createSquad = useMutation(d => {
    // Find the troop to get current squads and auto-assign next number
    const troop = camps.flatMap(c => c.troops || []).find(t => t.id === d.troopId)
    const currentSquads = troop?.squads || []
    const maxSquads = troop?.maxSquads || 4
    
    // Check squad limit
    if (currentSquads.length >= maxSquads) {
      throw new Error(`ไม่สามารถสร้างหมู่ได้ เนื่องจากกองนี้มีหมู่ครบ ${maxSquads} หมู่แล้ว`)
    }
    
    // Auto-assign next squad number
    const nextNumber = Math.max(...currentSquads.map(s => s.number || 0), 0) + 1
    
    return api.post(`/camps/${d.campId}/troops/${d.troopId}/squads`, { name: d.name, number: nextNumber })
  }, {
    onSuccess: () => { qc.invalidateQueries('camps-full'); closeModal(); toast.success('สร้างหมู่สำเร็จ') },
    onError: (error) => {
      toast.error(error.message || 'ไม่สามารถสร้างหมู่ได้')
    }
  })
  const updateCamp = useMutation(d => api.patch(`/camps/${d.id}`, { name: d.name }), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); qc.invalidateQueries('camps'); closeModal(); toast.success('แก้ไขชื่อค่ายสำเร็จ') }
  })
  const deleteCamp = useMutation(id => api.delete(`/camps/${id}`), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); qc.invalidateQueries('camps'); toast.success('ลบค่ายและกอง/หมู่ทั้งหมดสำเร็จ') }
  })
  const deleteSquad = useMutation(({ campId, squadId }) => api.delete(`/camps/${campId}/squads/${squadId}`), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); toast.success('ลบหมู่สำเร็จ') }
  })
  const deleteTroop = useMutation(({ campId, troopId }) => api.delete(`/camps/${campId}/troops/${troopId}`), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); toast.success('ลบกองและหมู่ทั้งหมดสำเร็จ') }
  })
  const updateTroop = useMutation(d => api.patch(`/camps/${d.campId}/troops/${d.id}`, { name: d.name }), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); closeModal(); toast.success('แก้ไขชื่อกองสำเร็จ') }
  })
  const updateSquad = useMutation(d => api.patch(`/camps/${d.campId}/squads/${d.id}`, { name: d.name }), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); closeModal(); toast.success('แก้ไขชื่อหมู่สำเร็จ') }
  })
  const moveScout = useMutation(({ scoutId, squadId }) => api.patch(`/camps/scouts/${scoutId}/move`, { squadId }), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); qc.invalidateQueries('all-scouts'); closeModal(); toast.success('ย้ายลูกเสือสำเร็จ') }
  })
  const createScout = useMutation(({ squadId, ...data }) => api.post('/scouts', { ...data, squadId }), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); qc.invalidateQueries('all-scouts'); closeModal(); toast.success('เพิ่มลูกเสือสำเร็จ') }
  })

  function closeModal() { setModal(null) }
  function handleSubmit() {
    try {
      const d = modal.formData
      console.log('Submitting modal:', modal.type, d)
      
      if (modal.type === 'camp') {
        if (d.id) updateCamp.mutate(d)
        else createCamp.mutate({ name: d.name })
      }
      else if (modal.type === 'troop') {
        if (d.id) updateTroop.mutate(d)
        else createTroop.mutate(d)
      }
      else if (modal.type === 'squad') {
        if (d.id) updateSquad.mutate(d)
        else createSquad.mutate(d)
      }
      else if (modal.type === 'add-scout-to-squad') createScout.mutate({ squadId: modal.squadId, firstName: d.firstName, lastName: d.lastName, scoutCode: d.scoutCode })
      else if (modal.type === 'add-existing-scout-to-squad') moveScout.mutate({ scoutId: d.scoutId, squadId: modal.squadId })
      else if (modal.type === 'move') setModal(m => ({ ...m, type: 'move-confirm' }))
      else {
        console.error('Unknown modal type:', modal.type)
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }
  function confirmMove() {
    moveScout.mutate({ scoutId: modal.scout.id, squadId: modal.formData.squadId || null })
  }

  console.log('Camps data:', camps)
  console.log('All scouts data:', allScouts)

  const allSquads = camps.flatMap(c => (
    (c.troops || []).flatMap(t => (
      (t.squads || []).map(s => ({ ...s, troopName: t.name, campName: c.name }))
    ))
  )).sort((a, b) => {
    // Sort by camp name, then troop name, then squad number
    if (a.campName !== b.campName) return a.campName.localeCompare(b.campName)
    if (a.troopName !== b.troopName) return a.troopName.localeCompare(b.troopName)
    return a.number - b.number
  });
  console.log('All squads:', allSquads)
  const unassigned = allScouts.filter(s => !s.squadId)
  const assigned = allScouts.filter(s => s.squadId)

  // Add debugging
  console.log('Camps data:', camps);
  console.log('Scouts data:', allScouts);
  console.log('Loading states:', { campsLoading, scoutsLoading });
  console.log('Errors:', { campsError, scoutsError });

  // ฟังก์ชันกรองลูกเสือตามการค้นหา
  const filteredScouts = allScouts.filter(scout => {
    const searchMatch = !searchTerm || 
      `${scout.firstName} ${scout.lastName} ${scout.scoutCode || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    
    const schoolMatch = selectedSchool === 'ALL' || scout.school === selectedSchool
    
    return searchMatch && schoolMatch
  })

  // ดึงรายชื่อโรงเรียนทั้งหมดสำหรับ dropdown
  const allSchools = [...new Set(allScouts.map(s => s.school).filter(Boolean))].sort()

  // แยกลูกเสือที่กรองแล้วตามสถานะหมู่
  const filteredUnassigned = filteredScouts.filter(s => !s.squadId)
  const filteredAssigned = filteredScouts.filter(s => s.squadId)

  // ฟังก์ชันคำนวณสถิติสถานศึกษา
  const getSchoolStats = (scouts) => {
    const schoolCounts = {}
    scouts.forEach(scout => {
      if (scout.school) {
        schoolCounts[scout.school] = (schoolCounts[scout.school] || 0) + 1
      }
    })
    return Object.entries(schoolCounts).map(([school, count]) => ({ school, count }))
      .sort((a, b) => b.count - a.count)
  }

  // ฟังก์ชันเปิด modal ดูรายละเอียด
  const openDetailsModal = (type, data) => {
    if (type === 'camp') {
      const campScouts = (data.troops || []).flatMap(t => 
        (t.squads || []).flatMap(s => 
          allScouts.filter(scout => scout.squadId === s.id)
        )
      )
      setModal({ 
        type: 'view-camp-details', 
        camp: data, 
        scouts: campScouts,
        schoolStats: getSchoolStats(campScouts)
      })
    } else if (type === 'troop') {
      const troopScouts = (data.squads || []).flatMap(s => 
        allScouts.filter(scout => scout.squadId === s.id)
      )
      setModal({ 
        type: 'view-troop-details', 
        troop: data, 
        scouts: troopScouts,
        schoolStats: getSchoolStats(troopScouts)
      })
    } else if (type === 'squad') {
      const squadScouts = allScouts.filter(scout => scout.squadId === data.id)
      setModal({ 
        type: 'view-squad-details', 
        squad: data, 
        scouts: squadScouts,
        schoolStats: getSchoolStats(squadScouts)
      })
    }
  }

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
    const newMaxSquads = parseInt(maxSquadsForm.maxSquads)
    
    // ตรวจสอบว่าจำนวนหมู่สูงสุดใหม่ไม่น้อยกว่าจำนวนหมู่ปัจจุบัน
    if (newMaxSquads < currentSquadCount) {
      toast.error(`ไม่สามารถตั้งจำนวนหมู่สูงสุดน้อยกว่าจำนวนหมู่ปัจจุบันได้ (ปัจจุบันมี ${currentSquadCount} หมู่)`)
      return
    }
    
    api.patch(`/camps/${troopMaxSquads.campId}/troops/${troopMaxSquads.troopId}/max-squads`, { maxSquads: newMaxSquads })
      .then(() => {
        qc.invalidateQueries('camps-full')
        setShowMaxSquadsModal(false)
        setMaxSquadsForm({ maxSquads: '4' })
        setTroopMaxSquads({})
        toast.success('ตั้งค่าจำนวนหมู่สูงสุดสำเร็จ')
      })
      .catch(err => {
        toast.error(err?.response?.data?.message || 'ตั้งค่าจำนวนหมู่สูงสุดไม่สำเร็จ กรุณาลองใหม่')
      })
  }, [troopMaxSquads, maxSquadsForm, camps, qc])

  return (
    <div className="page pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-scout-900 dark:text-white">จัดการค่าย</h1>
          <p className="text-xs text-gray-400 mt-0.5">{camps.length} ค่ายย่อย · {allScouts.length} ลูกเสือ</p>
        </div>
        <button onClick={() => setModal({ type: 'camp', formData: { name: '' } })} className="btn-primary text-sm px-4 py-2.5">
          <Plus size={16} /> เพิ่มค่าย
        </button>
      </div>

      {/* Camp list */}
      <div className="space-y-3">
        {camps.map(camp => {
          const totalScouts = (camp.troops || []).flatMap(t => t.squads || []).reduce((sum, s) => sum + (s._count?.scouts || 0), 0)
          const isOpen = expandedCamp === camp.id
          return (
            <div key={camp.id} className="card overflow-hidden p-0">
              {/* Camp row */}
              <div className="flex items-center gap-3 p-4">
                <button onClick={() => setExpandedCamp(isOpen ? null : camp.id)} className="flex-1 flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-xl bg-scout-700 flex items-center justify-center">
                    <Tent size={17} className="text-scout-300" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-scout-900 dark:text-white">{camp.name}</p>
                    <p className="text-xs text-gray-400">{(camp.troops || []).length} กอง · {totalScouts} คน</p>
                  </div>
                </button>
                <button onClick={() => openDetailsModal('camp', camp)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                  <Eye size={15} />
                </button>
                <button onClick={() => setModal({ type: 'camp', formData: { name: camp.name, id: camp.id } })}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all">
                  <Settings size={15} />
                </button>
                <button onClick={() => setConfirmDel({ label: `ค่าย "${camp.name}"`, onConfirm: () => deleteCamp.mutate(camp.id) })}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                  <Trash2 size={14} />
                </button>
                <button onClick={() => setModal({ type: 'troop', formData: { name: '', campId: camp.id } })}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                  title="เพิ่มกอง">
                  <Plus size={14} />
                </button>
                <button onClick={() => setExpandedCamp(isOpen ? null : camp.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-scout-700 transition-all">
                  <ChevronRight size={16} className="transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0)' }} />
                </button>
              </div>

              {/* Troops */}
              {isOpen && (
                <div className="border-t border-gray-100 dark:border-scout-800">
                  {(camp.troops || []).length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">ยังไม่มีกอง — กด + เพื่อเพิ่มกอง</p>
                  ) : (camp.troops || []).map(troop => {
                    const troopOpen = expandedTroop === troop.id
                    return (
                      <div key={troop.id} className="border-b border-gray-100 dark:border-scout-800 last:border-0">
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-scout-800/50">
                          <button onClick={() => setExpandedTroop(troopOpen ? null : troop.id)} className="flex-1 flex items-center gap-2.5 text-left">
                            <div className="w-7 h-7 rounded-lg bg-scout-200 dark:bg-scout-700 flex items-center justify-center">
                              <Flag size={13} className="text-scout-600 dark:text-scout-300" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-scout-900 dark:text-white">{troop.name}</p>
                              <p className="text-xs text-gray-400">{(troop.squads || []).length}/{troop.maxSquads || 4} หมู่</p>
                            </div>
                          </button>
                          <button onClick={() => openDetailsModal('troop', troop)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                            <Eye size={13} />
                          </button>
                          <button onClick={() => handleSetMaxSquads(troop, camp.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                            title="ตั้งค่าจำนวนหมู่สูงสุด">
                            <Edit size={12} />
                          </button>
                          <button onClick={() => setModal({ type: 'troop', formData: { name: troop.name, id: troop.id, campId: camp.id } })}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all">
                            <Settings size={13} />
                          </button>
                          <button onClick={() => setConfirmDel({ label: `กอง "${troop.name}"`, onConfirm: () => deleteTroop.mutate({ campId: camp.id, troopId: troop.id }) })}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                            <Trash2 size={13} />
                          </button>
                          <button onClick={() => setModal({ type: 'squad', formData: { name: '', troopId: troop.id } })}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                            title="เพิ่มหมู่">
                            <Plus size={13} />
                          </button>
                          <button onClick={() => setExpandedTroop(troopOpen ? null : troop.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-scout-700 transition-all">
                            <ChevronRight size={13} className="transition-transform duration-200"
                              style={{ transform: troopOpen ? 'rotate(90deg)' : 'rotate(0)' }} />
                          </button>
                        </div>
                        {/* Squads */}
                        {troopOpen && (
                          <div className="px-4 py-2 space-y-2">
                            {(troop.squads || []).length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-2">ยังไม่มีหมู่</p>
                            ) : (troop.squads || []).sort((a, b) => a.number - b.number).map(squad => {
                              const squadScouts = allScouts.filter(s => s.squadId === squad.id)
                              const squadOpen = expandedSquad === squad.id
                              return (
                                <div key={squad.id} className="rounded-xl border border-gray-200 dark:border-scout-700 overflow-hidden">
                                  <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-scout-900">
                                    <button onClick={() => setExpandedSquad(squadOpen ? null : squad.id)} className="flex-1 flex items-center gap-2 text-left">
                                      <div className="w-6 h-6 rounded-md bg-scout-100 dark:bg-scout-700 flex items-center justify-center">
                                        <Shield size={11} className="text-scout-600 dark:text-scout-300" />
                                      </div>
                                      <p className="text-sm font-medium text-scout-900 dark:text-white">{squad.name}</p>
                                      <span className="text-xs bg-gray-100 dark:bg-scout-800 text-gray-500 dark:text-scout-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Users size={10} /> {squadScouts.length}
                                      </span>
                                    </button>
                                    <button onClick={() => openDetailsModal('squad', squad)}
                                      className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                                      <Eye size={11} />
                                    </button>
                                    <button onClick={() => setModal({ type: 'squad', formData: { name: squad.name, id: squad.id, troopId: troop.id } })}
                                      className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all">
                                      <Settings size={11} />
                                    </button>
                                    <button onClick={() => setConfirmDel({ label: `หมู่ "${squad.name}"`, onConfirm: () => deleteSquad.mutate({ campId: camp.id, squadId: squad.id }) })}
                                      className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                                      <Trash2 size={11} />
                                    </button>
                                    <button onClick={() => setExpandedSquad(squadOpen ? null : squad.id)}
                                      className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-scout-700 transition-all">
                                      <ChevronRight size={12} className="transition-transform duration-200"
                                        style={{ transform: squadOpen ? 'rotate(90deg)' : 'rotate(0)' }} />
                                    </button>
                                  </div>

                                  {squadOpen && (
                                    <div className="border-t border-gray-100 dark:border-scout-700">
                                      {/* ปุ่มเพิ่มลูกเสือ - แสดงเสมอ */}
                                      <div className="text-center py-4 border-b border-gray-100 dark:border-scout-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                                        <button 
                                          onClick={() => setModal({ type: 'add-existing-scout-to-squad', squadId: squad.id, squadName: squad.name, formData: { scoutId: '' } })}
                                          className="btn-primary text-xs px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto">
                                          <Plus size={13} className="animate-pulse" />
                                          <span className="font-medium">เพิ่มลูกเสือ</span>
                                        </button>
                                      </div>
                                      
                                      {/* รายชื่อลูกเสือ */}
                                      <div className="divide-y divide-gray-100 dark:divide-scout-700/50">
                                        {squadScouts.length === 0 ? (
                                          <div className="text-center py-3">
                                            <p className="text-xs text-gray-400">ยังไม่มีลูกเสือ</p>
                                          </div>
                                        ) : squadScouts.map(s => (
                                          <div key={s.id} className="flex items-center gap-2 px-3 py-2">
                                            <div className="w-6 h-6 rounded-full bg-scout-100 dark:bg-scout-700 flex items-center justify-center text-xs font-bold text-scout-700 dark:text-scout-300">
                                              {s.firstName?.[0]}
                                            </div>
                                            <p className="flex-1 text-xs text-gray-700 dark:text-scout-200">{s.firstName} {s.lastName}</p>
                                            <button onClick={() => setModal({ type: 'move', scout: s, formData: { squadId: s.squadId || '' } })}
                                              className="flex items-center gap-1.5 text-xs text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium">
                                              <ArrowRight size={11} />
                                              <span>ย้าย</span>
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
            </div>
          )
        })}
      </div>

      {/* ลูกเสือทั้งหมด */}
      <div className="mt-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:gap-4">
          <p className="text-sm font-semibold text-scout-800 dark:text-scout-200 whitespace-nowrap min-w-0">
            📋 รายชื่อลูกเสือทั้งหมด ({filteredScouts.length} คน)
          </p>
          
          {/* ช่องค้นหาและ Dropdown โรงเรียน */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                placeholder="ค้นหาชื่อ, รหัส..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input pl-9 pr-4 text-sm w-full sm:w-48"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* Dropdown โรงเรียน */}
            <div className="relative flex-1 sm:flex-initial">
              <select 
                value={selectedSchool}
                onChange={e => setSelectedSchool(e.target.value)}
                className="input pl-9 pr-8 text-sm appearance-none cursor-pointer bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 w-full"
              >
                <option value="ALL">โรงเรียนทั้งหมด</option>
                {allSchools.map(school => (
                  <option key={school} value={school}>{school}</option>
                ))}
              </select>
              <School size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 dark:text-green-400" />
              <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 dark:text-green-400 rotate-90" />
            </div>
          </div>
        </div>
        
        {/* รายชื่อลูกเสือทั้งหมด (รวมกัน) */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredScouts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <Search size={20} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีข้อมูลลูกเสือ'}
              </p>
            </div>
          ) : (
            filteredScouts.map(s => (
              <div key={s.id} className="card flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  s.squadId 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-scout-100 dark:bg-scout-700 text-scout-700 dark:text-scout-300'
                }`}>
                  {s.firstName?.[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-scout-900 dark:text-white">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-gray-400">{s.scoutCode}</p>
                  {s.school && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{s.school}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {s.squadId ? (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                      มีหมู่
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
                      ไม่มีหมู่
                    </span>
                  )}
                  <button onClick={() => setModal({ type: 'move', scout: s, formData: { squadId: s.squadId || '' } })}
                    className="btn-primary text-xs px-3 py-1.5">
                    <ArrowRight size={13} /> ย้ายหมู่
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', animation: 'fadeIn 0.2s ease' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="bg-white dark:bg-scout-900 rounded-2xl w-full max-w-sm shadow-2xl"
            style={{ animation: 'slideUp 0.25s ease' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-scout-700">
              <h3 className="font-semibold text-scout-900 dark:text-white text-lg">
                {modal.type === 'camp' ? 'เพิ่มค่ายย่อย'
                  : modal.type === 'add-scout-to-squad' ? `เพิ่มลูกเสือใน${modal.squadName}`
                  : modal.type === 'add-existing-scout-to-squad' ? `เพิ่มลูกเสือใน${modal.squadName}`
                  : modal.type === 'view-camp-details' ? `รายละเอียดค่าย "${modal.camp.name}"`
                  : modal.type === 'view-troop-details' ? `รายละเอียดกอง "${modal.troop.name}"`
                  : modal.type === 'view-squad-details' ? `รายละเอียดหมู่ "${modal.squad.name}"`
                  : modal.type === 'squad' ? 'เพิ่มหมู่'
                  : `เพิ่มกอง`}
              </h3>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X size={20} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {modal.type === 'move-confirm' ? (
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
                    <ArrowRight size={24} className="text-amber-500" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-scout-300">
                    ย้าย <span className="font-semibold text-scout-900 dark:text-white">"{modal.scout?.firstName} {modal.scout?.lastName}"</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-scout-300">
                    ไปยัง <span className="font-semibold text-scout-900 dark:text-white">
                      {modal.formData.squadId
                        ? allSquads.find(s => s.id === modal.formData.squadId)?.name || 'หมู่ที่เลือก'
                        : 'ไม่มีหมู่ (ลอยอิสระ)'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">ยืนยันการย้ายหรือไม่?</p>
                </div>
              ) : modal.type === 'move' ? (
                <div className="space-y-3">
                  <div className="relative">
                    <select className="input w-full pr-10 appearance-none cursor-pointer bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 focus:border-green-500 focus:ring-green-500" value={modal.formData.squadId}
                      onChange={e => setModal(m => ({ ...m, formData: { ...m.formData, squadId: e.target.value } }))}>
                      <option value="">เลือกหมู่ที่จะย้าย...</option>
                      <option value="" className="text-amber-600 font-medium">ไม่มีหมู่ (ลอยอิสระ)</option>
                      <optgroup label="เลือกหมู่:" className="text-green-600 font-semibold">
                        {allSquads.map(s => (
                          <option key={s.id} value={s.id} className="pl-6">
                            {s.campName} &gt; {s.troopName} &gt; {s.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-green-600">
                      <ChevronRight size={18} className="rotate-90" />
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                    <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-2">
                      <span className="text-lg">💡</span>
                      <span>เลือกหมู่ปลายทางที่ต้องการย้ายลูกเสือไป</span>
                    </p>
                  </div>
                </div>
              ) : modal.type === 'add-existing-scout-to-squad' ? (
                (() => {
                  // หาสถานศึกษาของลูกเสือที่อยู่ในหมู่นี้แล้ว
                  const squadScouts = allScouts.filter(s => s.squadId === modal.squadId)
                  const squadSchool = squadScouts.length > 0 ? squadScouts[0].school : null
                  
                  // กรองลูกเสือที่ยังไม่มีหมู่ และมาจากสถานศึกษาเดียวกัน (ถ้ามีคนอยู่แล้ว)
                  const availableScouts = squadSchool 
                    ? allScouts.filter(s => !s.squadId && s.school === squadSchool)
                    : allScouts.filter(s => !s.squadId)
                  
                  return (
                    <div className="space-y-3">
                      <select className="input" value={modal.formData.scoutId} autoFocus
                        onChange={e => setModal(m => ({ ...m, formData: { ...m.formData, scoutId: e.target.value } }))}>
                        <option value="">เลือกลูกเสือ...</option>
                        {availableScouts.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.firstName} {s.lastName} ({s.scoutCode}) - {s.school || 'ไม่ระบุสถานศึกษา'}
                          </option>
                        ))}
                      </select>
                      {squadSchool ? (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                          <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-2">
                            <span className="text-lg">✅</span>
                            <span>แสดงเฉพาะลูกเสือจาก "{squadSchool}" (สถานศึกษาเดียวกับหมู่นี้)</span>
                          </p>
                        </div>
                      ) : (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                            <span className="text-lg">ℹ️</span>
                            <span>หมู่นี้ยังว่าง - เลือกลูกเสือคนแรกได้จากใดก็ได้</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })()
              ) : modal.type === 'view-camp-details' || modal.type === 'view-troop-details' || modal.type === 'view-squad-details' ? (
                <div className="space-y-4">
                  {/* สถิติทั่วไป */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={16} className="text-blue-600 dark:text-blue-400" />
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">ข้อมูลทั่วไป</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">จำนวนลูกเสือ</p>
                        <p className="font-bold text-scout-900 dark:text-white">{modal.scouts.length} คน</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">สถานศึกษา</p>
                        <p className="font-bold text-scout-900 dark:text-white">{modal.schoolStats.length} แห่ง</p>
                      </div>
                    </div>
                  </div>

                  {/* สถิติสถานศึกษา */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <School size={16} className="text-green-600 dark:text-green-400" />
                      <p className="text-sm font-semibold text-green-700 dark:text-green-300">สถิติสถานศึกษา</p>
                    </div>
                    {modal.schoolStats.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">ไม่มีข้อมูลสถานศึกษา</p>
                    ) : (
                      <div className="space-y-2">
                        {modal.schoolStats.map((stat, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <p className="text-xs text-gray-700 dark:text-gray-300">{stat.school}</p>
                            </div>
                            <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                              {stat.count} คน
                            </span>
                          </div>
                        ))}
                        {modal.schoolStats.length > 1 && (
                          <div className="pt-2 mt-2 border-t border-green-200 dark:border-green-800">
                            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <MapPin size={12} />
                              หมวดเดียวกันต้องมาจากสถานศึกษาเดียวกัน
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* รายชื่อลูกเสือ */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield size={16} className="text-gray-600 dark:text-gray-400" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">รายชื่อลูกเสือ ({modal.scouts.length})</p>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {modal.scouts.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">ยังไม่มีลูกเสือ</p>
                      ) : (
                        modal.scouts.map(scout => (
                          <div key={scout.id} className="flex items-center gap-2 p-2 bg-white dark:bg-scout-900 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-scout-100 dark:bg-scout-700 flex items-center justify-center text-xs font-bold text-scout-700 dark:text-scout-300">
                              {scout.firstName?.[0]}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-scout-900 dark:text-white">{scout.firstName} {scout.lastName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{scout.school || '-'}</p>
                            </div>
                            {scout.scoutCode && (
                              <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {scout.scoutCode}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <input className="input" placeholder="ชื่อ" autoFocus value={modal.formData.name}
                    onChange={e => setModal(m => ({ ...m, formData: { ...m.formData, name: e.target.value } }))} />
                  {modal.type !== 'camp' && modal.type !== 'troop' && modal.type !== 'squad' && (
                    <input className="input" type="number" placeholder="หมายเลข (1, 2, 3...)" value={modal.formData.number}
                      onChange={e => setModal(m => ({ ...m, formData: { ...m.formData, number: e.target.value } }))} />
                  )}
                </>
              )}
            </div>
            <div className="flex gap-2 px-5 pb-5">
              {modal.type === 'move-confirm' ? (
                <>
                  <button onClick={confirmMove} className="btn-primary flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">ยืนยัน ย้าย</button>
                  <button onClick={() => setModal(m => ({ ...m, type: 'move' }))} className="btn-secondary flex-1">ย้อนกลับ</button>
                </>
              ) : (
                <>
                  <button onClick={handleSubmit} className="btn-primary flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">บันทึก</button>
                  <button onClick={closeModal} className="btn-secondary flex-1">ยกเลิก</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', animation: 'fadeIn 0.15s ease' }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmDel(null) }}>
          <div className="bg-white dark:bg-scout-900 rounded-2xl w-full max-w-xs shadow-2xl text-center"
            style={{ animation: 'slideUp 0.2s ease' }}>
            <div className="px-6 pt-6 pb-2">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <p className="font-bold text-scout-900 dark:text-white text-lg">ลบข้อมูล?</p>
              <p className="text-sm text-gray-500 dark:text-scout-400 mt-1">
                ต้องการลบ <span className="font-semibold text-red-500">{confirmDel.label}</span> ใช่หรือไม่?
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {confirmDel.label.includes('ค่าย') 
                  ? '⚠️ การลบค่ายจะลบกองและหมู่ทั้งหมดในค่ายนี้ด้วย'
                  : confirmDel.label.includes('กอง')
                  ? '⚠️ การลบกองจะลบหมู่ทั้งหมดในกองนี้ด้วย'
                  : 'ข้อมูลจะหายจาก database ทันที'}
              </p>
            </div>
            <div className="flex gap-2 p-4">
              <button onClick={() => { confirmDel.onConfirm(); setConfirmDel(null) }}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-500 hover:bg-red-600 transition-all">
                ลบเลย
              </button>
              <button onClick={() => setConfirmDel(null)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-scout-800 text-gray-600 dark:text-scout-300 hover:bg-gray-200 dark:hover:bg-scout-700 transition-all">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Max Squads Modal */}
      {showMaxSquadsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', animation: 'fadeIn 0.2s ease' }}
          onClick={e => { if (e.target === e.currentTarget) setShowMaxSquadsModal(false) }}>
          <div className="bg-white dark:bg-scout-900 rounded-2xl w-full max-w-md shadow-2xl"
            style={{ animation: 'slideUp 0.25s ease' }}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200 dark:border-scout-700">
              <h3 className="font-semibold text-scout-900 dark:text-white text-lg">
                ตั้งค่าจำนวนหมู่สูงสุด
              </h3>
              <button onClick={() => setShowMaxSquadsModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-scout-600 text-gray-400 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    จำนวนหมู่สูงสุดต่อกอง
                  </label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 bg-gray-50 dark:bg-scout-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-scout-400 focus:border-transparent transition text-sm"
                    type="number"
                    min="1"
                    max="20"
                    placeholder="กรอกจำนวนหมู่สูงสุด (เช่น 10)"
                    value={maxSquadsForm.maxSquads}
                    onChange={(e) => setMaxSquadsForm((f) => ({ ...f, maxSquads: e.target.value }))}
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    กำหนดจำนวนหมู่สูงสุดที่สามารถสร้างได้ในกองนี้
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleSaveMaxSquads}
                disabled={!maxSquadsForm.maxSquads}
                className="flex-1 px-4 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
              >
                บันทึก
              </button>
              <button
                onClick={() => setShowMaxSquadsModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  )
  } catch (error) {
    console.error('AdminCamps component error:', error)
    return (
      <div className="page flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <X size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-sm text-gray-400">ไม่สามารถโหลดหน้าจัดการค่ายได้ กรุณาลองใหม่</p>
        </div>
      </div>
    )
  }
}
