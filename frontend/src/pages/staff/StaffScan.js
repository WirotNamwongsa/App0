// src/pages/staff/StaffScan.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { staffApi } from '../../services/api';
import { offlineSync } from '../../services/offlineSync';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function StaffScan() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activity, setActivity] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { type: 'success'|'duplicate'|'outside', data }
  const [scannedCount, setScannedCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const [activeTab, setActiveTab] = useState('scan');
  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);
  const resultTimerRef = useRef(null);

  useEffect(() => {
    const onOnline = () => { setIsOnline(true); syncQueue(); };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  useEffect(() => {
    staffApi.getActivity().then(r => {
      setActivity(r.data.activity);
      setSchedules(r.data.schedules);
      if (r.data.schedules.length > 0) setSelectedSchedule(r.data.schedules[0].id);
      // Cache scouts for offline
      const allScouts = r.data.schedules.flatMap(s => s.groups?.flatMap(g => g.patrol?.scouts || []) || []);
      offlineSync.cacheScouts(allScouts);
      r.data.schedules.forEach(s => {
        const ids = s.groups?.flatMap(g => g.patrol?.scouts?.map(sc => sc.id) || []) || [];
        offlineSync.cacheSchedule(s.id, ids);
      });
    }).catch(err => toast.error('โหลดข้อมูลไม่สำเร็จ'));
    setQueueCount(offlineSync.getQueue().length);
  }, []);

  const syncQueue = useCallback(async () => {
    const queue = offlineSync.getQueue();
    if (queue.length === 0) return;
    try {
      const res = await staffApi.batchSync(queue);
      offlineSync.clearQueue();
      setQueueCount(0);
      toast.success(`Sync สำเร็จ ${res.data.synced} รายการ`);
    } catch (e) {
      toast.error('Sync ไม่สำเร็จ');
    }
  }, []);

  const startScanner = () => {
    if (!selectedSchedule) return toast.error('กรุณาเลือกตาราง');
    setScanning(true);
    setTimeout(() => {
      if (!scannerRef.current) return;
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1,
        showTorchButtonIfSupported: true,
      });
      scanner.render(handleScan, () => {});
      scannerInstanceRef.current = scanner;
    }, 200);
  };

  const stopScanner = () => {
    if (scannerInstanceRef.current) {
      scannerInstanceRef.current.clear().catch(() => {});
      scannerInstanceRef.current = null;
    }
    setScanning(false);
    setScanResult(null);
  };

  const handleScan = async (qrToken) => {
    if (resultTimerRef.current) return; // prevent rapid re-scans

    const scheduleData = schedules.find(s => s.id === selectedSchedule);

    if (!isOnline) {
      // Offline mode
      const scout = offlineSync.lookupScout(qrToken);
      if (!scout) { showResult({ type: 'error', message: 'ไม่พบลูกเสือ' }); return; }
      if (offlineSync.isAlreadyScanned(selectedSchedule, scout.id)) {
        showResult({ type: 'duplicate', scout, scannedAt: 'ออฟไลน์' });
        return;
      }
      const inSchedule = offlineSync.isScoutInSchedule(selectedSchedule, scout.id);
      offlineSync.markScanned(selectedSchedule, scout.id);
      offlineSync.queueScan({ qrToken, scheduleId: selectedSchedule, status: 'PASSED' });
      setQueueCount(offlineSync.getQueue().length);
      setScannedCount(c => c + 1);
      showResult({ type: inSchedule ? 'success' : 'outside', scout, inSchedule });
      return;
    }

    try {
      const res = await staffApi.scan({ qrToken, scheduleId: selectedSchedule });
      const { scout, inSchedule, attendance } = res.data;
      setScannedCount(c => c + 1);
      offlineSync.markScanned(selectedSchedule, scout.patrol?.id);
      showResult({ type: inSchedule ? 'success' : 'outside', scout, inSchedule });
    } catch (err) {
      if (err.response?.status === 409) {
        showResult({ type: 'duplicate', scout: err.response.data, scannedAt: err.response.data.scannedAt });
      } else if (err.response?.status === 404) {
        showResult({ type: 'error', message: 'ไม่พบลูกเสือในระบบ' });
      } else {
        showResult({ type: 'error', message: 'เกิดข้อผิดพลาด' });
      }
    }
  };

  const [pendingOutside, setPendingOutside] = useState(null);

  const showResult = (result) => {
    if (result.type === 'outside') {
      setPendingOutside(result);
      return;
    }
    setScanResult(result);
    resultTimerRef.current = setTimeout(() => {
      setScanResult(null);
      resultTimerRef.current = null;
    }, 2000);
  };

  const confirmOutside = async (confirm) => {
    if (!pendingOutside) return;
    if (confirm) {
      if (isOnline) {
        try {
          await staffApi.scan({ qrToken: pendingOutside.scout?.qrToken, scheduleId: selectedSchedule, status: 'SPECIAL' });
          setScannedCount(c => c + 1);
          setScanResult({ type: 'success', scout: pendingOutside.scout, special: true });
          resultTimerRef.current = setTimeout(() => { setScanResult(null); resultTimerRef.current = null; }, 2000);
        } catch (e) { toast.error('บันทึกไม่สำเร็จ'); }
      } else {
        offlineSync.queueScan({ qrToken: pendingOutside.scout?.qrToken, scheduleId: selectedSchedule, status: 'SPECIAL' });
        setQueueCount(offlineSync.getQueue().length);
        setScannedCount(c => c + 1);
        setScanResult({ type: 'success', scout: pendingOutside.scout, special: true });
        resultTimerRef.current = setTimeout(() => { setScanResult(null); resultTimerRef.current = null; }, 2000);
      }
    }
    setPendingOutside(null);
  };

  const selectedSched = schedules.find(s => s.id === selectedSchedule);
  const slotLabel = { MORNING: 'เช้า', AFTERNOON: 'บ่าย', EVENING: 'เย็น' };

  return (
    <div style={{ minHeight: '100vh', background: '#060e1a', color: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '48px 20px 16px',
        background: 'linear-gradient(180deg, rgba(30,58,95,0.9) 0%, transparent 100%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 4 }}>กิจกรรมของฉัน</p>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#d4a017' }}>{activity?.name || 'กำลังโหลด...'}</h1>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 8,
              color: '#fecaca',
              padding: '8px 12px',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            ออกจากระบบ
          </button>
        </div>

        {/* Online status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
          background: isOnline ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${isOnline ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: 8, padding: '6px 12px', display: 'inline-flex',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? '#22c55e' : '#ef4444', animation: !isOnline ? 'pulse 1s infinite' : 'none' }} />
          <span style={{ fontSize: '0.8rem', color: isOnline ? '#22c55e' : '#ef4444' }}>
            {isOnline ? 'ออนไลน์' : `ออฟไลน์ (Queue: ${queueCount})`}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 20px' }}>
        {['scan', 'list'].map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab !== 'scan') stopScanner(); }} style={{
            flex: 1, background: 'none', color: activeTab === tab ? '#d4a017' : '#64748b',
            padding: '12px', fontSize: '0.9rem', fontWeight: 600,
            borderBottom: activeTab === tab ? '2px solid #d4a017' : '2px solid transparent',
          }}>
            {tab === 'scan' ? '📷 สแกน' : '📋 รายชื่อ'}
          </button>
        ))}
      </div>

      {activeTab === 'scan' && (
        <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Schedule selector */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', color: '#94a3b8' }}>เลือกตารางกิจกรรม</label>
            <select value={selectedSchedule || ''} onChange={e => setSelectedSchedule(e.target.value)} disabled={scanning}>
              <option value="">-- เลือกตาราง --</option>
              {schedules.map(s => (
                <option key={s.id} value={s.id}>
                  {new Date(s.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} {slotLabel[s.slot]} — {s.camp?.name}
                </option>
              ))}
            </select>
          </div>

          {selectedSched && (
            <div style={{ background: 'rgba(30,58,95,0.4)', borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem', color: '#94a3b8' }}>
              สแกนแล้ว <strong style={{ color: '#d4a017' }}>{scannedCount}</strong> คน
              {selectedSched._count && <> / {selectedSched._count.attendances} ตามตาราง</>}
            </div>
          )}

          {/* Scanner */}
          {!scanning ? (
            <button onClick={startScanner} disabled={!selectedSchedule} style={{
              background: 'linear-gradient(135deg, #d4a017, #b8860b)', color: '#000',
              borderRadius: 16, padding: '20px', fontSize: '1.1rem', fontWeight: 800,
              boxShadow: selectedSchedule ? '0 0 40px rgba(212,160,23,0.3)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <span style={{ fontSize: '1.5rem' }}>📷</span> เริ่มสแกน QR
            </button>
          ) : (
            <div style={{ position: 'relative' }}>
              <div id="qr-reader" ref={scannerRef} style={{ borderRadius: 16, overflow: 'hidden' }} />
              <button onClick={stopScanner} style={{
                position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', padding: '8px 14px', fontSize: '0.85rem',
              }}>หยุด</button>
            </div>
          )}

          {/* Scan Result Overlay */}
          {scanResult && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 200,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            }}>
              <div style={{
                background: scanResult.type === 'success' ? 'rgba(34,197,94,0.15)' : scanResult.type === 'duplicate' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                border: `2px solid ${scanResult.type === 'success' ? '#22c55e' : scanResult.type === 'duplicate' ? '#f59e0b' : '#ef4444'}`,
                borderRadius: 20, padding: 32, textAlign: 'center', minWidth: 280,
              }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>
                  {scanResult.type === 'success' ? '✅' : scanResult.type === 'duplicate' ? '⚠️' : '❌'}
                </div>
                <h2 style={{ fontWeight: 800, marginBottom: 8, fontSize: '1.1rem' }}>
                  {scanResult.type === 'success' ? (scanResult.special ? 'บันทึกพิเศษ ✓' : 'บันทึกสำเร็จ ✓') : scanResult.type === 'duplicate' ? 'สแกนซ้ำ!' : 'ไม่พบข้อมูล'}
                </h2>
                {scanResult.scout && (
                  <>
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>{scanResult.scout.firstName} {scanResult.scout.lastName}</p>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>หมู่ {scanResult.scout.patrol?.number} กอง {scanResult.scout.patrol?.troop?.number}</p>
                    {scanResult.type === 'duplicate' && <p style={{ color: '#f59e0b', fontSize: '0.8rem', marginTop: 6 }}>เวลา {new Date(scanResult.scannedAt).toLocaleTimeString('th-TH')}</p>}
                  </>
                )}
                {scanResult.message && <p style={{ color: '#ef4444', fontSize: '0.88rem' }}>{scanResult.message}</p>}
              </div>
            </div>
          )}

          {/* Outside schedule confirmation */}
          {pendingOutside && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 300,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
            }}>
              <div style={{
                background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.4)',
                borderRadius: 20, padding: 28, maxWidth: 320, width: '90%', textAlign: 'center',
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
                <h2 style={{ fontWeight: 800, color: '#f59e0b', marginBottom: 8 }}>ลูกเสือนอกตาราง</h2>
                <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>{pendingOutside.scout?.firstName} {pendingOutside.scout?.lastName}</p>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 20 }}>ไม่มีในรายชื่อตารางนี้</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => confirmOutside(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', padding: 12, fontWeight: 600 }}>ไม่บันทึก</button>
                  <button onClick={() => confirmOutside(true)} style={{ flex: 1, background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: 10, color: '#000', padding: 12, fontWeight: 700 }}>บันทึกพิเศษ</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'list' && selectedSchedule && (
        <ScannedList scheduleId={selectedSchedule} />
      )}
    </div>
  );
}

function ScannedList({ scheduleId }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    staffApi.getScanned(scheduleId).then(r => setData(r.data)).catch(console.error);
  }, [scheduleId]);

  if (!data) return <div style={{ padding: 40, textAlign: 'center' }}><div style={{ width: 30, height: 30, borderRadius: '50%', border: '3px solid rgba(212,160,23,0.2)', borderTopColor: '#d4a017', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} /></div>;

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>{data.scannedCount}</p>
          <p style={{ fontSize: '0.78rem', color: '#64748b' }}>สแกนแล้ว</p>
        </div>
        <div style={{ flex: 1, background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#94a3b8' }}>{data.notScanned?.length}</p>
          <p style={{ fontSize: '0.78rem', color: '#64748b' }}>ยังไม่มา</p>
        </div>
      </div>

      {data.scanned?.length > 0 && (
        <div>
          <h3 style={{ fontSize: '0.88rem', color: '#94a3b8', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>สแกนแล้ว</h3>
          {data.scanned.map(att => (
            <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span>{att.status === 'PASSED' ? '✅' : att.status === 'SPECIAL' ? '⚠️' : '❌'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{att.scout?.firstName} {att.scout?.lastName}</p>
                <p style={{ color: '#64748b', fontSize: '0.75rem' }}>หมู่ {att.scout?.patrol?.number} กอง {att.scout?.patrol?.troop?.number}</p>
              </div>
              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{new Date(att.scannedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
      )}

      {data.notScanned?.length > 0 && (
        <div>
          <h3 style={{ fontSize: '0.88rem', color: '#94a3b8', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>ยังไม่มา ({data.notScanned.length} คน)</h3>
          {data.notScanned.map(scout => (
            <div key={scout.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: 0.6 }}>
              <span>⬜</span>
              <div>
                <p style={{ fontSize: '0.9rem' }}>{scout.firstName} {scout.lastName}</p>
                <p style={{ color: '#64748b', fontSize: '0.75rem' }}>{scout.scoutCode}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
