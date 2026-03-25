import { useState } from 'react'
import { useQuery, useMutation } from 'react-query'
import { Users, Shield, X, ChevronRight } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import api from '../../lib/api'
import toast from 'react-hot-toast'

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

const EMPTY = {
  username: '', password: '', confirmPassword: '',
  firstName: '', lastName: '', nickname: '', birthDate: '',
  school: '', province: '', phone: '', email: '',
  role: 'SCOUT', prefix: '', allergies: '', congenitalDisease: '',
  campId: '', squadId: '',
  citizenId: ''
}

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

    // ฟิลด์พื้นฐานทุก role
    if (!form.username.trim()) e.username = 'กรุณากรอกชื่อผู้ใช้'
    if (!form.firstName.trim()) e.firstName = 'กรุณากรอกชื่อจริง'
    if (!form.lastName.trim()) e.lastName = 'กรุณากรอกนามสกุล'
    if (!form.prefix) e.prefix = 'กรุณาเลือกคำนำหน้า'
    if (!form.campId) e.campId = 'กรุณาเลือกค่าย'

    if (form.role === 'SCOUT') {
      // รหัสผ่านของลูกเสือใช้เลขบัตรประชาชน
      if (!form.citizenId.trim()) e.citizenId = 'กรุณากรอกเลขบัตรประชาชน'
      else if (!/^\d{13}$/.test(form.citizenId.trim())) e.citizenId = 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก'
      if (!form.nickname.trim()) e.nickname = 'กรุณากรอกชื่อเล่น'
      if (!form.school.trim()) e.school = 'กรุณากรอกสถานศึกษา'
      if (!form.province) e.province = 'กรุณาเลือกจังหวัด'
      if (!form.phone.trim()) e.phone = 'กรุณากรอกเบอร์โทรศัพท์'
      if (!form.squadId) e.squadId = 'กรุณาเลือกหมู่'
    } else if (form.role === 'TROOP_LEADER') {
      if (!form.password.trim()) e.password = 'กรุณากรอกรหัสผ่าน'
      if (form.password !== form.confirmPassword) e.confirmPassword = 'รหัสผ่านไม่ตรงกัน'
      if (!form.nickname.trim()) e.nickname = 'กรุณากรอกชื่อเล่น'
      if (!form.school.trim()) e.school = 'กรุณากรอกสถานศึกษา'
      if (!form.phone.trim()) e.phone = 'กรุณากรอกเบอร์โทรศัพท์'
      if (!form.squadId) e.squadId = 'กรุณาเลือกหมู่'
    } else if (form.role === 'CAMP_MANAGER') {
      if (!form.password.trim()) e.password = 'กรุณากรอกรหัสผ่าน'
      if (form.password !== form.confirmPassword) e.confirmPassword = 'รหัสผ่านไม่ตรงกัน'
      if (!form.email.trim()) e.email = 'กรุณากรอกอีเมล'
      if (!form.phone.trim()) e.phone = 'กรุณากรอกเบอร์โทรศัพท์'
    } else if (form.role === 'STAFF') {
      if (!form.password.trim()) e.password = 'กรุณากรอกรหัสผ่าน'
      if (form.password !== form.confirmPassword) e.confirmPassword = 'รหัสผ่านไม่ตรงกัน'
      if (!form.school.trim()) e.school = 'กรุณากรอกสถานศึกษา'
      if (!form.phone.trim()) e.phone = 'กรุณากรอกเบอร์โทรศัพท์'
    } else if (form.role === 'ADMIN') {
      if (!form.password.trim()) e.password = 'กรุณากรอกรหัสผ่าน'
      if (form.password !== form.confirmPassword) e.confirmPassword = 'รหัสผ่านไม่ตรงกัน'
      if (!form.email.trim()) e.email = 'กรุณากรอกอีเมล'
    }

    return e
  }

  function submit() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})

    const fullName = `${form.firstName} ${form.lastName}`.trim()

    const userData = {
      username: form.username,
      password: form.role === 'SCOUT' ? form.citizenId : form.password,
      name: fullName,
      role: form.role,
      campId: form.campId || null,
      firstName: form.firstName,
      lastName: form.lastName,
      prefix: form.prefix,
    }

    if (form.role === 'SCOUT') {
      Object.assign(userData, {
        nickname: form.nickname,
        birthDate: form.birthDate,
        province: form.province,
        school: form.school,
        phone: form.phone,
        email: form.email,
        allergies: form.allergies,
        congenitalDisease: form.congenitalDisease,
        squadId: form.squadId,
      })
    } else if (form.role === 'TROOP_LEADER') {
      Object.assign(userData, {
        nickname: form.nickname,
        school: form.school,
        phone: form.phone,
        squadId: form.squadId,
      })
    } else if (form.role === 'CAMP_MANAGER') {
      Object.assign(userData, {
        email: form.email,
        phone: form.phone,
      })
    } else if (form.role === 'STAFF') {
      Object.assign(userData, {
        school: form.school,
        phone: form.phone,
      })
    } else if (form.role === 'ADMIN') {
      Object.assign(userData, {
        email: form.email,
      })
    }

    createMutation.mutate(userData)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const isScout = form.role === 'SCOUT'
  const isLeader = form.role === 'TROOP_LEADER'
  const isAdmin = form.role === 'ADMIN'
  const isCampManager = form.role === 'CAMP_MANAGER'
  const isStaff = form.role === 'STAFF'

  const roleConfig = {
    ADMIN:         { label: 'ผู้ดูแลระบบ',   sub: 'เพิ่มผู้ดูแลระบบ',        icon: Shield },
    CAMP_MANAGER:  { label: 'ผู้ดูแลค่าย',   sub: 'เพิ่มผู้ดูแลค่าย',         icon: Shield },
    TROOP_LEADER:  { label: 'ผู้กำกับหมู่',   sub: 'เพิ่มผู้กำกับหมู่ลูกเสือ', icon: Shield },
    STAFF:         { label: 'ผู้จัดกิจกรรม', sub: 'เพิ่มผู้จัดกิจกรรม',       icon: Shield },
    SCOUT:         { label: 'ลูกเสือ',        sub: 'เพิ่มลูกเสือเข้าระบบ',     icon: Users  },
  }

  const modalTitle = roleConfig[form.role]?.label ? `เพิ่ม${roleConfig[form.role].label}` : 'เพิ่มผู้ใช้'

  return (
    <div className="page">
      <PageHeader title="เพิ่มผู้ใช้" />

      {/* การ์ดเลือกประเภทผู้ใช้ */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {['ADMIN', 'CAMP_MANAGER', 'TROOP_LEADER', 'STAFF'].map(role => {
          const Icon = roleConfig[role].icon
          return (
            <button
              key={role}
              onClick={() => { set('role', role); setShowModal(true) }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 to-green-900 p-5 text-left shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -right-2 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <Icon size={20} className="text-white" />
                </div>
                <p className="text-white font-bold text-base leading-tight">{roleConfig[role].label}</p>
                <p className="text-green-300 text-xs mt-1">{roleConfig[role].sub}</p>
                <div className="mt-4 flex items-center gap-1 text-xs text-white/70 group-hover:text-white transition-colors">
                  <span>เพิ่มเลย</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* การ์ดลูกเสือ (เต็มความกว้าง) */}
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

      {/* Modal */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); setForm(EMPTY); setErrors({}) }}>
          {/* Header */}
          <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100 dark:border-scout-700">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isScout ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-green-100 dark:bg-green-900/50'}`}>
                {isScout
                  ? <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
                  : <Shield size={18} className="text-green-800 dark:text-green-400" />
                }
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{modalTitle}</h3>
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

          {/* Role Tabs */}
          <div className="px-5 pt-4">
            <div className="flex bg-gray-100 dark:bg-scout-900 p-1 rounded-xl overflow-x-auto gap-1">
              {[
                { v: 'ADMIN',        l: 'ผู้ดูแลระบบ'   },
                { v: 'CAMP_MANAGER', l: 'ผู้ดูแลค่าย'   },
                { v: 'TROOP_LEADER', l: 'ผู้กำกับหมู่'   },
                { v: 'STAFF',        l: 'ผู้จัดกิจกรรม' },
                { v: 'SCOUT',        l: 'ลูกเสือ'        },
              ].map(r => (
                <button
                  key={r.v}
                  onClick={() => { set('role', r.v); setErrors({}) }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap px-2 ${form.role === r.v ? 'bg-white dark:bg-scout-700 text-scout-700 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  {r.l}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="px-5 py-4 space-y-4">

            {/* ── ข้อมูลบัญชี ── */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">ข้อมูลบัญชี</p>

            <Field label="ชื่อผู้ใช้ *" error={errors.username}>
              <input
                type="text"
                value={form.username}
                onChange={e => set('username', e.target.value)}
                className={INPUT}
                placeholder={isScout ? 'เช่น somchai_scout' : 'เช่น leader_somchai'}
              />
            </Field>

            {isScout ? (
              /* ลูกเสือ: ใช้เลขบัตรประชาชนเป็นรหัสผ่าน */
              <Field label="เลขบัตรประชาชน 13 หลัก * (ใช้เป็นรหัสผ่าน)" error={errors.citizenId}>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.citizenId}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '')
                    set('citizenId', val)
                    if (e.target.value !== val) {
                      setErrors(er => ({ ...er, citizenId: 'กรอกได้เฉพาะตัวเลขเท่านั้น' }))
                    } else if (val.length > 0 && val.length < 13) {
                      setErrors(er => ({ ...er, citizenId: `กรอกแล้ว ${val.length}/13 หลัก` }))
                    } else {
                      setErrors(er => ({ ...er, citizenId: '' }))
                    }
                  }}
                  className={INPUT}
                  placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
                  maxLength={13}
                />
                <p className="text-xs mt-1 text-gray-400">
                  {form.citizenId.length}/13 หลัก · 🔒 ใช้เป็นรหัสผ่านในการเข้าสู่ระบบ
                </p>
              </Field>
            ) : (
              /* Role อื่น: ตั้งรหัสผ่านเอง */
              <div className="grid grid-cols-2 gap-3">
                <Field label="รหัสผ่าน *" error={errors.password}>
                  <input type="password" value={form.password} onChange={e => set('password', e.target.value)} className={INPUT} placeholder="••••••••" />
                </Field>
                <Field label="ยืนยันรหัสผ่าน *" error={errors.confirmPassword}>
                  <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} className={INPUT} placeholder="••••••••" />
                </Field>
              </div>
            )}

            {/* ── ข้อมูลส่วนตัว ── */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-1">ข้อมูลส่วนตัว</p>

            <Field label="คำนำหน้า *" error={errors.prefix}>
              <select value={form.prefix} onChange={e => set('prefix', e.target.value)} className={INPUT}>
                <option value="">เลือกคำนำหน้า</option>
                {(isScout
                  ? ['ด.ช.', 'ด.ญ.', 'นาย', 'นาง', 'นางสาว']
                  : ['นาย', 'นาง', 'นางสาว']
                ).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="ชื่อจริง *" error={errors.firstName}>
                <input type="text" value={form.firstName} onChange={e => set('firstName', e.target.value)} className={INPUT} placeholder="ชื่อจริง" />
              </Field>
              <Field label="นามสกุล *" error={errors.lastName}>
                <input type="text" value={form.lastName} onChange={e => set('lastName', e.target.value)} className={INPUT} placeholder="นามสกุล" />
              </Field>
            </div>

            {/* ชื่อเล่น: แสดงสำหรับ SCOUT และ TROOP_LEADER */}
            {(isScout || isLeader) && (
              <Field label="ชื่อเล่น *" error={errors.nickname}>
                <input type="text" value={form.nickname} onChange={e => set('nickname', e.target.value)} className={INPUT} placeholder="ชื่อเล่น" />
              </Field>
            )}

            {/* สถานศึกษา: ไม่แสดงสำหรับ ADMIN และ CAMP_MANAGER */}
            {!isAdmin && !isCampManager && (
              <Field label="สถานศึกษา *" error={errors.school}>
                <input type="text" value={form.school} onChange={e => set('school', e.target.value)} className={INPUT} placeholder="โรงเรียน / มหาวิทยาลัย" />
              </Field>
            )}

            {/* เบอร์โทร: ไม่แสดงสำหรับ ADMIN */}
            {!isAdmin && (
              <Field label="เบอร์โทรศัพท์ *" error={errors.phone}>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={INPUT} placeholder="0812345678" />
              </Field>
            )}

            {/* อีเมล: ADMIN และ CAMP_MANAGER บังคับ, SCOUT ไม่บังคับ */}
            {(isAdmin || isCampManager || isScout) && (
              <Field label={`อีเมล${isAdmin || isCampManager ? ' *' : ''}`} error={errors.email}>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={INPUT} placeholder="example@email.com" />
              </Field>
            )}

            {/* ฟิลด์เฉพาะลูกเสือ */}
            {isScout && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="วันเกิด">
                    <input type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} className={INPUT} />
                  </Field>
                  <Field label="จังหวัด *" error={errors.province}>
                    <select value={form.province} onChange={e => set('province', e.target.value)} className={INPUT}>
                      <option value="">เลือกจังหวัด</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="การแพ้ (ถ้ามี)">
                  <input type="text" value={form.allergies} onChange={e => set('allergies', e.target.value)} className={INPUT} placeholder="เช่น แพ้ถั่ว แพ้ยาเพนิซิลิน" />
                </Field>
                <Field label="โรคประจำตัว (ถ้ามี)">
                  <input type="text" value={form.congenitalDisease} onChange={e => set('congenitalDisease', e.target.value)} className={INPUT} placeholder="เช่น โรคหอบหืด เบาหวาน" />
                </Field>
              </>
            )}

            {/* ── ข้อมูลค่าย / หมู่ ── */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-1">
              ค่าย{(isLeader || isScout) ? ' / หมู่' : ''}
            </p>

            {/* ค่าย: แสดงทุก role ยกเว้น ADMIN */}
            {!isAdmin && (
              <Field label="ค่าย *" error={errors.campId}>
                <select value={form.campId} onChange={e => set('campId', e.target.value)} className={INPUT}>
                  <option value="">เลือกค่าย</option>
                  {camps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            )}

            {/* หมู่: แสดงสำหรับ TROOP_LEADER และ SCOUT เมื่อเลือกค่ายแล้ว */}
            {(isLeader || isScout) && form.campId && (
              <Field label="หมู่ *" error={errors.squadId}>
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

          {/* Footer Buttons */}
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
              className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md transition disabled:opacity-50 bg-green-800 hover:bg-green-900 shadow-green-800/20"
            >
              {createMutation.isLoading ? 'กำลังสร้าง...' : 'สร้างบัญชี'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}