import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Shuffle, Settings, Check, X, ChevronDown, ChevronUp, Users, ArrowRight, RefreshCw } from 'lucide-react'

// ── helpers ───────────────────────────────────────────────────────────────────
function genderLabel(g) {
  if (g === 'male' || g === 'ชาย') return 'ชาย'
  if (g === 'female' || g === 'หญิง') return 'หญิง'
  return 'ไม่ระบุ'
}
function genderColor(g) {
  const l = genderLabel(g)
  if (l === 'ชาย') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  if (l === 'หญิง') return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
  return 'bg-gray-100 text-gray-600'
}

// สุ่มจัดกอง: แยกชาย/หญิง แล้วจับกลุ่มทีละ 4
function autoOrganize(squads) {
  const male = squads.filter(s => genderLabel(s.gender) === 'ชาย')
  const female = squads.filter(s => genderLabel(s.gender) === 'หญิง')
  const other = squads.filter(s => genderLabel(s.gender) === 'ไม่ระบุ')

  // shuffle
  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)
  const maleShuffled = shuffle(male)
  const femaleShuffled = shuffle(female)
  const otherShuffled = shuffle(other)

  const troops = []
  let troopNum = 1

  // จัดกองชาย
  for (let i = 0; i < maleShuffled.length; i += 4) {
    troops.push({
      tempId: `troop-${troopNum}`,
      number: troopNum++,
      gender: 'ชาย',
      squads: maleShuffled.slice(i, i + 4)
    })
  }
  // จัดกองหญิง
  for (let i = 0; i < femaleShuffled.length; i += 4) {
    troops.push({
      tempId: `troop-${troopNum}`,
      number: troopNum++,
      gender: 'หญิง',
      squads: femaleShuffled.slice(i, i + 4)
    })
  }
  // ไม่ระบุเพศ
  for (let i = 0; i < otherShuffled.length; i += 4) {
    troops.push({
      tempId: `troop-${troopNum}`,
      number: troopNum++,
      gender: 'ไม่ระบุ',
      squads: otherShuffled.slice(i, i + 4)
    })
  }

  return troops
}

