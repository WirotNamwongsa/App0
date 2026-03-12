import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, X, ChevronRight, Users, ArrowRight, Flag, Tent, Shield } from 'lucide-react'

export default function AdminCamps() {
  const qc = useQueryClient()
  const [expandedCamp, setExpandedCamp] = useState(null)
  const [expandedTroop, setExpandedTroop] = useState(null)
  const [expandedSquad, setExpandedSquad] = useState(null)
  const [modal, setModal] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null) // { label, onConfirm }

  const { data: camps = [] } = useQuery('camps-full', () => api.get('/camps'), { refetchOnWindowFocus: true })
  const { data: allScouts = [] } = useQuery('all-scouts', () => api.get('/scouts'), { refetchOnWindowFocus: true })

  const createCamp = useMutation(d => api.post('/camps', d), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); qc.invalidateQueries('camps'); closeModal(); toast.success('สร้างค่ายสำเร็จ') }
  })
  const deleteCamp = useMutation(id => api.delete(`/camps/${id}`), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); qc.invalidateQueries('camps'); toast.success('ลบค่ายสำเร็จ') }
  })
  const createTroop = useMutation(({ campId, ...d }) => api.post(`/camps/${campId}/troops`, d), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); closeModal(); toast.success('สร้างกองสำเร็จ') }
  })
  const createSquad = useMutation(({ campId, troopId, ...d }) => api.post(`/camps/${campId}/troops/${troopId}/squads`, d), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); closeModal(); toast.success('สร้างหมู่สำเร็จ') }
  })
  const deleteTroop = useMutation(({ campId, troopId }) => api.delete(`/camps/${campId}/troops/${troopId}`), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); toast.success('ลบกองสำเร็จ') }
  })
  const deleteSquad = useMutation(({ campId, squadId }) => api.delete(`/camps/${campId}/squads/${squadId}`), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); toast.success('ลบหมู่สำเร็จ') }
  })
  const moveScout = useMutation(({ scoutId, squadId }) => api.patch(`/camps/scouts/${scoutId}/move`, { squadId }), {
    onSuccess: () => { qc.invalidateQueries('camps-full'); qc.invalidateQueries('all-scouts'); closeModal(); toast.success('ย้ายลูกเสือสำเร็จ') }
  })

  function closeModal() { setModal(null) }
  function handleSubmit() {
    const d = modal.formData
    if (modal.type === 'camp') createCamp.mutate({ name: d.name })
    else if (modal.type === 'troop') createTroop.mutate({ campId: modal.campId, name: d.name, number: d.number || 1 })
    else if (modal.type === 'squad') createSquad.mutate({ campId: modal.campId, troopId: modal.troopId, name: d.name, number: d.number || 1 })
    else if (modal.type === 'move') setModal(m => ({ ...m, type: 'move-confirm' }))
  }
  function confirmMove() {
    moveScout.mutate({ scoutId: modal.scout.id, squadId: modal.formData.squadId || null })
  }

  const allSquads = camps.flatMap(c => (c.troops || []).flatMap(t => (t.squads || []).map(s => ({ ...s, troopName: t.name, campName: c.name }))))
  const unassigned = allScouts.filter(s => !s.squadId)

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
                  <ChevronRight size={16} className="text-gray-400 transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0)' }} />
                </button>
                <button onClick={() => setModal({ type: 'troop', campId: camp.id, formData: { name: '', number: '' } })}
                  className="w-8 h-8 rounded-lg bg-scout-100 dark:bg-scout-700 flex items-center justify-center text-scout-600 dark:text-scout-300 hover:bg-scout-200 dark:hover:bg-scout-600 transition-all">
                  <Plus size={15} />
                </button>
                <button onClick={() => setConfirmDel({ label: `ค่าย "${camp.name}"`, onConfirm: () => deleteCamp.mutate(camp.id) })}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Troops */}
              {isOpen && (
                <div className="border-t border-gray-100 dark:border-scout-800">
                  {(camp.troops || []).length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">ยังไม่มีกอง — กด + เพื่อเพิ่ม</p>
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
                              <p className="text-xs text-gray-400">{(troop.squads || []).length} หมู่</p>
                            </div>
                            <ChevronRight size={13} className="text-gray-400 ml-auto transition-transform duration-200"
                              style={{ transform: troopOpen ? 'rotate(90deg)' : 'rotate(0)' }} />
                          </button>
                          <button onClick={() => setModal({ type: 'squad', campId: camp.id, troopId: troop.id, formData: { name: '', number: '' } })}
                            className="w-7 h-7 rounded-lg bg-scout-100 dark:bg-scout-700 flex items-center justify-center text-scout-600 dark:text-scout-300 hover:bg-scout-200 dark:hover:bg-scout-600 transition-all">
                            <Plus size={13} />
                          </button>
                          <button onClick={() => setConfirmDel({ label: `กอง "${troop.name}"`, onConfirm: () => deleteTroop.mutate({ campId: camp.id, troopId: troop.id }) })}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Squads */}
                        {troopOpen && (
                          <div className="px-4 py-2 space-y-2">
                            {(troop.squads || []).length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-2">ยังไม่มีหมู่</p>
                            ) : (troop.squads || []).map(squad => {
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
                                      <ChevronRight size={12} className="text-gray-400 ml-auto transition-transform duration-200"
                                        style={{ transform: squadOpen ? 'rotate(90deg)' : 'rotate(0)' }} />
                                    </button>
                                    <button onClick={() => setConfirmDel({ label: `หมู่ "${squad.name}"`, onConfirm: () => deleteSquad.mutate({ campId: camp.id, squadId: squad.id }) })}
                                      className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                                      <Trash2 size={12} />
                                    </button>
                                  </div>

                                  {squadOpen && (
                                    <div className="border-t border-gray-100 dark:border-scout-700 divide-y divide-gray-100 dark:divide-scout-700/50">
                                      {squadScouts.length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-3">ยังไม่มีลูกเสือ</p>
                                      ) : squadScouts.map(s => (
                                        <div key={s.id} className="flex items-center gap-2 px-3 py-2">
                                          <div className="w-6 h-6 rounded-full bg-scout-100 dark:bg-scout-700 flex items-center justify-center text-xs font-bold text-scout-700 dark:text-scout-300">
                                            {s.firstName?.[0]}
                                          </div>
                                          <p className="flex-1 text-xs text-gray-700 dark:text-scout-200">{s.firstName} {s.lastName}</p>
                                          <button onClick={() => setModal({ type: 'move', scout: s, formData: { squadId: s.squadId || '' } })}
                                            className="flex items-center gap-1 text-xs text-scout-600 dark:text-scout-400 hover:text-scout-800 px-2 py-1 rounded-lg bg-scout-50 dark:bg-scout-800 transition-all">
                                            <ArrowRight size={11} /> ย้าย
                                          </button>
                                        </div>
                                      ))}
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

      {/* ลูกเสือไม่มีหมู่ */}
      {unassigned.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold text-amber-500 mb-2">⚠️ ยังไม่มีหมู่ ({unassigned.length} คน)</p>
          <div className="space-y-2">
            {unassigned.map(s => (
              <div key={s.id} className="card flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-scout-100 dark:bg-scout-700 flex items-center justify-center text-sm font-bold text-scout-700 dark:text-scout-300">
                  {s.firstName?.[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-scout-900 dark:text-white">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-gray-400">{s.scoutCode}</p>
                </div>
                <button onClick={() => setModal({ type: 'move', scout: s, formData: { squadId: '' } })}
                  className="btn-primary text-xs px-3 py-1.5">
                  <ArrowRight size={13} /> ย้ายหมู่
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  : modal.type === 'troop' ? 'เพิ่มกอง'
                  : modal.type === 'squad' ? 'เพิ่มหมู่'
                  : `ย้าย "${modal.scout?.firstName}" ไปหมู่`}
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
                <select className="input" value={modal.formData.squadId}
                  onChange={e => setModal(m => ({ ...m, formData: { ...m.formData, squadId: e.target.value } }))}>
                  <option value="">ไม่มีหมู่ (ลอยอิสระ)</option>
                  {allSquads.map(s => <option key={s.id} value={s.id}>{s.campName} › {s.troopName} › {s.name}</option>)}
                </select>
              ) : (
                <>
                  <input className="input" placeholder="ชื่อ" autoFocus value={modal.formData.name}
                    onChange={e => setModal(m => ({ ...m, formData: { ...m.formData, name: e.target.value } }))} />
                  {modal.type !== 'camp' && (
                    <input className="input" type="number" placeholder="หมายเลข (1, 2, 3...)" value={modal.formData.number}
                      onChange={e => setModal(m => ({ ...m, formData: { ...m.formData, number: e.target.value } }))} />
                  )}
                </>
              )}
            </div>
            <div className="flex gap-2 px-5 pb-5">
              {modal.type === 'move-confirm' ? (
                <>
                  <button onClick={confirmMove} className="btn-primary flex-1">ยืนยัน ย้าย</button>
                  <button onClick={() => setModal(m => ({ ...m, type: 'move' }))} className="btn-secondary flex-1">ย้อนกลับ</button>
                </>
              ) : (
                <>
                  <button onClick={handleSubmit} className="btn-primary flex-1">บันทึก</button>
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
              <p className="text-xs text-gray-400 mt-1">ข้อมูลจะหายจาก database ทันที</p>
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

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  )
}