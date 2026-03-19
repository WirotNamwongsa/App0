import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../lib/api'
import PageHeader from '../../components/PageHeader'
import toast from 'react-hot-toast'
import { Plus, Trash2, Pencil, X } from 'lucide-react'

const ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'CAMP_MANAGER', label: 'ผู้ดูแลค่ายย่อย' },
  { value: 'TROOP_LEADER', label: 'ผู้กำกับหมู่' },
  { value: 'STAFF', label: 'ผู้จัดกิจกรรม' },
  { value: 'SCOUT', label: 'ลูกเสือ' },
]
const CREATE_ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'CAMP_MANAGER', label: 'ผู้ดูแลค่ายย่อย' },
  { value: 'STAFF', label: 'ผู้จัดกิจกรรม' },
]
const roleBadge = {
  ADMIN: 'bg-red-100 text-red-700',
  CAMP_MANAGER: 'bg-blue-100 text-blue-700',
  STAFF: 'bg-orange-100 text-orange-700',
  TROOP_LEADER: 'bg-green-100 text-green-700',
  SCOUT: 'bg-gray-100 text-gray-700',
}

export default function AdminAccounts() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'ADMIN', campId: '', activityId: '', firstName: '', lastName: '', nickname: '', school: '', province: '', squadId: '', phone: '', email: '' })
  const [filterRole, setFilterRole] = useState('ALL')
  const [search, setSearch] = useState('')
  const [confirmDel, setConfirmDel] = useState(null)
  const [errors, setErrors] = useState({})

  const { data: accounts = [] } = useQuery('accounts', () => api.get('/admin/accounts'))
  const { data: camps = [] } = useQuery('camps', () => api.get('/camps'))
  const { data: activities = [] } = useQuery('activities', () => api.get('/activities'))

  const createMutation = useMutation(d => api.post('/admin/accounts', d), {
    onSuccess: () => { qc.invalidateQueries('accounts'); closeForm(); toast.success('สร้างบัญชีสำเร็จ') }
  })
  const updateMutation = useMutation(({ id, ...d }) => api.patch(`/admin/accounts/${id}`, d), {
    onSuccess: () => { qc.invalidateQueries('accounts'); closeForm(); toast.success('แก้ไขสำเร็จ') }
  })
  const deleteMutation = useMutation(id => api.delete(`/admin/accounts/${id}`), {
    onSuccess: () => { qc.invalidateQueries('accounts'); toast.success('ลบบัญชีสำเร็จ') }
  })

  const filtered = accounts.filter(a => {
    const matchRole = filterRole === 'ALL' || a.role === filterRole
    const matchSearch = !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.username?.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  function openCreate() {
    setEditId(null)
    setForm({ username: '', password: '', name: '', role: 'ADMIN', campId: '', activityId: '', firstName: '', lastName: '', nickname: '', school: '', province: '', squadId: '', phone: '', email: '' })
    setErrors({})
    setShowForm(true)
  }

  function openEdit(a) {
    setEditId(a.id)
    setForm({ username: a.username, password: '', name: a.name, role: a.role, campId: a.campId || '', activityId: a.activityId || '', firstName: '', lastName: '', nickname: '', school: '', province: '', squadId: a.scoutAccount?.squadId || '', phone: '', email: '' })
    setErrors({})
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditId(null)
    setErrors({})
  }

  function validate() {
    const e = {}
    if (!form.username.trim()) e.username = 'กรุณากรอก Username'
    if (!editId && !form.password.trim()) e.password = 'กรุณากรอกรหัสผ่าน'
    if (!form.name.trim()) e.name = 'กรุณากรอกชื่อ-สกุล'
    if (!form.role) e.role = 'กรุณาเลือก Role'
    if (form.role === 'CAMP_MANAGER' && !form.campId) e.campId = 'กรุณาเลือกค่ายย่อย'
    return e
  }

  function onRoleChange(nextRole) {
    setForm(f => ({
      ...f,
      role: nextRole,
      campId: (nextRole === 'ADMIN' || nextRole === 'STAFF') ? '' : f.campId,
      activityId: nextRole === 'STAFF' ? f.activityId : '',
    }))
    setErrors(er => ({ ...er, role: '', campId: '' }))
  }

  function submit() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    const payload = { ...form, campId: form.campId || null, activityId: form.activityId || null }
    if (form.role === 'ADMIN' || form.role === 'STAFF') payload.campId = null
    if (editId) updateMutation.mutate({ id: editId, ...payload })
    else createMutation.mutate(payload)
  }

  const formRoles = editId ? ROLES : CREATE_ROLES

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-display font-bold text-scout-900 dark:text-white">จัดการบัญชี</h1>
        <button onClick={openCreate} className="btn-primary text-sm px-4 py-2.5"><Plus size={16} /> เพิ่ม</button>
      </div>

      <div className="relative mb-3">
        <input className="input pl-9" placeholder="ค้นหาชื่อหรือ username..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
        )}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['ALL', ...ROLES.map(r => r.value)].map(r => (
          <button key={r} onClick={() => setFilterRole(r)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${filterRole === r ? 'bg-scout-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {r === 'ALL' ? 'ทั้งหมด' : ROLES.find(x => x.value === r)?.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(a => (
          <div key={a.id} className="card flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-scout-900 dark:text-white">{a.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadge[a.role]}`}>{ROLES.find(r => r.value === a.role)?.label}</span>
              </div>
              <p className="text-xs text-gray-400">@{a.username}{a.camp ? ` · ${a.camp.name}` : ''}</p>
            </div>
            <button onClick={() => openEdit(a)} className="p-2 text-gray-400 hover:text-scout-700"><Pencil size={16} /></button>
            <button onClick={() => setConfirmDel({ label: a.name, id: a.id })} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-scout-700">
        <p className="text-center text-sm text-gray-500 dark:text-scout-400">
          ทั้งหมด <span className="font-semibold text-scout-700 dark:text-scout-300">{filtered.length}</span> บัญชี
          {filterRole !== 'ALL' && (
            <span className="ml-1">
              (จากทั้งหมด <span className="font-semibold">{accounts.length}</span> บัญชี)
            </span>
          )}
        </p>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', animation: 'fadeIn 0.2s ease' }}
          onClick={e => { if (e.target === e.currentTarget) closeForm() }}>
          <div className="bg-white dark:bg-scout-900 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden"
            style={{ animation: 'slideUp 0.25s ease', maxHeight: '88vh' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-scout-700 flex-shrink-0">
              <h3 className="font-semibold text-scout-900 dark:text-white text-lg">
                {editId ? 'แก้ไขบัญชี' : 'สร้างบัญชีใหม่'}
              </h3>
              <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X size={20} /></button>
            </div>

            <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1 modal-scroll">
              <div>
                <input className={`input ${errors.username ? 'border-red-400 dark:border-red-500' : ''}`} placeholder="Username *" value={form.username}
                  onChange={e => { setForm(f => ({ ...f, username: e.target.value })); setErrors(er => ({ ...er, username: '' })) }} />
                {errors.username && <p className="text-xs text-red-500 mt-1 ml-1">{errors.username}</p>}
              </div>
              <div>
                <input className={`input ${errors.password ? 'border-red-400 dark:border-red-500' : ''}`} type="password"
                  placeholder={editId ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน *'}
                  value={form.password} onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: '' })) }} />
                {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password}</p>}
              </div>
              <div>
                <input className={`input ${errors.name ? 'border-red-400 dark:border-red-500' : ''}`} placeholder="ชื่อ-สกุล *" value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })) }} />
                {errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.name}</p>}
              </div>
              <div>
                <select className={`input ${errors.role ? 'border-red-400 dark:border-red-500' : ''}`} value={form.role}
                  onChange={e => onRoleChange(e.target.value)}>
                  {formRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {errors.role && <p className="text-xs text-red-500 mt-1 ml-1">{errors.role}</p>}
              </div>
              {form.role === 'CAMP_MANAGER' && (
                <div>
                  <select className={`input ${errors.campId ? 'border-red-400 dark:border-red-500' : ''}`} value={form.campId}
                    onChange={e => { setForm(f => ({ ...f, campId: e.target.value })); setErrors(er => ({ ...er, campId: '' })) }}>
                    <option value="">เลือกค่ายย่อย *</option>
                    {camps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.campId && <p className="text-xs text-red-500 mt-1 ml-1">{errors.campId}</p>}
                </div>
              )}
              {form.role === 'STAFF' && (
                <select className="input" value={form.activityId} onChange={e => setForm(f => ({ ...f, activityId: e.target.value }))}>
                  <option value="">เลือกกิจกรรมที่รับผิดชอบ</option>
                  {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
            </div>

            <div className="flex gap-2 px-5 pb-5 flex-shrink-0">
              <button onClick={submit} className="btn-primary flex-1">บันทึก</button>
              <button onClick={closeForm} className="btn-secondary flex-1">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

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
              <p className="font-bold text-scout-900 dark:text-white text-lg">ลบบัญชี?</p>
              <p className="text-sm text-gray-500 dark:text-scout-400 mt-1">
                ต้องการลบ <span className="font-semibold text-red-500">{confirmDel.label}</span> ใช่หรือไม่?
              </p>
              <p className="text-xs text-gray-400 mt-1">ข้อมูลจะหายจาก database ทันที</p>
            </div>
            <div className="flex gap-2 p-4">
              <button onClick={() => { deleteMutation.mutate(confirmDel.id); setConfirmDel(null) }}
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
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  )
}