import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Users, Shield, X, Plus, UserPlus, ChevronRight } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import api from '../../lib/api'
import toast from 'react-hot-toast'

// ─── Sub-components outside main to prevent focus loss ───────────────────────

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-scout-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        {children}
      </div>
    </div>
  )
}

const INPUT = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 bg-gray-50 dark:bg-scout-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-scout-400 focus:border-transparent transition text-sm"

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const PROVINCES = ["กรุงเทพมหานคร","กระบี่","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร","ขอนแก่น","จันทบุรี","ฉะเชิงเทรา","ชลบุรี","ชัยนาท","ชัยภูมิ","ชุมพร","เชียงราย","เชียงใหม่","ตรัง","ตราด","ตาก","นครนายก","นครปฐม","นครพนม","นครราชสีมา","นครศรีธรรมราช","นครสวรรค์","นนทบุรี","นราธิวาส","น่าน","บึงกาฬ","บุรีรัมย์","ปทุมธานี","ประจวบคีรีขันธ์","ปราจีนบุรี","ปัตตานี","พระนครศรีอยุธยา","พะเยา","พังงา","พัทลุง","พิจิตร","พิษณุโลก","เพชรบุรี","เพชรบูรณ์","แพร่","ภูเก็ต","มหาสารคาม","มุกดาหาร","แม่ฮ่องสอน","ยโสธร","ยะลา","ร้อยเอ็ด","ระนอง","ระยอง","ราชบุรี","ลพบุรี","ลำปาง","ลำพูน","เลย","ศรีสะเกษ","สกลนคร","สงขลา","สตูล","สมุทรปราการ","สมุทรสงคราม","สมุทรสาคร","สระแก้ว","สระบุรี","สิงห์บุรี","สุโขทัย","สุพรรณบุรี","สุราษฎร์ธานี","สุรินทร์","หนองคาย","หนองบัวลำภู","อ่างทอง","อำนาจเจริญ","อุดรธานี","อุตรดิตถ์","อุทัยธานี","อุบลราชธานี"]

