import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import api from '../../lib/api'
import PageHeader from '../../components/PageHeader'
import BottomNav from '../../components/BottomNav'
import toast from 'react-hot-toast'
import { Upload, CheckCircle, AlertCircle, Download, X, FileSpreadsheet, FileJson, Users, ArrowDownToLine } from 'lucide-react'

export default function AdminImport() {
  const qc = useQueryClient()
  const fileRef = useRef()
  const [preview, setPreview] = useState([])
  const [errors, setErrors] = useState([])
  const [result, setResult] = useState(null)
  const [selectedCampId, setSelectedCampId] = useState('')
  const [exportCampId, setExportCampId] = useState('')
  const [exporting, setExporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const { data: camps = [] } = useQuery('camps', () => api.get('/camps'))

  const importMutation = useMutation(
    scouts => api.post('/admin/import-scouts', { scouts }),
    {
      onSuccess: (data) => {
        setResult(data)
        setPreview([])
        qc.invalidateQueries('scouts')
        toast.success(`นำเข้าสำเร็จ ${data.count} คน`)
      },
      onError: () => toast.error('นำเข้าไม่สำเร็จ กรุณาลองใหม่')
    }
  )

  function handleFile(e) {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0]
    if (!file) return
    setErrors([])
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(ev.target.result)
          validateAndPreview(Array.isArray(data) ? data : [data])
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
    if (e.target?.value !== undefined) e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e)
  }

  function validateAndPreview(data) {
    const errs = []
    const valid = []
    data.forEach((row, i) => {
      const rowNum = `แถว ${i + 1}`
      if (!row.firstName) errs.push(`${rowNum}: ไม่มีชื่อ (firstName)`)
      else if (!row.lastName) errs.push(`${rowNum}: ไม่มีนามสกุล (lastName)`)
      else if (!row.gender) errs.push(`${rowNum}: ไม่มีเพศ (gender)`)
      else if (!['ชาย', 'หญิง', 'ไม่ระบุ'].includes(row.gender)) errs.push(`${rowNum}: เพศไม่ถูกต้อง "${row.gender}"`)
      else valid.push(row)
    })
    setErrors(errs)
    setPreview(valid)
  }

  function handleImport() {
    if (!selectedCampId) { toast.error('กรุณาเลือกค่ายก่อน'); return }
    importMutation.mutate(preview.map(s => ({ ...s, campId: selectedCampId })))
  }

  async function handleExport() {
    if (!exportCampId) { toast.error('กรุณาเลือกค่ายก่อน'); return }
    setExporting(true)
    try {
      const data = await api.get(`/scouts?campId=${exportCampId}`)
      if (!data || data.length === 0) { toast.error('ไม่มีข้อมูลลูกเสือในค่ายนี้'); return }
      const headers = 'firstName,lastName,nickname,gender,school,province,phone,email,scoutCode'
      const rows = data.map(s =>
        [s.firstName, s.lastName, s.nickname, s.gender, s.school, s.province, s.phone, s.email, s.scoutCode]
          .map(v => `"${v || ''}"`)
          .join(',')
      )
      const csv = [headers, ...rows].join('\n')
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `scouts_${camps.find(c => c.id === exportCampId)?.name || 'export'}_${new Date().toLocaleDateString('th-TH')}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Export สำเร็จ ${data.length} คน`)
    } catch {
      toast.error('Export ไม่สำเร็จ')
    } finally {
      setExporting(false)
    }
  }

  function downloadTemplate(type) {
    if (type === 'csv') {
      const csv = [
        'firstName,lastName,nickname,gender,school,province,phone,email,scoutCode',
        'สมชาย,ใจดี,ต้น,ชาย,วิทยาลัยเทคนิคเชียงใหม่,เชียงใหม่,0812345678,som@email.com,SC001',
        'สมหญิง,รักดี,นุ่น,หญิง,วิทยาลัยอาชีวศึกษา,กรุงเทพ,0898765432,,SC002',
      ].join('\n')
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'scout_template.csv'; a.click()
      URL.revokeObjectURL(url)
    } else {
      const json = JSON.stringify([
        { firstName: 'สมชาย', lastName: 'ใจดี', nickname: 'ต้น', gender: 'ชาย', school: 'วิทยาลัยเทคนิคเชียงใหม่', province: 'เชียงใหม่', phone: '0812345678', email: 'som@email.com', scoutCode: 'SC001' },
        { firstName: 'สมหญิง', lastName: 'รักดี', nickname: 'นุ่น', gender: 'หญิง', school: 'วิทยาลัยอาชีวศึกษา', province: 'กรุงเทพ', phone: '0898765432', scoutCode: 'SC002' },
      ], null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'scout_template.json'; a.click()
      URL.revokeObjectURL(url)
    }
  }

  const SELECT_CLS = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 bg-white dark:bg-scout-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 transition text-sm appearance-none cursor-pointer"

  return (
    <div className="page pb-24">
      <PageHeader title="Import / Export" showBack />

  
      {/* ── Section: Export ── */}
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">Export รายชื่อลูกเสือ</p>
        <div className="rounded-2xl border border-gray-100 dark:border-scout-700 bg-white dark:bg-scout-800 p-4 shadow-sm">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select value={exportCampId} onChange={e => setExportCampId(e.target.value)} className={SELECT_CLS}>
                <option value="">-- เลือกค่าย --</option>
                {camps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
            </div>
            <button
              onClick={handleExport}
              disabled={!exportCampId || exporting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0"
            >
              {exporting
                ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <ArrowDownToLine size={15} />
              }
              Export
            </button>
          </div>
        </div>
      </div>

      {/* ── Section: Import ── */}
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">Import ลูกเสือ</p>
        <div className="rounded-2xl border border-gray-100 dark:border-scout-700 bg-white dark:bg-scout-800 p-4 shadow-sm space-y-3">

          {/* เลือกค่าย */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              ค่ายที่จะ Import เข้า <span className="text-red-500">*</span>
            </label>
            <select value={selectedCampId} onChange={e => setSelectedCampId(e.target.value)} className={SELECT_CLS}>
              <option value="">-- เลือกค่าย --</option>
              {camps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="pointer-events-none absolute right-3 bottom-3 text-gray-400">▾</div>
          </div>

          {/* Upload Zone */}
          <div
            onClick={() => fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all py-8 text-center ${
              dragOver
                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 scale-[1.01]'
                : 'border-gray-200 dark:border-scout-600 hover:border-emerald-300 hover:bg-gray-50 dark:hover:bg-scout-700/40'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all ${dragOver ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-gray-100 dark:bg-scout-700'}`}>
              <Upload size={22} className={dragOver ? 'text-emerald-500' : 'text-gray-400'} />
            </div>
            <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">
              {dragOver ? 'วางไฟล์ที่นี่' : 'คลิกหรือลากไฟล์มาวาง'}
            </p>
            <p className="text-xs text-gray-400 mt-1">รองรับ .csv และ .json</p>
            <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={handleFile} />
          </div>
        </div>
      </div>

      {/* ── Errors ── */}
      {errors.length > 0 && (
        <div className="mb-3 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">พบข้อผิดพลาด {errors.length} รายการ</p>
            </div>
            <button onClick={() => setErrors([])} className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {errors.map((e, i) => <p key={i} className="text-xs text-red-600 dark:text-red-400">• {e}</p>)}
          </div>
        </div>
      )}

      {/* ── Preview ── */}
      {preview.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">พรีวิว</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{preview.length} คน พร้อม Import</p>
            </div>
            <button
              onClick={handleImport}
              disabled={importMutation.isLoading || !selectedCampId}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              {importMutation.isLoading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Download size={15} />
              }
              {importMutation.isLoading ? 'กำลังนำเข้า...' : 'นำเข้าเลย'}
            </button>
          </div>
          {!selectedCampId && (
            <p className="text-xs text-red-500 mb-2 px-1">⚠️ กรุณาเลือกค่ายก่อน import</p>
          )}

          <div className="rounded-2xl border border-gray-100 dark:border-scout-700 bg-white dark:bg-scout-800 overflow-hidden shadow-sm">
            {preview.slice(0, 10).map((sc, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < preview.slice(0, 10).length - 1 ? 'border-b border-gray-50 dark:border-scout-700/50' : ''}`}>
                <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-scout-700 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {sc.firstName} {sc.lastName}
                    {sc.nickname && <span className="text-gray-400 font-normal text-xs ml-1">({sc.nickname})</span>}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{sc.school || '-'}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${
                  sc.gender === 'ชาย' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : sc.gender === 'หญิง' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
                  : 'bg-gray-100 text-gray-500'
                }`}>
                  {sc.gender || 'ไม่ระบุ'}
                </span>
              </div>
            ))}
            {preview.length > 10 && (
              <div className="px-4 py-3 bg-gray-50 dark:bg-scout-700/30 text-center">
                <p className="text-xs text-gray-400">และอีก <span className="font-semibold text-gray-600 dark:text-gray-300">{preview.length - 10} คน</span>...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Result ── */}
      {result && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 mb-3">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-emerald-700 dark:text-emerald-400">นำเข้าสำเร็จ!</p>
              <p className="text-sm text-emerald-600 dark:text-emerald-500">
                เพิ่มลูกเสือ <span className="font-bold">{result.count} คน</span> เข้าระบบแล้ว
                {result.errors > 0 && <span className="text-amber-500"> · พบข้อผิดพลาด {result.errors} รายการ</span>}
              </p>
              <p className="text-xs text-emerald-500 mt-1">
                🔒 รหัสผ่านเริ่มต้น: <span className="font-mono font-bold">scout1234</span>
              </p>
            </div>
          </div>

          {result.scouts && result.scouts.filter(s => !s.error).length > 0 && (
            <div className="rounded-xl bg-white dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 overflow-hidden">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 px-3 py-2 border-b border-emerald-100 dark:border-emerald-800">
                บัญชีที่สร้าง ({result.scouts.filter(s => !s.error).length} คน)
              </p>
              <div className="divide-y divide-emerald-50 dark:divide-emerald-900/30 max-h-32 overflow-y-auto">
                {result.scouts.filter(s => !s.error).slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{item.scout.firstName} {item.scout.lastName}</p>
                    <p className="text-xs font-mono text-emerald-500">{item.user.username}</p>
                  </div>
                ))}
                {result.scouts.filter(s => !s.error).length > 5 && (
                  <p className="text-xs text-emerald-500 px-3 py-2">และอีก {result.scouts.filter(s => !s.error).length - 5} คน...</p>
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