export default function TroopOrganizer() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const [mode, setMode] = useState(null) // null | 'auto' | 'manual'
  const [troops, setTroops] = useState([]) // ผลลัพธ์การจัด
  const [expanded, setExpanded] = useState({})
  const [confirmModal, setConfirmModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [warnings, setWarnings] = useState([]) // ข้อความเตือนก่อน confirm

  // manual: ลากวางหมู่
  const [manualTroops, setManualTroops] = useState([{ tempId: 't1', number: 1, gender: 'ชาย', squads: [] }])
  const [dragging, setDragging] = useState(null) // squadId ที่กำลังย้าย
  const [squadGenders, setSquadGenders] = useState({}) // squadId -> gender สำหรับ manual

  const { data: camp, isLoading } = useQuery('camp-my', () => api.get('/camps/my'))

  // รวมหมู่ทั้งหมดในค่าย
  const allSquads = camp?.troops?.flatMap(t =>
    t.squads?.map(s => ({ ...s, troopName: t.name, troopNumber: t.number }))
  ) || []

  // ── AUTO MODE ──────────────────────────────────────────────────────────────
  function runAuto() {
    // ต้องการ gender ของหมู่ก่อน ถ้ายังไม่มีให้ขอ
    const needGender = allSquads.filter(s => !s.gender && !squadGenders[s.id])
    if (needGender.length > 0) {
      toast('กรุณากำหนดเพศของหมู่ทุกหมู่ก่อนสุ่ม', { icon: '⚠️' })
      return
    }
    const squadsWithGender = allSquads.map(s => ({ ...s, gender: squadGenders[s.id] || s.gender }))
    const result = autoOrganize(squadsWithGender)
    setTroops(result)
    setMode('auto')
  }

  function rerunAuto() {
    const squadsWithGender = allSquads.map(s => ({ ...s, gender: squadGenders[s.id] || s.gender }))
    const result = autoOrganize(squadsWithGender)
    setTroops(result)
  }

  // ── MANUAL MODE ────────────────────────────────────────────────────────────
  function addManualTroop() {
    const n = manualTroops.length + 1
    setManualTroops(t => [...t, { tempId: `t${Date.now()}`, number: n, gender: 'ชาย', squads: [] }])
  }

  function removeManualTroop(tempId) {
    setManualTroops(t => {
      const troop = t.find(x => x.tempId === tempId)
      // คืนหมู่กลับไปใน unassigned
      return t.filter(x => x.tempId !== tempId)
    })
  }

  function assignSquad(squadId, targetTroopTempId) {
    setManualTroops(prev => {
      // ลบออกจากกองเดิมก่อน
      const cleared = prev.map(t => ({ ...t, squads: t.squads.filter(s => s.id !== squadId) }))
      const squad = allSquads.find(s => s.id === squadId)
      if (!squad) return cleared
      return cleared.map(t =>
        t.tempId === targetTroopTempId ? { ...t, squads: [...t.squads, squad] } : t
      )
    })
  }

  function removeSquadFromTroop(squadId, troopTempId) {
    setManualTroops(prev =>
      prev.map(t =>
        t.tempId === troopTempId ? { ...t, squads: t.squads.filter(s => s.id !== squadId) } : t
      )
    )
  }

  const assignedSquadIds = manualTroops.flatMap(t => t.squads.map(s => s.id))
  const unassignedSquads = allSquads.filter(s => !assignedSquadIds.includes(s.id))

  // ── SAVE ───────────────────────────────────────────────────────────────────
  function checkAndConfirm() {
    const currentTroops = mode === 'auto' ? troops : manualTroops.filter(t => t.squads.length > 0)
    const warns = []

    for (const troop of currentTroops) {
      for (const sq of troop.squads) {
        const squadGender = genderLabel(squadGenders[sq.id] || sq.gender)
        const troopGender = troop.gender

        // เช็คลูกเสือในหมู่ว่าเพศตรงกับกองไหม
        if (sq.scouts && sq.scouts.length > 0 && troopGender !== 'ไม่ระบุ') {
          const mismatch = sq.scouts.filter(s => {
            const sg = genderLabel(s.gender)
            return sg !== 'ไม่ระบุ' && sg !== troopGender
          })
          if (mismatch.length > 0) {
            warns.push(`หมู่ "${sq.name}" กำหนดเป็นกอง${troopGender} แต่มีลูกเสือ${mismatch.length === sq.scouts.length ? '' : 'บางคน'}เพศ${mismatch[0] ? genderLabel(mismatch[0].gender) : ''}อยู่ ${mismatch.length} คน`)
          }
        }

        // เช็คเพศหมู่ vs เพศกอง
        if (squadGender !== 'ไม่ระบุ' && troopGender !== 'ไม่ระบุ' && squadGender !== troopGender) {
          warns.push(`หมู่ "${sq.name}" (${squadGender}) อยู่ในกอง${troopGender} — เพศไม่ตรงกัน`)
        }
      }
    }

    setWarnings(warns)
    setConfirmModal(true)
  }

  async function save() {
    setSaving(true)
    try {
      const payload = mode === 'auto' ? troops : manualTroops.filter(t => t.squads.length > 0)
      await api.post(`/camps/${user.campId}/organize-troops`, { troops: payload })
      toast.success('จัดกองสำเร็จ!')
      qc.invalidateQueries('camp-my')
      setConfirmModal(false)
      setMode(null)
    } catch (e) {
      toast.error(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-scout-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // ── GENDER SETUP (ก่อนสุ่ม) ────────────────────────────────────────────────
  const needSetup = allSquads.some(s => !s.gender && !squadGenders[s.id])

  return (
    <div className="page">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-scout-900 dark:text-white">จัดกอง</h1>
        <p className="text-sm text-gray-400 mt-1">จัดหมู่ลูกเสือเข้ากองโดยแยกตามเพศ</p>
      </div>

      {/* กำหนดเพศหมู่ */}
      <div className="card mb-5">
        <p className="text-sm font-semibold text-scout-900 dark:text-white mb-3">
          ⚥ กำหนดเพศของแต่ละหมู่
        </p>
        <div className="space-y-2">
          {allSquads.map(squad => (
            <div key={squad.id} className="flex items-center justify-between bg-gray-50 dark:bg-scout-800 rounded-xl px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-scout-900 dark:text-white">
                  กอง {squad.troopNumber} · {squad.name}
                </p>
                <p className="text-xs text-gray-400">{squad._count?.scouts || 0} คน</p>
              </div>
              <div className="flex gap-2">
                {['ชาย', 'หญิง', 'ไม่ระบุ'].map(g => {
                  const current = squadGenders[squad.id] || squad.gender || ''
                  const active = genderLabel(current) === g
                  return (
                    <button key={g}
                      onClick={() => setSquadGenders(prev => ({ ...prev, [squad.id]: g }))}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${active
                        ? g === 'ชาย' ? 'bg-blue-500 text-white' : g === 'หญิง' ? 'bg-pink-500 text-white' : 'bg-gray-500 text-white'
                        : 'bg-gray-200 dark:bg-scout-700 text-gray-600 dark:text-gray-300'}`}>
                      {g}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* เลือกโหมด */}
      {!mode && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={runAuto}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-scout-500 to-scout-700 p-5 text-left shadow-lg hover:shadow-xl active:scale-95 transition-all">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <Shuffle size={20} className="text-white" />
            </div>
            <p className="text-white font-bold">สุ่มอัตโนมัติ</p>
            <p className="text-scout-200 text-xs mt-1">ระบบจัดให้อัตโนมัติ แยกเพศ 4 หมู่/กอง</p>
          </button>

          <button onClick={() => setMode('manual')}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-5 text-left shadow-lg hover:shadow-xl active:scale-95 transition-all">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <Settings size={20} className="text-white" />
            </div>
            <p className="text-white font-bold">จัดเอง</p>
            <p className="text-emerald-100 text-xs mt-1">กำหนดเองว่าหมู่ใดอยู่กองใด</p>
          </button>
        </div>
      )}

      {/* ── AUTO RESULT ── */}
      {mode === 'auto' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-scout-900 dark:text-white">ผลการสุ่ม ({troops.length} กอง)</p>
            <div className="flex gap-2">
              <button onClick={rerunAuto}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-gray-100 dark:bg-scout-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition">
                <RefreshCw size={13} /> สุ่มใหม่
              </button>
              <button onClick={() => setMode(null)}
                className="text-xs px-3 py-2 rounded-xl bg-gray-100 dark:bg-scout-800 text-gray-600 dark:text-gray-300">
                ยกเลิก
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {troops.map(troop => (
              <div key={troop.tempId} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${troop.gender === 'ชาย' ? 'bg-blue-500' : troop.gender === 'หญิง' ? 'bg-pink-500' : 'bg-gray-500'}`}>
                      {troop.number}
                    </div>
                    <div>
                      <p className="font-semibold text-scout-900 dark:text-white text-sm">กองที่ {troop.number}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${genderColor(troop.gender)}`}>{troop.gender}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{troop.squads.length} หมู่</span>
                </div>
                <div className="space-y-1.5">
                  {troop.squads.map((sq, i) => (
                    <div key={sq.id} className="flex items-center gap-2 bg-gray-50 dark:bg-scout-800 rounded-lg px-3 py-2">
                      <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                      <p className="text-sm text-scout-900 dark:text-white flex-1">{sq.name}</p>
                      <span className="text-xs text-gray-400">{sq._count?.scouts || 0} คน</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => checkAndConfirm()}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2">
            <Check size={18} /> ยืนยันการจัดกอง
          </button>
        </div>
      )}

      {/* ── MANUAL MODE ── */}
      {mode === 'manual' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-scout-900 dark:text-white">จัดกองเอง</p>
            <button onClick={() => setMode(null)} className="text-xs px-3 py-2 rounded-xl bg-gray-100 dark:bg-scout-800 text-gray-600 dark:text-gray-300">ยกเลิก</button>
          </div>

          {/* หมู่ที่ยังไม่ได้จัด */}
          {unassignedSquads.length > 0 && (
            <div className="card mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">หมู่ที่ยังไม่ได้จัด ({unassignedSquads.length})</p>
              <div className="flex flex-wrap gap-2">
                {unassignedSquads.map(sq => (
                  <div key={sq.id} className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-2.5 py-1.5">
                    <span className="text-xs font-medium text-yellow-800 dark:text-yellow-300">{sq.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${genderColor(squadGenders[sq.id] || sq.gender)}`}>
                      {genderLabel(squadGenders[sq.id] || sq.gender)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* กองต่างๆ */}
          <div className="space-y-3 mb-4">
            {manualTroops.map((troop, idx) => (
              <div key={troop.tempId} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${troop.gender === 'ชาย' ? 'bg-blue-500' : troop.gender === 'หญิง' ? 'bg-pink-500' : 'bg-gray-500'}`}>
                      {troop.number}
                    </div>
                    <input
                      className="text-sm font-semibold bg-transparent text-scout-900 dark:text-white border-b border-gray-300 dark:border-scout-600 focus:outline-none px-1"
                      value={`กองที่ ${troop.number}`}
                      readOnly
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {/* เปลี่ยนเพศกอง */}
                    <div className="flex gap-1">
                      {['ชาย', 'หญิง', 'ไม่ระบุ'].map(g => (
                        <button key={g}
                          onClick={() => setManualTroops(t => t.map(x => x.tempId === troop.tempId ? { ...x, gender: g } : x))}
                          className={`text-xs px-2 py-0.5 rounded-md transition-all ${troop.gender === g
                            ? g === 'ชาย' ? 'bg-blue-500 text-white' : g === 'หญิง' ? 'bg-pink-500 text-white' : 'bg-gray-500 text-white'
                            : 'bg-gray-100 dark:bg-scout-700 text-gray-500'}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => removeManualTroop(troop.tempId)}
                      className="text-red-400 hover:text-red-600 p-1">
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* หมู่ในกองนี้ */}
                <div className="space-y-1.5 mb-2">
                  {troop.squads.map((sq, i) => (
                    <div key={sq.id} className="flex items-center gap-2 bg-gray-50 dark:bg-scout-800 rounded-lg px-3 py-2">
                      <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                      <p className="text-sm flex-1 text-scout-900 dark:text-white">{sq.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${genderColor(squadGenders[sq.id] || sq.gender)}`}>
                        {genderLabel(squadGenders[sq.id] || sq.gender)}
                      </span>
                      <button onClick={() => removeSquadFromTroop(sq.id, troop.tempId)}
                        className="text-red-400 hover:text-red-600 p-0.5">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {troop.squads.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">ยังไม่มีหมู่</p>
                  )}
                </div>

                {/* dropdown เพิ่มหมู่เข้ากอง */}
                {troop.squads.length < 4 && unassignedSquads.length > 0 && (
                  <select
                    className="input text-sm mt-1"
                    value=""
                    onChange={e => { if (e.target.value) assignSquad(e.target.value, troop.tempId) }}>
                    <option value="">+ เพิ่มหมู่เข้ากอง...</option>
                    {unassignedSquads.map(sq => (
                      <option key={sq.id} value={sq.id}>
                        {sq.name} ({genderLabel(squadGenders[sq.id] || sq.gender)})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>

          <button onClick={addManualTroop}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-scout-600 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:border-scout-400 hover:text-scout-500 transition mb-4">
            + เพิ่มกอง
          </button>

          <button
            onClick={() => checkAndConfirm()}
            disabled={manualTroops.every(t => t.squads.length === 0)}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50">
            <Check size={18} /> ยืนยันการจัดกอง
          </button>
        </div>
      )}

      {/* ── CONFIRM MODAL ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmModal(false) }}>
          <div className="bg-white dark:bg-scout-900 rounded-2xl w-full max-w-sm shadow-2xl text-center p-6">
            <div className="w-14 h-14 rounded-full bg-scout-100 dark:bg-scout-800 flex items-center justify-center mx-auto mb-3">
              <Check size={24} className="text-scout-600" />
            </div>
            <p className="font-bold text-scout-900 dark:text-white text-lg mb-1">ยืนยันการจัดกอง?</p>
            <p className="text-sm text-gray-500 mb-1">
              จะจัด <span className="font-semibold text-scout-600">
                {(mode === 'auto' ? troops : manualTroops.filter(t => t.squads.length > 0)).length} กอง
              </span>
            </p>
            <p className="text-xs text-red-400 mb-3">⚠️ กองและหมู่ที่มีอยู่เดิมจะถูกแทนที่</p>
            {warnings.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 mb-4 text-left">
                <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400 mb-2">⚠️ พบข้อมูลที่ควรตรวจสอบ</p>
                <ul className="space-y-1">
                  {warnings.map((w, i) => (
                    <li key={i} className="text-xs text-yellow-700 dark:text-yellow-300">• {w}</li>
                  ))}
                </ul>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 font-medium">ยังสามารถยืนยันได้ถ้าต้องการ</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-scout-700 text-sm font-semibold text-gray-600 dark:text-gray-300">
                ยกเลิก
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 text-white text-sm font-semibold disabled:opacity-50">
                {saving ? 'กำลังบันทึก...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}