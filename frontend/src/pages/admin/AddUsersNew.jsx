import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Users, Shield, X, Plus, Search, Filter, RefreshCw, Check } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import api from '../../lib/api'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'TROOP_LEADER', label: 'ผู้กำกับหมู่' },
  { value: 'SCOUT', label: 'ลูกเสือ' },
]

export default function AdminAddUsers() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ 
    username: '', 
    password: '', 
    confirmPassword: '',
    firstName: '', 
    lastName: '', 
    nickname: '', 
    birthDate: '',
    school: '', 
    province: '', 
    phone: '', 
    email: '', 
    role: 'SCOUT',
    scoutCode: '',
    prefix: '',
    allergies: '',
    congenitalDisease: '',
    campId: ''
  })
  const [errors, setErrors] = useState({})

  // Fetch camps data only
  const { data: camps = [] } = useQuery('camps', () => api.get('/camps'))

  const createMutation = useMutation(d => api.post('/admin/accounts', d), {
    onSuccess: () => { 
      resetForm()
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
    if (!form.role) e.role = 'กรุณาเลือก Role'
    if (form.role === 'SCOUT') {
      if (!form.firstName.trim()) e.firstName = 'กรุณากรอกชื่อจริง'
      if (!form.lastName.trim()) e.lastName = 'กรุณากรอกนามสกุล'
      if (!form.nickname.trim()) e.nickname = 'กรุณากรอกชื่อเล่น'
      if (!form.school.trim()) e.school = 'กรุณากรอกโรงเรียน'
      if (!form.province) e.province = 'กรุณาเลือกจังหวัด'
      if (!form.phone.trim()) e.phone = 'กรุณากรอกเบอร์โทรศัพท์'
      if (!form.campId) e.campId = 'กรุณาเลือกค่าย'
    } else if (form.role === 'TROOP_LEADER') {
      if (!form.firstName.trim()) e.firstName = 'กรุณากรอกชื่อจริง'
      if (!form.lastName.trim()) e.lastName = 'กรุณากรอกนามสกุล'
      if (!form.school.trim()) e.school = 'กรุณากรอกสถานศึกษา'
      if (!form.phone.trim()) e.phone = 'กรุณากรอกเบอร์โทรศัพท์'
      if (!form.prefix) e.prefix = 'กรุณาเลือกคำนำหน้า'
      if (!form.campId) e.campId = 'กรุณาเลือกค่าย'
    }
    return e
  }

  function submit() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    
    // Generate name from firstName and lastName
    const fullName = `${form.firstName} ${form.lastName}`.trim()
    
    const userData = {
      username: form.username,
      password: form.password,
      name: fullName,
      role: form.role,
      campId: form.campId || null
    }

    if (form.role === 'SCOUT') {
      userData.firstName = form.firstName
      userData.lastName = form.lastName
      userData.nickname = form.nickname || form.firstName
      userData.birthDate = form.birthDate
      userData.school = form.school
      userData.province = form.province
      userData.phone = form.phone
      userData.email = form.email
      userData.allergies = form.allergies
      userData.congenitalDisease = form.congenitalDisease
      userData.prefix = form.prefix // Add prefix for scouts
    } else if (form.role === 'TROOP_LEADER') {
      userData.firstName = form.firstName
      userData.lastName = form.lastName
      userData.school = form.school
      userData.phone = form.phone
      userData.prefix = form.prefix
    }

    createMutation.mutate(userData)
  }

  function closeForm() {
    resetForm()
  }

  function resetForm() {
    setForm({ 
      username: '', 
      password: '', 
      confirmPassword: '',
      firstName: '', 
      lastName: '', 
      nickname: '', 
      birthDate: '',
      school: '', 
      province: '', 
      phone: '', 
      email: '', 
      role: 'SCOUT',
      scoutCode: '',
      prefix: '',
      allergies: '',
      congenitalDisease: '',
      campId: ''
    })
    setErrors({})
  }

  return (
    <div className="page">
      <PageHeader title="เพิ่มผู้กำกับและลูกเสือ" />

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-scout-900 dark:text-white">สร้างผู้ใช้ใหม่</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ประเภทผู้ใช้
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(role => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: role.value }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    form.role === role.value
                      ? 'border-scout-500 bg-scout-50 dark:bg-scout-800 text-scout-700 dark:text-scout-300'
                      : 'border-gray-200 dark:border-scout-700 hover:border-gray-300 dark:hover:border-scout-600'
                  }`}
                >
                  {role.value === 'SCOUT' ? <Users size={20} className="mx-auto mb-2" /> : <Shield size={20} className="mx-auto mb-2" />}
                  <p className="text-sm font-medium">{role.label}</p>
                </button>
              ))}
            </div>
            {errors.role && <p className="text-xs text-red-500 mt-1 ml-1">{errors.role}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ชื่อผู้ใช้ 
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({...form, username: e.target.value})}
              className={`input ${errors.username ? 'border-red-400 dark:border-red-500' : ''}`}
              placeholder="กรอกชื่อผู้ใช้"
            />
            {errors.username && <p className="text-xs text-red-500 mt-1 ml-1">{errors.username}</p>}
          </div>

          {/* Password fields - moved after username */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                รหัสผ่าน 
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                className={`input ${errors.password ? 'border-red-400 dark:border-red-500' : ''}`}
                placeholder="กรอกรหัสผ่าน"
              />
              {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ยืนยันรหัสผ่าน 
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                className={`input ${errors.confirmPassword ? 'border-red-400 dark:border-red-500' : ''}`}
                placeholder="ยืนยันรหัสผ่าน"
              />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 ml-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          {/* Prefix field - shown for both TROOP_LEADER and SCOUT */}
          {(form.role === 'TROOP_LEADER' || form.role === 'SCOUT') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                คำนำหน้า 
              </label>
              <select
                value={form.prefix}
                onChange={(e) => setForm({...form, prefix: e.target.value})}
                className={`input ${errors.prefix ? 'border-red-400 dark:border-red-500' : ''}`}
              >
                <option value="">เลือกคำนำหน้า</option>
                <option value="ด.ช.">ด.ช.</option>
                <option value="ด.ญ.">ด.ญ.</option>
                <option value="นาย">นาย</option>
                <option value="นาง">นาง</option>
                <option value="นางสาว">นางสาว</option>
              </select>
              {errors.prefix && <p className="text-xs text-red-500 mt-1 ml-1">{errors.prefix}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ชื่อจริง 
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({...form, firstName: e.target.value})}
              className={`input ${errors.firstName ? 'border-red-400 dark:border-red-500' : ''}`}
              placeholder="กรอกชื่อจริง"
            />
            {errors.firstName && <p className="text-xs text-red-500 mt-1 ml-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              นามสกุล 
            </label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm({...form, lastName: e.target.value})}
              className={`input ${errors.lastName ? 'border-red-400 dark:border-red-500' : ''}`}
              placeholder="กรอกนามสกุล"
            />
            {errors.lastName && <p className="text-xs text-red-500 mt-1 ml-1">{errors.lastName}</p>}
          </div>

          <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ชื่อเล่น 
                </label>
                <input
                  type="text"
                  value={form.nickname}
                  onChange={(e) => setForm({...form, nickname: e.target.value})}
                  className={`input ${errors.nickname ? 'border-red-400 dark:border-red-500' : ''}`}
                  placeholder="กรอกชื่อเล่น"
                />
                {errors.nickname && <p className="text-xs text-red-500 mt-1 ml-1">{errors.nickname}</p>}
              </div>

          {form.role === 'SCOUT' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  วันเกิด
                </label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({...form, birthDate: e.target.value})}
                  className="input"
                  placeholder="เลือกวันเกิด"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  สถานศึกษา 
                </label>
                <input
                  type="text"
                  value={form.school}
                  onChange={(e) => setForm({...form, school: e.target.value})}
                  className={`input ${errors.school ? 'border-red-400 dark:border-red-500' : ''}`}
                  placeholder="กรอกสถานศึกษา"
                />
                {errors.school && <p className="text-xs text-red-500 mt-1 ml-1">{errors.school}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  จังหวัด 
                </label>
                <select
                  value={form.province}
                  onChange={(e) => setForm({...form, province: e.target.value})}
                  className={`input ${errors.province ? 'border-red-400 dark:border-red-500' : ''}`}
                >
                  <option value="">เลือกจังหวัด</option>
                  <option value="กรุงเทพมหานคร">กรุงเทพมหานคร</option>
<option value="กระบี่">กระบี่</option>
<option value="กาญจนบุรี">กาญจนบุรี</option>
<option value="กาฬสินธุ์">กาฬสินธุ์</option>
<option value="กำแพงเพชร">กำแพงเพชร</option>
<option value="ขอนแก่น">ขอนแก่น</option>
<option value="จันทบุรี">จันทบุรี</option>
<option value="ฉะเชิงเทรา">ฉะเชิงเทรา</option>
<option value="ชลบุรี">ชลบุรี</option>
<option value="ชัยนาท">ชัยนาท</option>
<option value="ชัยภูมิ">ชัยภูมิ</option>
<option value="ชุมพร">ชุมพร</option>
<option value="เชียงราย">เชียงราย</option>
<option value="เชียงใหม่">เชียงใหม่</option>
<option value="ตรัง">ตรัง</option>
<option value="ตราด">ตราด</option>
<option value="ตาก">ตาก</option>
<option value="นครนายก">นครนายก</option>
<option value="นครปฐม">นครปฐม</option>
<option value="นครพนม">นครพนม</option>
<option value="นครราชสีมา">นครราชสีมา</option>
<option value="นครศรีธรรมราช">นครศรีธรรมราช</option>
<option value="นครสวรรค์">นครสวรรค์</option>
<option value="นนทบุรี">นนทบุรี</option>
<option value="นราธิวาส">นราธิวาส</option>
<option value="น่าน">น่าน</option>
<option value="บึงกาฬ">บึงกาฬ</option>
<option value="บุรีรัมย์">บุรีรัมย์</option>
<option value="ปทุมธานี">ปทุมธานี</option>
<option value="ประจวบคีรีขันธ์">ประจวบคีรีขันธ์</option>
<option value="ปราจีนบุรี">ปราจีนบุรี</option>
<option value="ปัตตานี">ปัตตานี</option>
<option value="พระนครศรีอยุธยา">พระนครศรีอยุธยา</option>
<option value="พะเยา">พะเยา</option>
<option value="พังงา">พังงา</option>
<option value="พัทลุง">พัทลุง</option>
<option value="พิจิตร">พิจิตร</option>
<option value="พิษณุโลก">พิษณุโลก</option>
<option value="เพชรบุรี">เพชรบุรี</option>
<option value="เพชรบูรณ์">เพชรบูรณ์</option>
<option value="แพร่">แพร่</option>
<option value="ภูเก็ต">ภูเก็ต</option>
<option value="มหาสารคาม">มหาสารคาม</option>
<option value="มุกดาหาร">มุกดาหาร</option>
<option value="แม่ฮ่องสอน">แม่ฮ่องสอน</option>
<option value="ยโสธร">ยโสธร</option>
<option value="ยะลา">ยะลา</option>
<option value="ร้อยเอ็ด">ร้อยเอ็ด</option>
<option value="ระนอง">ระนอง</option>
<option value="ระยอง">ระยอง</option>
<option value="ราชบุรี">ราชบุรี</option>
<option value="ลพบุรี">ลพบุรี</option>
<option value="ลำปาง">ลำปาง</option>
<option value="ลำพูน">ลำพูน</option>
<option value="เลย">เลย</option>
<option value="ศรีสะเกษ">ศรีสะเกษ</option>
<option value="สกลนคร">สกลนคร</option>
<option value="สงขลา">สงขลา</option>
<option value="สตูล">สตูล</option>
<option value="สมุทรปราการ">สมุทรปราการ</option>
<option value="สมุทรสงคราม">สมุทรสงคราม</option>
<option value="สมุทรสาคร">สมุทรสาคร</option>
<option value="สระแก้ว">สระแก้ว</option>
<option value="สระบุรี">สระบุรี</option>
<option value="สิงห์บุรี">สิงห์บุรี</option>
<option value="สุโขทัย">สุโขทัย</option>
<option value="สุพรรณบุรี">สุพรรณบุรี</option>
<option value="สุราษฎร์ธานี">สุราษฎร์ธานี</option>
<option value="สุรินทร์">สุรินทร์</option>
<option value="หนองคาย">หนองคาย</option>
<option value="หนองบัวลำภู">หนองบัวลำภู</option>
<option value="อ่างทอง">อ่างทอง</option>
<option value="อำนาจเจริญ">อำนาจเจริญ</option>
<option value="อุดรธานี">อุดรธานี</option>
<option value="อุตรดิตถ์">อุตรดิตถ์</option>
<option value="อุทัยธานี">อุทัยธานี</option>
<option value="อุบลราชธานี">อุบลราชธานี</option>
                </select>
                {errors.province && <p className="text-xs text-red-500 mt-1 ml-1">{errors.province}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    เบอร์โทรศัพท์ 
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                    className={`input ${errors.phone ? 'border-red-400 dark:border-red-500' : ''}`}
                    placeholder="กรอกเบอร์โทรศัพท์"
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1 ml-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    อีเมล <span className="text-gray-400">(ไม่จำเป็นต้องกรอก)</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    className="input"
                    placeholder="กรอกอีเมล"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  การแพ้อาหารหรือสิ่งต่างๆ <span className="text-gray-400">(ไม่จำเป็นต้องกรอก)</span>
                </label>
                <textarea
                  value={form.allergies}
                  onChange={(e) => setForm({...form, allergies: e.target.value})}
                  className="input"
                  rows={3}
                  placeholder="กรอกข้อมูลการแพ้อาหารหรือสิ่งต่างๆ เช่น แพ้ถั่ว แพ้หอย แพ้ยา ฯลฯ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  โรคประจำตัว <span className="text-gray-400">(ไม่จำเป็นต้องกรอก)</span>
                </label>
                <textarea
                  value={form.congenitalDisease}
                  onChange={(e) => setForm({...form, congenitalDisease: e.target.value})}
                  className="input"
                  rows={3}
                  placeholder="กรอกข้อมูลโรคประจำตัว เช่น โรคเบาหวาน โรคความดันโลหิตสูง หอบหืด ฯลฯ"
                />
              </div>
            </>
          )}

          {form.role === 'TROOP_LEADER' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  สถานศึกษา 
                </label>
                <input
                  type="text"
                  value={form.school}
                  onChange={(e) => setForm({...form, school: e.target.value})}
                  className={`input ${errors.school ? 'border-red-400 dark:border-red-500' : ''}`}
                  placeholder="กรอกสถานศึกษา"
                />
                {errors.school && <p className="text-xs text-red-500 mt-1 ml-1">{errors.school}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  เบอร์โทรศัพท์ 
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                  className={`input ${errors.phone ? 'border-red-400 dark:border-red-500' : ''}`}
                  placeholder="กรอกเบอร์โทรศัพท์"
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1 ml-1">{errors.phone}</p>}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ค่าย 
            </label>
            <select
              value={form.campId}
              onChange={(e) => setForm({...form, campId: e.target.value})}
              className={`input ${errors.campId ? 'border-red-400 dark:border-red-500' : ''}`}
            >
              <option value="">เลือกค่าย</option>
              {camps.map(camp => (
                <option key={camp.id} value={camp.id}>{camp.name}</option>
              ))}
            </select>
            {errors.campId && <p className="text-xs text-red-500 mt-1 ml-1">{errors.campId}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={submit} disabled={createMutation.isLoading} className="flex-1 btn-primary">
              {createMutation.isLoading ? 'กำลังสร้าง...' : 'สร้างบัญชี'}
            </button>
            <button onClick={closeForm} className="flex-1 btn-secondary">ยกเลิก</button>
          </div>
        </div>
      </div>
    </div>
  )
}
