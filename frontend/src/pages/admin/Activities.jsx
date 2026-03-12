import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { Trash2, Pencil, Plus, X } from 'lucide-react'

const TYPES = [
  { value: 'MAIN', label: 'กิจกรรมหลัก' },
  { value: 'SPECIAL', label: 'กิจกรรมพิเศษ' },
  { value: 'FREE', label: 'กิจกรรมยามว่าง' }
]

export default function AdminActivities() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', type: 'MAIN', description: '', staffId: '' })
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const { data: activities = [] } = useQuery('activities', () => api.get('/activities'))
  const { data: users = [] } = useQuery('users', () => api.get('/admin/accounts'))

  const createMutation = useMutation(d => api.post('/activities', d), {
    onSuccess: () => { qc.invalidateQueries('activities'); closeForm(); toast.success('สร้างกิจกรรมสำเร็จ') }
  })
  const updateMutation = useMutation(({ id, ...d }) => api.patch(`/activities/${id}`, d), {
    onSuccess: () => { qc.invalidateQueries('activities'); closeForm(); toast.success('แก้ไขสำเร็จ') }
  })
  const deleteMutation = useMutation(id => api.delete(`/activities/${id}`), {
    onSuccess: () => { qc.invalidateQueries('activities'); toast.success('ลบสำเร็จ') }
  })

  const staffUsers = users.filter(u => u.role === 'STAFF')
  const grouped = { MAIN: [], SPECIAL: [], FREE: [] }
  activities.forEach(a => { if (grouped[a.type]) grouped[a.type].push(a) })

  function openCreate() {
    setEditId(null)
    setForm({ name: '', type: 'MAIN', description: '', staffId: '' })
    setShowForm(true)
  }

  function openEdit(a) {
    setEditId(a.id)
    setForm({ name: a.name, type: a.type, description: a.description || '', staffId: a.staffId || '' })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditId(null)
  }

  function submit() {
    if (editId) updateMutation.mutate({ id: editId, ...form })
    else createMutation.mutate(form)
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-display font-bold text-scout-900 dark:text-white">จัดการกิจกรรม</h1>
        <button onClick={openCreate} className="btn-primary text-sm px-4 py-2.5"><Plus size={16} /> สร้าง</button>
      </div>

      {TYPES.map(({ value: type, label }) => (
        <div key={type} className="mb-5">
          <p className="text-xs font-semibold text-gray-500 mb-2">{label}</p>
          <div className="space-y-2">
            {grouped[type].map(a => (
              <div key={a.id} className="card flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium text-scout-900 dark:text-white">{a.name}</p>
                  {a.staff && <p className="text-xs text-gray-400">ผู้จัด: {a.staff.name}</p>}
                </div>
                <span className="text-xs text-gray-400">{a._count?.attendances} คน</span>
                <button onClick={() => openEdit(a)} className="p-2 text-gray-400 hover:text-scout-700"><Pencil size={16} /></button>
                <button onClick={() => deleteMutation.mutate(a.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Popup Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', animation: 'fadeIn 0.2s ease' }}
          onClick={e => { if (e.target === e.currentTarget) closeForm() }}>
          <div
            className="bg-white dark:bg-scout-900 rounded-2xl w-full max-w-sm shadow-2xl"
            style={{ animation: 'slideUp 0.25s ease' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-scout-700">
              <h3 className="font-semibold text-scout-900 dark:text-white text-lg">
                {editId ? 'แก้ไขกิจกรรม' : 'สร้างกิจกรรมใหม่'}
              </h3>
              <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="px-5 py-4 space-y-3">
              <input className="input" placeholder="ชื่อกิจกรรม" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select className="input" value={form.staffId} onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))}>
                <option value="">ไม่มีผู้จัดกิจกรรม</option>
                {staffUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <textarea className="input h-20" placeholder="รายละเอียด" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={submit} className="btn-primary flex-1">บันทึก</button>
              <button onClick={closeForm} className="btn-secondary flex-1">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  )
}