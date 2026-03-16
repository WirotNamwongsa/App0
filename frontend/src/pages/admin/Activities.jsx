import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { Trash2, Pencil, Plus, X, Calendar, Users, Star, Coffee } from 'lucide-react'
import EmptyState from '../../components/EmptyState'

const TYPES = [
  { value: 'MAIN', label: 'กิจกรรมหลัก', icon: '🏕️', color: 'emerald' },
  { value: 'SPECIAL', label: 'กิจกรรมพิเศษ', icon: '⭐', color: 'amber' },
  { value: 'FREE', label: 'กิจกรรมยามว่าง', icon: '☕', color: 'blue' }
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
    onSuccess: (data) => { 
      qc.invalidateQueries('activities')
      const msg = data.deleted?.schedules || data.deleted?.attendances 
        ? `ลบสำเร็จ (ลบตาราง ${data.deleted.schedules} รายการ, การเข้าร่วม ${data.deleted.attendances} รายการ)`
        : 'ลบสำเร็จ'
      toast.success(msg)
    }
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
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-display font-bold text-scout-900 dark:text-white">จัดการกิจกรรม</h1>
        <button onClick={openCreate} className="btn-primary text-sm px-4 py-2.5"><Plus size={16} /> สร้าง</button>
      </div>

      {/* Show Empty State when no activities */}
      {activities.length === 0 ? (
        <div className="space-y-3">
          <EmptyState
            icon="🏕️"
            title="ยังไม่มีกิจกรรมในระบบ"
            description="เริ่มต้นสร้างกิจกรรมแรกเพื่อให้ลูกเสือได้เข้าร่วมกิจกรรมมากมาย"
            buttonText="สร้างกิจกรรมแรก"
            buttonAction={openCreate}
          />
          
          {/* Activity Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TYPES.map(({ value: type, label, icon, color }) => (
              <div key={type} className={`bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-scout-800/30 dark:to-scout-700/20 rounded-xl p-6 border border-${color}-200 dark:border-scout-600/30`}>
                <div className="text-center">
                  <div className="text-3xl mb-3">{icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{label}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {type === 'MAIN' && 'กิจกรรมหลักที่ลูกเสือต้องเข้าร่วม'}
                    {type === 'SPECIAL' && 'กิจกรรมพิเศษที่เสริมสร้างทักษะ'}
                    {type === 'FREE' && 'กิจกรรมยามว่างเพื่อความสนุก'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
          
        <div className="space-y-4">
          {TYPES.map(({ value: type, label, icon, color }) => (
            <div key={type} className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{icon}</span>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{label}</p>
                <span className="text-xs text-gray-400">({grouped[type].length})</span>
              </div>
              {grouped[type].length === 0 ? (
                <div className={`bg-${color}-50 dark:bg-scout-800/20 rounded-xl p-6 border border-${color}-200 dark:border-scout-700/30 text-center`}>
                  <div className="text-2xl mb-2 opacity-50">{icon}</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ยังไม่มี{label.toLowerCase()}</p>
                  <button 
                    onClick={() => openCreate()}
                    className="mt-3 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white underline"
                  >
                    สร้าง{label.toLowerCase()}แรก
                  </button>
                </div>
              ) : (
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
              )}
            </div>
          ))}
        </div>
      )}

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