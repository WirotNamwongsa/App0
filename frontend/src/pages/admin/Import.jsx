import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import api from '../../lib/api'
import PageHeader from '../../components/PageHeader'
import BottomNav from '../../components/BottomNav'
import toast from 'react-hot-toast'
import { Upload, FileText, CheckCircle, AlertCircle, Download, Plus, X, UserPlus, Eye } from 'lucide-react'

export default function AdminImport() {
  const qc = useQueryClient()
  const fileRef = useRef()
  const [preview, setPreview] = useState([])
  const [errors, setErrors] = useState([])
  const [result, setResult] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [singleScout, setSingleScout] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    school: '',
    province: '',
    phone: '',
    email: '',
    scoutCode: ''
  })

  const importMutation = useMutation(
    scouts => api.post('/admin/import-scouts', { scouts }),
    {
      onSuccess: (data) => {
        setResult(data)
        setPreview([])
        qc.invalidateQueries('scouts')
        toast.success(`นำเข้าสำเร็จ ${data.count} คน`)
      }
    }
  )

  const addSingleMutation = useMutation(
    scout => api.post('/scouts', scout),
    {
      onSuccess: () => {
        setSingleScout({
          firstName: '',
          lastName: '',
          nickname: '',
          school: '',
          province: '',
          phone: '',
          email: '',
          scoutCode: ''
        })
        setShowAddForm(false)
        qc.invalidateQueries('scouts')
        toast.success('เพิ่มลูกเสือสำเร็จ')
      }
    }
  )

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setErrors([])
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(ev.target.result)
          const arr = Array.isArray(data) ? data : [data]
          validateAndPreview(arr)
        } else if (file.name.endsWith('.csv')) {
          const rows = ev.target.result.trim().split('\n')
          const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''))
          const scouts = rows.slice(1).map(row => {
            const vals = row.split(',').map(v => v.trim().replace(/"/g, ''))
            return headers.reduce((obj, h, i) => ({ ...obj, [h]: vals[i] || '' }), {})
          })
          validateAndPreview(scouts)
        } else {
          setErrors(['รองรับเฉพาะไฟล์ .csv และ .json'])
        }
      } catch {
        setErrors(['ไฟล์ไม่ถูกต้อง ตรวจสอบ format อีกครั้ง'])
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  function validateAndPreview(data) {
    const errs = []
    const valid = []
    data.forEach((row, i) => {
      if (!row.firstName) errs.push(`แถว ${i + 1}: ไม่มีชื่อ (firstName)`)
      else if (!row.lastName) errs.push(`แถว ${i + 1}: ไม่มีนามสกุล (lastName)`)
      else valid.push(row)
    })
    setErrors(errs)
    setPreview(valid)
  }

  function downloadTemplate(type) {
    if (type === 'csv') {
      const csv = `firstName,lastName,nickname,school,province,phone,email,scoutCode
สมชาย,ใจดี,ต้น,วิทยาลัยเทคนิคเชียงใหม่,เชียงใหม่,0812345678,som@email.com,SC001
สมหญิง,รักดี,นุ่น,วิทยาลัยอาชีวศึกษา,กรุงเทพ,0898765432,,SC002`
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'template.csv'; a.click()
    } else {
      const json = JSON.stringify([
        { firstName: 'สมชาย', lastName: 'ใจดี', nickname: 'ต้น', school: 'วิทยาลัยเทคนิคเชียงใหม่', province: 'เชียงใหม่', phone: '0812345678', email: 'som@email.com', scoutCode: 'SC001' },
        { firstName: 'สมหญิง', lastName: 'รักดี', nickname: 'นุ่น', school: 'วิทยาลัยอาชีวศึกษา', province: 'กรุงเทพ', phone: '0898765432', scoutCode: 'SC002' }
      ], null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'template.json'; a.click()
    }
  }

  return (
    <div className="page">
      <PageHeader title="Import ลูกเสือ" showBack />

      {/* Download Template */}
      <div className="card mb-4">
        <p className="text-sm font-semibold text-scout-800 dark:text-scout-200 mb-3">ดาวน์โหลด Template</p>
        <div className="flex gap-2">
          <button onClick={() => downloadTemplate('csv')} className="btn-secondary flex-1 text-sm">
            <Download size={15} /> Template CSV
          </button>
          <button onClick={() => downloadTemplate('json')} className="btn-secondary flex-1 text-sm">
            <Download size={15} /> Template JSON
          </button>
        </div>
      </div>

      {/* Add Single Scout */}
      <div className="card mb-4 bg-gradient-to-r from-scout-50 to-scout-100 dark:from-scout-800/50 dark:to-scout-900/50 border-scout-200 dark:border-scout-700">
        <div className="flex items-center justify-center">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`w-full text-sm px-4 py-3 flex items-center justify-center gap-2 transition-all rounded-xl border-0 shadow-lg hover:shadow-xl transform hover:scale-105 duration-200 text-white font-medium ${
              showAddForm ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
            }`}
          >
            <UserPlus size={18} className={showAddForm ? 'animate-bounce' : ''} />
            <span className="font-medium">เพิ่มลูกเสือ</span>
            <Plus size={16} className={`transition-transform ${showAddForm ? 'rotate-45' : ''}`} />
          </button>
        </div>
        
        {showAddForm && (
          <div className="mt-4 p-4 bg-white dark:bg-scout-900/50 rounded-xl border border-scout-200 dark:border-scout-700">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    className="input pr-8"
                    placeholder="ชื่อจริง *"
                    value={singleScout.firstName}
                    onChange={e => setSingleScout({...singleScout, firstName: e.target.value})}
                  />
                  {singleScout.firstName && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input
                    className="input pr-8"
                    placeholder="นามสกุล *"
                    value={singleScout.lastName}
                    onChange={e => setSingleScout({...singleScout, lastName: e.target.value})}
                  />
                  {singleScout.lastName && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input"
                  placeholder="ชื่อเล่น"
                  value={singleScout.nickname}
                  onChange={e => setSingleScout({...singleScout, nickname: e.target.value})}
                />
                <input
                  className="input"
                  placeholder="รหัสลูกเสือ"
                  value={singleScout.scoutCode}
                  onChange={e => setSingleScout({...singleScout, scoutCode: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input"
                  placeholder="โรงเรียน"
                  value={singleScout.school}
                  onChange={e => setSingleScout({...singleScout, school: e.target.value})}
                />
                <input
                  className="input"
                  placeholder="จังหวัด"
                  value={singleScout.province}
                  onChange={e => setSingleScout({...singleScout, province: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input"
                  placeholder="เบอร์โทร"
                  value={singleScout.phone}
                  onChange={e => setSingleScout({...singleScout, phone: e.target.value})}
                />
                <input
                  className="input"
                  placeholder="อีเมล"
                  value={singleScout.email}
                  onChange={e => setSingleScout({...singleScout, email: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    if (!singleScout.firstName || !singleScout.lastName) {
                      toast.error('กรุณากรอกชื่อและนามสกุล')
                      return
                    }
                    addSingleMutation.mutate(singleScout)
                  }}
                  disabled={addSingleMutation.isLoading}
                  className="btn-primary flex-1 text-sm py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-0"
                >
                  {addSingleMutation.isLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus size={16} />
                      <span>บันทึกข้อมูล</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setSingleScout({
                      firstName: '',
                      lastName: '',
                      nickname: '',
                      school: '',
                      province: '',
                      phone: '',
                      email: '',
                      scoutCode: ''
                    })
                  }}
                  className="btn-secondary text-sm px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-scout-800"
                >
                  <X size={14} />
                  <span>ล้าง</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => fileRef.current.click()}
        className="card mb-4 border-2 border-dashed border-scout-200 dark:border-scout-700 cursor-pointer hover:border-scout-400 hover:bg-scout-50 dark:hover:bg-scout-800/50 transition-all text-center py-8"
      >
        <Upload size={32} className="mx-auto text-scout-400 mb-2" />
        <p className="font-medium text-scout-700 dark:text-scout-300">คลิกเพื่อเลือกไฟล์</p>
        <p className="text-xs text-gray-400 mt-1">รองรับ .csv และ .json</p>
        <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={handleFile} />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="card mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-red-500" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">พบข้อผิดพลาด</p>
          </div>
          <div className="space-y-1">
            {errors.map((e, i) => <p key={i} className="text-xs text-red-600 dark:text-red-400">{e}</p>)}
          </div>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-scout-800 dark:text-scout-200">
              พรีวิว ({preview.length} คน)
            </p>
            <button
              onClick={() => importMutation.mutate(preview)}
              disabled={importMutation.isLoading}
              className="btn-primary text-sm px-4 py-2"
            >
              {importMutation.isLoading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : '📥 นำเข้าเลย'
              }
            </button>
          </div>
          <div className="space-y-2 mb-4">
            {preview.slice(0, 10).map((sc, i) => (
              <div key={i} className="card flex items-center gap-3 py-3">
                <div className="w-7 h-7 bg-scout-100 dark:bg-scout-800 rounded-full flex items-center justify-center text-xs font-bold text-scout-700 dark:text-scout-300">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-scout-900 dark:text-white">{sc.firstName} {sc.lastName}</p>
                  <p className="text-xs text-gray-400">{sc.school || '-'} · {sc.province || '-'}</p>
                </div>
                {sc.scoutCode && <span className="text-xs font-mono text-gray-400">{sc.scoutCode}</span>}
              </div>
            ))}
            {preview.length > 10 && (
              <p className="text-center text-xs text-gray-400 py-2">และอีก {preview.length - 10} คน...</p>
            )}
          </div>
        </>
      )}

      {/* Result */}
      {result && (
        <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="text-green-500" />
            <div>
              <p className="font-semibold text-green-700 dark:text-green-400">นำเข้าสำเร็จ!</p>
              <p className="text-sm text-green-600 dark:text-green-500">
                เพิ่มลูกเสือ {result.count} คนเข้าระบบแล้ว
                {result.errors > 0 && ` (พบข้อผิดพลาด ${result.errors} รายการ)`}
              </p>
              {result.count > 0 && (
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                  💡 Username และ Password ถูกสร้างอัตโนมัติ (password: scout1234)
                </p>
              )}
            </div>
          </div>
          
          {/* Show user credentials */}
          {result.scouts && result.scouts.filter(s => !s.error).length > 0 && (
            <div className="mt-4 p-3 bg-white dark:bg-green-900/30 rounded-lg">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">บัญชีที่สร้าง:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {result.scouts.filter(s => !s.error).slice(0, 5).map((item, i) => (
                  <div key={i} className="text-xs text-green-600 dark:text-green-500">
                    {item.scout.firstName} {item.scout.lastName} → {item.user.username} : {item.user.password}
                  </div>
                ))}
                {result.scouts.filter(s => !s.error).length > 5 && (
                  <p className="text-xs text-green-600 dark:text-green-500">และอีก {result.scouts.filter(s => !s.error).length - 5} คน...</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <BottomNav />
    </div>
  )
}