import { useEffect, useRef, useState, useCallback } from 'react'
import { useMutation, useQuery } from 'react-query'
import { Html5Qrcode } from 'html5-qrcode'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import BottomNav from '../../components/BottomNav'
import { Wifi, WifiOff, Users, Camera, CameraOff, LogOut } from 'lucide-react'
import ThemeToggle from '../../components/ThemeToggle'
import toast from 'react-hot-toast'

const SCAN_QUEUE_KEY = 'scan_queue'

export default function StaffScan() {
  const { user, logout } = useAuthStore()
  const [tab, setTab] = useState('scan')
  const [result, setResult] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [queue, setQueue] = useState(() => JSON.parse(localStorage.getItem(SCAN_QUEUE_KEY) || '[]'))
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const scannerRef = useRef(null)
  const processingRef = useRef(false)

  const { data: activity } = useQuery('my-activity', async () => {
    const me = await api.get('/auth/me')
    return me.staffActivity
  }, { enabled: user?.role === 'STAFF' || user?.role === 'ADMIN' })

  const { data: scanned = [] } = useQuery(['scanned', activity?.id], () =>
    activity?.id ? api.get(`/attendance?activityId=${activity.id}`) : [],
    { enabled: !!activity?.id, refetchInterval: 10000 }
  )

  const { data: stats } = useQuery(['scan-stats', activity?.id], () =>
    activity?.id ? api.get(`/attendance/stats/${activity.id}`) : null,
    { enabled: !!activity?.id, refetchInterval: 10000 }
  )

  useEffect(() => {
    const onOnline = () => { setIsOnline(true); syncQueue() }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  // หยุดกล้องเมื่อออกจาก tab scan
  useEffect(() => {
    if (tab !== 'scan' && cameraOn) stopCamera()
  }, [tab])

  // cleanup เมื่อ unmount
  useEffect(() => {
    return () => { stopCamera() }
  }, [])

  const scanMutation = useMutation(
    ({ scoutCode, forceRecord }) => api.post('/attendance/scan', { scoutCode, forceRecord }),
    {
      onSuccess: (data) => {
        setResult(data)
        setTimeout(() => setResult(null), 3000)
      },
      onError: (err) => {
        toast.error(err?.response?.data?.error || 'เกิดข้อผิดพลาด')
      }
    }
  )

  async function syncQueue() {
    const q = JSON.parse(localStorage.getItem(SCAN_QUEUE_KEY) || '[]')
    for (const item of q) {
      try { await api.post('/attendance/scan', item) } catch {}
    }
    localStorage.setItem(SCAN_QUEUE_KEY, '[]')
    setQueue([])
  }

  const handleScan = useCallback(async (scoutCode) => {
    if (processingRef.current) return
    processingRef.current = true

    if (!isOnline) {
      const newQueue = [...queue, { scoutCode }]
      localStorage.setItem(SCAN_QUEUE_KEY, JSON.stringify(newQueue))
      setQueue(newQueue)
      toast('📥 บันทึกใน Queue (ออฟไลน์)', { icon: '📵' })
      setTimeout(() => { processingRef.current = false }, 1500)
      return
    }

    try {
      await scanMutation.mutateAsync({ scoutCode, forceRecord: false })
    } catch {}
    setTimeout(() => { processingRef.current = false }, 2000)
  }, [isOnline, queue])

  async function startCamera() {
    setCameraError(null)
    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        handleScan,
        () => {}
      )
      setCameraOn(true)
    } catch (err) {
      setCameraError('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้งานกล้อง')
      setCameraOn(false)
    }
  }

  async function stopCamera() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      scannerRef.current = null
    }
    setCameraOn(false)
    setResult(null)
  }

  function toggleCamera() {
    if (cameraOn) stopCamera()
    else startCamera()
  }

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-scout-950 pb-20">

      {/* Header */}
      <div className="px-4 pt-10 pb-3 bg-gradient-to-b from-gray-300 dark:from-scout-900 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-scout-600 dark:text-scout-400 text-xs">กิจกรรมของฉัน</p>
            <h1 className="text-scout-900 dark:text-white font-display font-bold text-lg leading-tight">
              {activity?.name || 'รอการยืนยัน'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${isOnline ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
              {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
              {isOnline ? 'ออนไลน์' : `ออฟไลน์ (${queue.length})`}
            </div>
            <ThemeToggle />
            <button onClick={logout}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:bg-red-900/50 dark:hover:bg-red-900/70 dark:text-red-300 transition-all">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-50 dark:bg-scout-900/80 rounded-xl p-3 text-center border border-gray-400 dark:border-scout-800">
            <p className="text-xl font-bold text-white">{scanned.length}</p>
            <p className="text-xs text-gray-500 dark:text-scout-400">สแกนแล้ว</p>
          </div>
          <div className="flex-1 bg-gray-50 dark:bg-scout-900/80 rounded-xl p-3 text-center border border-gray-400 dark:border-scout-800">
            <p className="text-xl font-bold text-scout-300">{stats?.scheduled || 0}</p>
            <p className="text-xs text-gray-500 dark:text-scout-400">ตามตาราง</p>
          </div>
          <div className="flex-1 bg-gray-50 dark:bg-scout-900/80 rounded-xl p-3 text-center border border-gray-400 dark:border-scout-800">
            <p className="text-xl font-bold text-orange-400">{scanned.filter(a => a.outOfSchedule).length}</p>
            <p className="text-xs text-gray-500 dark:text-scout-400">นอกตาราง</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mt-3 mb-3 bg-gray-300 dark:bg-scout-900 rounded-xl p-1">
        {['scan', 'list'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white dark:bg-scout-700 text-scout-900 dark:text-white shadow' : 'text-scout-400'}`}>
            {t === 'scan' ? '📷 สแกน' : '📋 รายชื่อ'}
          </button>
        ))}
      </div>

      {tab === 'scan' && (
        <div className="px-4 space-y-3">

          {/* กล้อง */}
          <div className="relative bg-black rounded-3xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
            {/* placeholder เมื่อกล้องปิด */}
            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-300 dark:bg-scout-900">
                <CameraOff size={48} className="text-scout-600" />
                <p className="text-gray-500 dark:text-scout-400 text-sm">กล้องปิดอยู่</p>
                {cameraError && <p className="text-red-400 text-xs text-center px-6">{cameraError}</p>}
              </div>
            )}

            {/* QR Reader */}
            <div id="qr-reader" className="w-full h-full" />

            {/* กรอบเล็ง */}
            {cameraOn && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-48 h-48">
                  {/* มุมกรอบ */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-green-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-green-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-green-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-green-400 rounded-br-lg" />
                  {/* เส้นสแกน */}
                  <div className="absolute left-2 right-2 h-0.5 bg-green-400/80 scan-line" />
                </div>
              </div>
            )}

            {/* Result overlay */}
            {result && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className={`rounded-2xl p-5 text-center mx-6 border-2 ${
                  result.status === 'success' ? 'bg-green-900/80 border-green-500' :
                  result.status === 'duplicate' ? 'bg-yellow-900/80 border-yellow-500' :
                  'bg-orange-900/80 border-orange-500'
                }`}>
                  <p className="text-4xl mb-2">
                    {result.status === 'success' ? '✅' : result.status === 'duplicate' ? '⚠️' : '🔶'}
                  </p>
                  <p className="text-white font-bold text-base">
                    {result.status === 'success' ? 'บันทึกสำเร็จ' : result.status === 'duplicate' ? 'สแกนซ้ำแล้ว' : 'นอกตาราง'}
                  </p>
                  <p className="text-white/80 text-sm mt-1">
                    {result.scout?.firstName} {result.scout?.lastName}
                  </p>
                  {result.scout?.squad && (
                    <p className="text-white/50 text-xs mt-0.5">หมู่ {result.scout.squad.number}</p>
                  )}
                  {result.status === 'out_of_schedule' && (
                    <button onClick={() => scanMutation.mutate({ scoutCode: result.scout?.scoutCode, forceRecord: true })}
                      className="mt-3 w-full bg-white/20 hover:bg-white/30 rounded-xl py-2 text-sm font-medium text-white transition-colors">
                      บันทึกพิเศษ
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ปุ่มเปิด/ปิดกล้อง */}
          <button onClick={toggleCamera}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all active:scale-95 ${
              cameraOn
                ? 'bg-red-900/50 border border-red-700 text-red-300 hover:bg-red-900'
                : 'bg-scout-700 hover:bg-scout-600 text-white shadow-lg shadow-scout-900'
            }`}>
            {cameraOn ? <><CameraOff size={20} /> ปิดกล้อง</> : <><Camera size={20} /> เปิดกล้องสแกน</>}
          </button>

          <p className="text-center text-scout-500 text-xs">
            {cameraOn ? 'นำ QR Code เข้ามาในกรอบสีเขียว' : 'กดปุ่มด้านบนเพื่อเริ่มสแกน'}
          </p>
        </div>
      )}

      {tab === 'list' && (
        <div className="px-4 space-y-2">
          <div className="bg-gray-50 dark:bg-scout-900/80 rounded-xl p-3 border border-gray-400 dark:border-scout-800 flex items-center gap-2 mb-3">
            <Users size={15} className="text-scout-400" />
            <span className="text-scout-700 dark:text-scout-300 text-sm">สแกนแล้ว <strong className="text-white">{scanned.length}</strong> คน</span>
          </div>
          {scanned.length === 0 && (
            <div className="text-center py-10 text-gray-400 dark:text-scout-500">
              <p className="text-3xl mb-2">📋</p>
              <p>ยังไม่มีการสแกน</p>
            </div>
          )}
          {scanned.map((a, i) => (
            <div key={a.id} className="bg-gray-50 dark:bg-scout-900/80 rounded-2xl p-3 border border-gray-400 dark:border-scout-800 flex items-center gap-3">
              <span className="text-scout-500 text-xs w-5 text-center">{i + 1}</span>
              <span className="text-lg">{a.outOfSchedule ? '🔶' : '✅'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-scout-900 dark:text-white text-sm font-medium truncate">{a.scout?.firstName} {a.scout?.lastName}</p>
                <p className="text-gray-500 dark:text-scout-400 text-xs">หมู่ {a.scout?.squad?.number} · {new Date(a.scannedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              {a.outOfSchedule && <span className="text-xs text-orange-400 bg-orange-900/30 px-2 py-0.5 rounded-full flex-shrink-0">นอกตาราง</span>}
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  )
}