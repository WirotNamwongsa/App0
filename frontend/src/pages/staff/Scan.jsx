import { useEffect, useRef, useState, useCallback } from 'react'
import { useMutation, useQuery } from 'react-query'
import { Html5Qrcode } from 'html5-qrcode'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { Wifi, WifiOff, Users, Camera, CameraOff, LogOut } from 'lucide-react'
import BottomNav from '../../components/BottomNav'
import AdminEmptyState from '../../components/AdminEmptyState'
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

  // ดึงข้อมูลกิจกรรมที่ Staff คนนี้รับผิดชอบ
  const { data: activity } = useQuery('my-activity', async () => {
    const me = await api.get('/auth/me')
    return me.staffActivity || null
  }, { enabled: user?.role === 'STAFF' || user?.role === 'ADMIN' })

  // ดึงรายชื่อคนที่สแกนแล้ว
  const { data: scanned = [] } = useQuery(['scanned', activity?.id], () =>
    activity?.id ? api.get(`/attendance?activityId=${activity.id}`) : [],
    { enabled: !!activity?.id, refetchInterval: 10000 }
  )

  // ดึงสถิติ
  const { data: stats } = useQuery(['scan-stats', activity?.id], () =>
    activity?.id ? api.get(`/attendance/stats/${activity.id}`) : null,
    { enabled: !!activity?.id, refetchInterval: 10000 }
  )

  useEffect(() => {
    const onOnline = () => { setIsOnline(true); syncQueue() }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { 
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline) 
    }
  }, [])

  useEffect(() => {
    if (tab !== 'scan' && cameraOn) stopCamera()
  }, [tab])

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
    if (q.length === 0) return
    for (const item of q) {
      try { await api.post('/attendance/scan', item) } catch {}
    }
    localStorage.setItem(SCAN_QUEUE_KEY, '[]')
    setQueue([])
    toast.success('ซิงค์ข้อมูลย้อนหลังสำเร็จ')
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
      {!activity ? (
        user?.role === 'ADMIN' ? <AdminEmptyState /> : (
          <div className="flex items-center justify-center min-h-screen px-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-scout-900 dark:text-white mb-2">
                No Activity Assigned
              </p>
              <p className="text-scout-600 dark:text-scout-400">
                Please contact your administrator for assignment.
              </p>
            </div>
          </div>
        )
      ) : (
        /* หน้าจอหลักเมื่อพบกิจกรรม */
        <>
          {/* Header */}
          <div className="px-4 pt-10 pb-3 bg-gradient-to-b from-gray-300 dark:from-scout-900 to-transparent">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 mr-4">
                <p className="text-scout-600 dark:text-scout-400 text-xs font-bold uppercase tracking-wider">Staff Dashboard</p>
                <h1 className="text-scout-900 dark:text-white font-bold text-xl leading-tight truncate">
                  {activity.name}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isOnline ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {isOnline ? 'ONLINE' : `OFFLINE (${queue.length})`}
                </div>
                <button onClick={logout}
                  className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all active:scale-90">
                  <LogOut size={18} />
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white dark:bg-scout-900/80 rounded-2xl p-3 text-center border border-gray-300 dark:border-scout-800 shadow-sm">
                <p className="text-2xl font-black text-scout-600 dark:text-white">{scanned.length}</p>
                <p className="text-[10px] font-bold text-gray-500 dark:text-scout-400">สแกนแล้ว</p>
              </div>
              <div className="bg-white dark:bg-scout-900/80 rounded-2xl p-3 text-center border border-gray-300 dark:border-scout-800 shadow-sm">
                <p className="text-2xl font-black text-scout-400">{stats?.scheduled || 0}</p>
                <p className="text-[10px] font-bold text-gray-500 dark:text-scout-400">ตามตาราง</p>
              </div>
              <div className="bg-white dark:bg-scout-900/80 rounded-2xl p-3 text-center border border-gray-300 dark:border-scout-800 shadow-sm">
                <p className="text-2xl font-black text-orange-500">{scanned.filter(a => a.outOfSchedule).length}</p>
                <p className="text-[10px] font-bold text-gray-500 dark:text-scout-400">นอกเวลา</p>
              </div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex mx-4 mt-2 mb-4 bg-gray-300 dark:bg-scout-900 rounded-2xl p-1.5">
            {['scan', 'list'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t ? 'bg-white dark:bg-scout-700 text-scout-900 dark:text-white shadow-md' : 'text-gray-500 dark:text-scout-400'}`}>
                {t === 'scan' ? '📷 SCAN QR' : '📋 LIST'}
              </button>
            ))}
          </div>

          {/* Scan Tab Content */}
          {tab === 'scan' && (
            <div className="px-4 space-y-4">
              <div className="relative bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-scout-800" style={{ aspectRatio: '1/1' }}>
                {!cameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-100 dark:bg-scout-900">
                    <div className="w-20 h-20 rounded-full bg-scout-500/10 flex items-center justify-center">
                      <CameraOff size={40} className="text-scout-600" />
                    </div>
                    <p className="text-gray-500 font-bold">กล้องปิดอยู่</p>
                    {cameraError && <p className="text-red-500 text-xs text-center px-10">{cameraError}</p>}
                  </div>
                )}

                <div id="qr-reader" className="w-full h-full" />

                {cameraOn && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-64 h-64">
                      <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-green-400 rounded-tl-3xl" />
                      <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-green-400 rounded-tr-3xl" />
                      <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-green-400 rounded-bl-3xl" />
                      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-green-400 rounded-br-3xl" />
                      <div className="absolute left-4 right-4 h-1 bg-green-400/50 shadow-[0_0_15px_rgba(74,222,128,0.8)] scan-line" />
                    </div>
                  </div>
                )}

                {result && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm">
                    <div className={`w-full rounded-3xl p-6 text-center border-b-8 ${
                      result.status === 'success' ? 'bg-green-950/90 border-green-500' :
                      result.status === 'duplicate' ? 'bg-yellow-950/90 border-yellow-500' :
                      'bg-orange-950/90 border-orange-500'
                    }`}>
                      <p className="text-5xl mb-4">
                        {result.status === 'success' ? '✅' : result.status === 'duplicate' ? '⚠️' : '🔶'}
                      </p>
                      <h3 className="text-white font-black text-xl mb-1">
                        {result.status === 'success' ? 'บันทึกสำเร็จ' : result.status === 'duplicate' ? 'เคยสแกนแล้ว' : 'นอกตาราง'}
                      </h3>
                      <p className="text-green-400 font-bold text-lg leading-tight">
                        {result.scout?.firstName} {result.scout?.lastName}
                      </p>
                      <p className="text-white/60 text-sm mt-2 font-medium">
                        หมู่ {result.scout?.squad?.number || '-'} · {result.scout?.scoutCode}
                      </p>
                      {result.status === 'out_of_schedule' && (
                        <button onClick={() => scanMutation.mutate({ scoutCode: result.scout?.scoutCode, forceRecord: true })}
                          className="mt-4 w-full bg-orange-500 hover:bg-orange-600 rounded-xl py-3 text-sm font-black text-white transition-all shadow-lg">
                          ยืนยันบันทึกพิเศษ
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={toggleCamera}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 ${
                  cameraOn
                    ? 'bg-red-500/20 border-2 border-red-500 text-red-500'
                    : 'bg-scout-600 text-white hover:bg-scout-700'
                }`}>
                {cameraOn ? <><CameraOff size={22} /> ปิดกล้อง</> : <><Camera size={22} /> เริ่มสแกน QR</>}
              </button>
            </div>
          )}

          {/* List Tab Content */}
          {tab === 'list' && (
            <div className="px-4 space-y-3 pb-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-gray-600 dark:text-gray-400 font-bold text-sm">ประวัติการสแกนล่าสุด</h3>
                <span className="text-[10px] bg-gray-300 dark:bg-scout-800 px-2 py-1 rounded-md font-bold">Total: {scanned.length}</span>
              </div>
              
              {scanned.length === 0 ? (
                <div className="text-center py-20 opacity-40">
                  <p className="text-5xl mb-2">📥</p>
                  <p className="font-bold">ยังไม่มีข้อมูล</p>
                </div>
              ) : (
                scanned.map((a, i) => (
                  <div key={a.id} className="bg-white dark:bg-scout-900/60 rounded-2xl p-4 border border-gray-300 dark:border-scout-800 flex items-center gap-4 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-scout-800 flex items-center justify-center text-[10px] font-black text-gray-400">
                      {scanned.length - i}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-scout-900 dark:text-white font-bold truncate">
                        {a.scout?.firstName} {a.scout?.lastName}
                      </p>
                      <p className="text-gray-500 dark:text-scout-400 text-xs font-medium">
                         หมู่ {a.scout?.squad?.number || '-'} · {new Date(a.scannedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {a.outOfSchedule ? 
                        <span className="text-[9px] font-black text-orange-500 bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/20">EXTRA</span> : 
                        <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">NORMAL</span>
                      }
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Navigation ด้านล่าง */}
      <BottomNav />
    </div>
  )
}