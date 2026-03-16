import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import PageHeader from '../../components/PageHeader'
import toast from 'react-hot-toast'
import { Plus, ChevronRight, Trash2, LogOut } from 'lucide-react'

export default function CampStructure() {
  const { user, logout } = useAuthStore()
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState({})
  const [showAddSquad, setShowAddSquad] = useState(null)
  const [squadForm, setSquadForm] = useState({ name: '', number: '' })

  const handleLogout = () => {
    logout()
  }

  const { data: camp } = useQuery('camp-my', () => api.get('/camps/my'))

  const addSquadMutation = useMutation(
    ({ troopId }) => api.post(`/camps/${user.campId}/troops/${troopId}/squads`, squadForm),
    { onSuccess: () => { qc.invalidateQueries('camp-my'); setShowAddSquad(null); toast.success('เพิ่มหมู่สำเร็จ') } }
  )

  return (
    <div className="page">
      <PageHeader title="โครงสร้างค่าย" />
      {camp?.troops?.map(troop => (
        <div key={troop.id} className="card mb-3">
          <button onClick={() => setExpanded(e => ({ ...e, [troop.id]: !e[troop.id] }))}
            className="w-full flex items-center justify-between">
            <div>
              <p className="font-display font-semibold text-scout-900">กอง {troop.number}</p>
              <p className="text-xs text-gray-400">{troop.squads?.reduce((s, sq) => s + (sq._count?.scouts || 0), 0)} คน · {troop.squads?.length} หมู่</p>
            </div>
            <ChevronRight size={18} className={`text-gray-400 transition-transform ${expanded[troop.id] ? 'rotate-90' : ''}`} />
          </button>

          {expanded[troop.id] && (
            <div className="mt-3 space-y-2 border-t pt-3">
              {troop.squads?.map(squad => (
                <div key={squad.id} className="flex items-center justify-between bg-scout-50 rounded-xl px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-scout-800">หมู่ {squad.number} · {squad.name}</p>
                    <p className="text-xs text-gray-400">{squad._count?.scouts || 0} คน{squad.leader ? ` · ผู้กำกับ: ${squad.leader.name}` : ''}</p>
                  </div>
                </div>
              ))}

              {showAddSquad === troop.id ? (
                <div className="bg-scout-50 rounded-xl p-3 space-y-2">
                  <input className="input text-sm" placeholder="ชื่อหมู่" value={squadForm.name} onChange={e => setSquadForm(f => ({ ...f, name: e.target.value }))} />
                  <input className="input text-sm" type="number" placeholder="หมายเลขหมู่" value={squadForm.number} onChange={e => setSquadForm(f => ({ ...f, number: e.target.value }))} />
                  <div className="flex gap-2">
                    <button onClick={() => addSquadMutation.mutate({ troopId: troop.id })} className="btn-primary flex-1 text-sm py-2">บันทึก</button>
                    <button onClick={() => setShowAddSquad(null)} className="btn-secondary flex-1 text-sm py-2">ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddSquad(troop.id)} className="w-full flex items-center gap-2 text-scout-600 text-sm py-2 px-3 hover:bg-scout-50 rounded-xl">
                  <Plus size={16} /> เพิ่มหมู่
                </button>
              )}
            </div>
          )}
        </div>
      ))}
      
      <div className="md:hidden mb-4">
        <button 
          onClick={handleLogout}
          className="bg-white shadow-lg rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors"
          title="ออกจากระบบ"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">ออก</span>
        </button>
      </div>
      
    </div>
  )
}
