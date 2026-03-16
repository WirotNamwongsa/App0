import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useState } from 'react'
import api from '../../lib/api'
import PageHeader from '../../components/PageHeader'
import toast from 'react-hot-toast'

export default function LeaderMember() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const { data: scout } = useQuery(['scout', id], () => api.get(`/scouts/${id}`))
  const [form, setForm] = useState({})

  const updateMutation = useMutation(
    data => api.patch(`/scouts/${id}`, data),
    { onSuccess: () => { qc.invalidateQueries(['scout', id]); setEditing(false); toast.success('บันทึกสำเร็จ') } }
  )

  function startEdit() {
    setForm({ firstName: scout.firstName, lastName: scout.lastName, nickname: scout.nickname || '', school: scout.school || '', province: scout.province || '', phone: scout.phone || '', email: scout.email || '' })
    setEditing(true)
  }

  return (
    <div className="page">
      <PageHeader title={scout ? `${scout.firstName} ${scout.lastName}` : '...'} showBack />
      {scout && !editing && (
        <>
          <div className="card mb-4 space-y-3">
            {[['ชื่อเล่น', scout.nickname], ['โรงเรียน', scout.school], ['จังหวัด', scout.province], ['เบอร์', scout.phone], ['อีเมล', scout.email]].map(([l, v]) => (
              <div key={l} className="flex justify-between">
                <span className="text-gray-500 text-sm">{l}</span>
                <span className="text-scout-900 text-sm font-medium">{v || '-'}</span>
              </div>
            ))}
          </div>
          <div className="card mb-4">
            <h3 className="text-sm font-semibold text-scout-800 mb-3">สถานะกิจกรรม</h3>
            {scout.attendances?.map(a => (
              <div key={a.id} className="flex items-center gap-2 py-1.5">
                <span>✅</span>
                <span className="text-sm text-scout-800">{a.activity?.name}</span>
              </div>
            ))}
          </div>
          <button onClick={startEdit} className="btn-primary w-full">แก้ไขข้อมูลส่วนตัว</button>
        </>
      )}
      {editing && (
        <div className="card space-y-3">
          {Object.entries(form).map(([key, val]) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1 block capitalize">{key}</label>
              <input className="input" value={val} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button onClick={() => updateMutation.mutate(form)} className="btn-primary flex-1">บันทึก</button>
            <button onClick={() => setEditing(false)} className="btn-secondary flex-1">ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  )
}