const EMPTY = { username:'', password:'', confirmPassword:'', firstName:'', lastName:'', nickname:'', birthDate:'', school:'', province:'', phone:'', email:'', role:'SCOUT', prefix:'', allergies:'', congenitalDisease:'', campId:'', squadId:'' }

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminAddUsers() {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  const { data: camps = [] } = useQuery('camps', () => api.get('/camps'))
  const { data: squads = [] } = useQuery(
    ['squads', form.campId],
    () => form.campId ? api.get(`/camps/${form.campId}/squads`) : Promise.resolve([]),
    { enabled: !!form.campId }
  )

  const createMutation = useMutation(d => api.post('/admin/accounts', d), {
    onSuccess: () => {
      setForm(EMPTY)
      setErrors({})
      setShowModal(false)
      toast.success('สร้างบัญชีสำเร็จ')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'สร้างบัญชีไม่สำเร็จ')
    }
  })

  function validate() {
    const e = {}
    if (!form.username.trim()) e.username = 'กรุณากรอก Username'
    if (!form.password.trim()) e.password = 'กรุณากรอกรหัสผ่าน'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'รหัสผ่านไม่ตรงกัน'
    if (!form.firstName.trim()) e.firstName = 'กรุณากรอกชื่อจริง'
    if (!form.lastName.trim()) e.lastName = 'กรุณากรอกนามสกุล'
    if (!form.prefix) e.prefix = 'กรุณาเลือกคำนำหน้า'
    if (form.role === 'SCOUT') {
      if (!form.campId) e.campId = 'กรุณาเลือกค่าย'
      if (!form.nickname.trim()) e.nickname = 'กรุณากรอกชื่อเล่น'
      if (!form.school.trim()) e.school = 'กรุณากรอกสถานศึกษา'
      if (!form.province) e.province = 'กรุณาเลือกจังหวัด'
      if (!form.phone.trim()) e.phone = 'กรุณากรอกเบอร์โทรศัพท์'
      if (!form.squadId) e.squadId = 'กรุณาเลือกหมู่'
    } else if (form.role === 'CAMP_MANAGER') {
      if (!form.campId) e.campId = 'กรุณาเลือกค่าย'
      if (!form.email.trim()) e.email = 'กรุณากรอกอีเมล'
      if (!form.phone.trim()) e.phone = 'กรุณากรอกเบอร์โทรศัพท์'
    } else if (form.role === 'TROOP_LEADER') {
      if (!form.campId) e.campId = 'กรุณาเลือกค่าย'
      if (!form.school.trim()) e.school = 'กรุณากรอกสถานศึกษา'
      if (!form.phone.trim()) e.phone = 'กรุณากรอกเบอร์โทรศัพท์'
      if (!form.squadId) e.squadId = 'กรุณาเลือกหมู่'
      if (!form.nickname.trim()) e.nickname = 'กรุณากรอกชื่อเล่น'
    } else if (form.role === 'STAFF') {
      if (!form.school.trim()) e.school = 'กรุณากรอกสถานศึกษา'
      if (!form.phone.trim()) e.phone = 'กรุณากรอกเบอร์โทรศัพท์'
    } else if (form.role === 'ADMIN') {
      if (!form.email.trim()) e.email = 'กรุณากรอกอีเมล'
    }
    return e
  }

  function submit() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    const fullName = `${form.firstName} ${form.lastName}`.trim()
    const userData = { username: form.username, password: form.password, name: fullName, role: form.role, campId: form.campId || null, firstName: form.firstName, lastName: form.lastName, school: form.school, phone: form.phone, prefix: form.prefix }
    if (form.role === 'SCOUT') {
      Object.assign(userData, { nickname: form.nickname, birthDate: form.birthDate, province: form.province, email: form.email, allergies: form.allergies, congenitalDisease: form.congenitalDisease, squadId: form.squadId })
    } else {
      userData.squadId = form.squadId
      userData.province = form.province
      userData.email = form.email
    }
    createMutation.mutate(userData)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const isLeader = form.role === 'TROOP_LEADER'
  const isAdmin = form.role === 'ADMIN'
  const isCampManager = form.role === 'CAMP_MANAGER'
  const isStaff = form.role === 'STAFF'
  const isScout = form.role === 'SCOUT'

  return (
    <div className="page">
      <PageHeader title="เพิ่มผู้ใช้" />

      {/* Hero area */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Card Admin */}
        <button
          onClick={() => { set('role', 'ADMIN'); setShowModal(true) }}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 to-green-900 p-5 text-left shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <Shield size={20} className="text-white" />
            </div>
            <p className="text-white font-bold text-base leading-tight">ผู้ดูแลระบบ</p>
            <p className="text-green-300 text-xs mt-1">เพิ่มผู้ดูแลระบบ</p>
            <div className="mt-4 flex items-center gap-1 text-xs text-white/70 group-hover:text-white transition-colors">
              <span>เพิ่มเลย</span>
              <ChevronRight size={12} />
            </div>
          </div>
        </button>

        {/* Card ผู้ดูแลค่าย */}
        <button
          onClick={() => { set('role', 'CAMP_MANAGER'); setShowModal(true) }}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 to-green-900 p-5 text-left shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <Shield size={20} className="text-white" />
            </div>
            <p className="text-white font-bold text-base leading-tight">ผู้ดูแลค่าย</p>
            <p className="text-green-300 text-xs mt-1">เพิ่มผู้ดูแลค่าย</p>
            <div className="mt-4 flex items-center gap-1 text-xs text-white/70 group-hover:text-white transition-colors">
              <span>เพิ่มเลย</span>
              <ChevronRight size={12} />
            </div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Card ผู้กำกับ */}
        <button
          onClick={() => { set('role', 'TROOP_LEADER'); setShowModal(true) }}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 to-green-900 p-5 text-left shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <Shield size={20} className="text-white" />
            </div>
            <p className="text-white font-bold text-base leading-tight">ผู้กำกับหมู่</p>
            <p className="text-green-300 text-xs mt-1">เพิ่มผู้กำกับหมู่ลูกเสือ</p>
            <div className="mt-4 flex items-center gap-1 text-xs text-white/70 group-hover:text-white transition-colors">
              <span>เพิ่มเลย</span>
              <ChevronRight size={12} />
            </div>
          </div>
        </button>

        {/* Card ผู้จัดกิจกรรม */}
        <button
          onClick={() => { set('role', 'STAFF'); setShowModal(true) }}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 to-green-900 p-5 text-left shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <Shield size={20} className="text-white" />
            </div>
            <p className="text-white font-bold text-base leading-tight">ผู้จัดกิจกรรม</p>
            <p className="text-green-300 text-xs mt-1">เพิ่มผู้จัดกิจกรรม</p>
            <div className="mt-4 flex items-center gap-1 text-xs text-white/70 group-hover:text-white transition-colors">
              <span>เพิ่มเลย</span>
              <ChevronRight size={12} />
            </div>
          </div>
        </button>
      </div>

      {/* Card ลูกเสือ */}
      <div className="mb-8">
        <button
          onClick={() => { set('role', 'SCOUT'); setShowModal(true) }}
          className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 to-green-900 p-5 text-left shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <Users size={20} className="text-white" />
            </div>
            <p className="text-white font-bold text-base leading-tight">ลูกเสือ</p>
            <p className="text-green-300 text-xs mt-1">เพิ่มลูกเสือเข้าระบบ</p>
            <div className="mt-4 flex items-center gap-1 text-xs text-white/70 group-hover:text-white transition-colors">
              <span>เพิ่มเลย</span>
              <ChevronRight size={12} />
            </div>
          </div>
        </button>
      </div>

      {/* ══ Modal ══════════════════════════════════════════════════════════════ */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); setForm(EMPTY); setErrors({}) }}>
          {/* Header */}
          <div className={`px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100 dark:border-scout-700`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isAdmin ? 'bg-green-300 dark:bg-green-900/50' :
                isCampManager ? 'bg-green-300 dark:bg-green-900/50' :
                isStaff ? 'bg-green-300 dark:bg-green-900/50' :
                isLeader ? 'bg-green-300 dark:bg-green-900/50' : 
                'bg-green-300 dark:bg-green-900/40'
              }`}>
                <Shield size={18} className={`${
                  isAdmin ? 'text-green-800 dark:text-green-400' :
                  isCampManager ? 'text-green-800 dark:text-green-400' :
                  isStaff ? 'text-green-800 dark:text-green-400' :
                  isLeader ? 'text-green-800 dark:text-green-400' : 
                  'text-green-800 dark:text-green-400'
                }`} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {isAdmin ? 'เพิ่มผู้ดูแลระบบ' :
                   isCampManager ? 'เพิ่มผู้ดูแลค่าย' :
                   isStaff ? 'เพิ่มผู้จัดกิจกรรม' :
                   isLeader ? 'เพิ่มผู้กำกับหมู่' : 
                   'เพิ่มลูกเสือ'}
                </h3>
                <p className="text-xs text-gray-400">กรอกข้อมูลให้ครบถ้วน</p>
              </div>
            </div>
            <button
              onClick={() => { setShowModal(false); setForm(EMPTY); setErrors({}) }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-scout-700 text-gray-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Toggle role */}
          <div className="px-5 pt-4">
            <div className="flex bg-gray-100 dark:bg-scout-900 p-1 rounded-xl">
              {[
                {v:'ADMIN',l:'ผู้ดูแลระบบ'},
                {v:'CAMP_MANAGER',l:'ผู้ดูแลค่าย'},
                {v:'TROOP_LEADER',l:'ผู้กำกับหมู่'},
                {v:'STAFF',l:'ผู้จัดกิจกรรม'},
                {v:'SCOUT',l:'ลูกเสือ'}
              ].map(r => (
                <button
                  key={r.v}
                  onClick={() => set('role', r.v)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${form.role === r.v ? 'bg-white dark:bg-scout-700 text-scout-700 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  {r.l}
                </button>
              ))}
            </div>
          </div>

          {/* Form body */}
          <div className="px-5 py-4 space-y-4">

            {/* Section: บัญชี */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">ข้อมูลบัญชี</p>

            <Field label="ชื่อผู้ใช้" error={errors.username}>
              <input type="text" value={form.username} onChange={e => set('username', e.target.value)} className={INPUT} placeholder="เช่น leader_somchai" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="รหัสผ่าน" error={errors.password}>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} className={INPUT} placeholder="••••••••" />
              </Field>
              <Field label="ยืนยันรหัสผ่าน" error={errors.confirmPassword}>
                <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} className={INPUT} placeholder="••••••••" />
              </Field>
            </div>

            {/* Section: ข้อมูลส่วนตัว */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-1">ข้อมูลส่วนตัว</p>

            <Field label="คำนำหน้า" error={errors.prefix}>
              <select value={form.prefix} onChange={e => set('prefix', e.target.value)} className={INPUT}>
                <option value="">เลือกคำนำหน้า</option>
                {(isAdmin || isCampManager || isStaff || isLeader
                  ? ['นาย','นาง','นางสาว']
                  : ['ด.ช.','ด.ญ.','นาย','นาง','นางสาว']
                ).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="ชื่อจริง" error={errors.firstName}>
                <input type="text" value={form.firstName} onChange={e => set('firstName', e.target.value)} className={INPUT} placeholder="ชื่อจริง" />
              </Field>
              <Field label="นามสกุล" error={errors.lastName}>
                <input type="text" value={form.lastName} onChange={e => set('lastName', e.target.value)} className={INPUT} placeholder="นามสกุล" />
              </Field>
            </div>

            {!isLeader && (
              <Field label="ชื่อเล่น" error={errors.nickname}>
                <input type="text" value={form.nickname} onChange={e => set('nickname', e.target.value)} className={INPUT} placeholder="ชื่อเล่น" />
              </Field>
            )}

            {isLeader && (
              <Field label="ชื่อเล่น" error={errors.nickname}>
                <input type="text" value={form.nickname} onChange={e => set('nickname', e.target.value)} className={INPUT} placeholder="ชื่อเล่น" />
              </Field>
            )}

            {(!isAdmin && !isCampManager) && (
              <Field label="สถานศึกษา" error={errors.school}>
                <input type="text" value={form.school} onChange={e => set('school', e.target.value)} className={INPUT} placeholder="โรงเรียน / มหาวิทยาลัย" />
              </Field>
            )}
            <Field label="เบอร์โทรศัพท์" error={errors.phone}>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={INPUT} placeholder="0812345678" />
            </Field>

            {(isAdmin || isCampManager) && (
              <Field label="อีเมล" error={errors.email}>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={INPUT} placeholder="example@email.com" />
              </Field>
            )}

            {(isScout) && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="วันเกิด">
                    <input type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} className={INPUT} />
                  </Field>
                  <Field label="จังหวัด" error={errors.province}>
                    <select value={form.province} onChange={e => set('province', e.target.value)} className={INPUT}>
                      <option value="">เลือกจังหวัด</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="อีเมล">
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={INPUT} placeholder="example@email.com" />
                </Field>

                <Field label="การแพ้ (ถ้ามี)">
                  <input type="text" value={form.allergies} onChange={e => set('allergies', e.target.value)} className={INPUT} placeholder="เช่น แพ้ถั่ว แพ้ยาเพนิซิลิน" />
                </Field>

                <Field label="โรคประจำตัว (ถ้ามี)">
                  <input type="text" value={form.congenitalDisease} onChange={e => set('congenitalDisease', e.target.value)} className={INPUT} placeholder="เช่น โรคหอบหืด เบาหวาน" />
                </Field>
              </>
            )}

            {(isStaff || isLeader) && (
              <>
                <Field label="อีเมล">
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={INPUT} placeholder="example@email.com" />
                </Field>

                <Field label="จังหวัด" error={errors.province}>
                  <select value={form.province} onChange={e => set('province', e.target.value)} className={INPUT}>
                    <option value="">เลือกจังหวัด</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
              </>
            )}

            {(isCampManager || isScout || isLeader) && (
              <Field label="ค่าย" error={errors.campId}>
                <select value={form.campId} onChange={e => set('campId', e.target.value)} className={INPUT}>
                  <option value="">เลือกค่าย</option>
                  {camps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            )}

            {(isLeader || isScout) && form.campId && (
              <Field label="หมู่" error={errors.squadId}>
                <select value={form.squadId} onChange={e => set('squadId', e.target.value)} className={INPUT}>
                  <option value="">เลือกหมู่</option>
                  {squads.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.troop?.name} - {s.name} {s.leader ? `(${s.leader.name})` : '(ว่างอยู่)'}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pb-6 flex gap-3">
            <button
              onClick={() => { setShowModal(false); setForm(EMPTY); setErrors({}) }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-700 transition"
            >
              ยกเลิก
            </button>
            <button
              onClick={submit}
              disabled={createMutation.isLoading}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md transition disabled:opacity-50 ${isLeader ? 'bg-green-800 hover:bg-green-900 shadow-green-800/20' : 'bg-green-800 hover:bg-green-900 shadow-green-800/20'}`}
            >
              {createMutation.isLoading ? 'กำลังสร้าง...' : 'สร้างบัญชี'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
