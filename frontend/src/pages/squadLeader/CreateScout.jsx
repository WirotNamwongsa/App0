import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'react-query'
import { Users, Shield, X, ChevronRight } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'

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
  citizenId: ''
}

export default function CreateScout() {
  const { user } = useAuthStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  // ✅ ตั้งค่าสถานศึกษาจากผู้กำกับหมู่
  useEffect(() => {
    if (user?.school) {
      setForm(prev => ({ ...prev, school: user.school }))
    }
  }, [user?.school])

  const createMutation = useMutation(d => api.post('/squad-leader/create-scout', d), {
    onSuccess: () => {
      setForm(EMPTY)
      setErrors({})
      setShowModal(false)
      toast.success('เพิ่มลูกเสือสำเร็จ')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'เพิ่มลูกเสือไม่สำเร็จ')
    }
  })

  function validate() {
    const e = {}

    // ฟิลด์พื้นฐาน
    if (!form.username.trim()) e.username = 'กรุณากรอกชื่อผู้ใช้'
    if (!form.firstName.trim()) e.firstName = 'กรุณากรอกชื่อจริง'
    if (!form.lastName.trim()) e.lastName = 'กรุณากรอกนามสกุล'
    if (!form.prefix) e.prefix = 'กรุณาเลือกคำนำหน้า'

    // รหัสผ่านของลูกเสือใช้เลขบัตรประชาชน
    if (!form.citizenId.trim()) e.citizenId = 'กรุณากรอกเลขบัตรประชาชน'
    else if (!/^\d{13}$/.test(form.citizenId.trim())) e.citizenId = 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก'
    
    if (!form.nickname.trim()) e.nickname = 'กรุณากรอกชื่อเล่น'
    if (!form.school.trim()) e.school = 'กรุณากรอกสถานศึกษา'
    if (!form.province) e.province = 'กรุณาเลือกจังหวัด'
    if (!form.phone.trim()) e.phone = 'กรุณากรอกเบอร์โทรศัพท์'

    return e
  }

  function submit() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})

    const fullName = `${form.firstName} ${form.lastName}`.trim()

    const userData = {
      username: form.username,
      password: form.citizenId, // ใช้เลขบัตรประชาชนเป็นรหัสผ่าน
      name: fullName,
      role: 'SCOUT',
      firstName: form.firstName,
      lastName: form.lastName,
      prefix: form.prefix,
      nickname: form.nickname,
      birthDate: form.birthDate,
      province: form.province,
      school: form.school,
      phone: form.phone,
      email: form.email,
      allergies: form.allergies,
      congenitalDisease: form.congenitalDisease,
    }

    createMutation.mutate(userData)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="page">
      <PageHeader title="สร้างลูกเสือ" />

      {/* การ์ดสร้างลูกเสือ */}
      <div className="mb-8">
        <button
          onClick={() => setShowModal(true)}
          className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 to-green-900 p-5 text-left shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <Users size={20} className="text-white" />
            </div>
            <p className="text-white font-bold text-base leading-tight">สร้างลูกเสือใหม่</p>
            <p className="text-green-300 text-xs mt-1">สร้างลูกเสือใหม่และเพิ่มเข้าหมู่ของคุณ</p>
            <div className="mt-4 flex items-center gap-1 text-xs text-white/70 group-hover:text-white transition-colors">
              <span>สร้างเลย</span>
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
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40">
                <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">สร้างลูกเสือใหม่</h3>
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
                placeholder="เช่น somchai_scout"
              />
            </Field>

            {/* ลูกเสือ: ใช้เลขบัตรประชาชนเป็นรหัสผ่าน */}
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

            {/* ── ข้อมูลส่วนตัว ── */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-1">ข้อมูลส่วนตัว</p>

            <Field label="คำนำหน้า *" error={errors.prefix}>
              <select value={form.prefix} onChange={e => set('prefix', e.target.value)} className={INPUT}>
                <option value="">เลือกคำนำหน้า</option>
                {['ด.ช.', 'ด.ญ.', 'นาย', 'นาง', 'นางสาว'].map(p => <option key={p} value={p}>{p}</option>)}
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

            <Field label="ชื่อเล่น *" error={errors.nickname}>
              <input type="text" value={form.nickname} onChange={e => set('nickname', e.target.value)} className={INPUT} placeholder="ชื่อเล่น" />
            </Field>

            <Field label="สถานศึกษา *" error={errors.school}>
              <input 
                type="text" 
                value={form.school || user?.school || ''} 
                onChange={user?.school ? undefined : e => set('school', e.target.value)} 
                className={INPUT} 
                placeholder="โรงเรียน / มหาวิทยาลัย"
                disabled={!!user?.school}
                required
              />
              {user?.school && (
                <p className="text-xs text-gray-400 mt-1">
                  🔒 ใช้สถานศึกษาเดียวกับผู้กำกับหมู่ ({user.school})
                </p>
              )}
            </Field>

            <Field label="เบอร์โทรศัพท์ *" error={errors.phone}>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={INPUT} placeholder="0812345678" />
            </Field>

            <Field label="อีเมล" error={errors.email}>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={INPUT} placeholder="example@email.com" />
            </Field>

            {/* ฟิลด์เฉพาะลูกเสือ */}
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
