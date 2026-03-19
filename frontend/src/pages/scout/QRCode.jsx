import { useQuery } from 'react-query'
import { QRCodeSVG } from 'qrcode.react'
import api from '../../lib/api'
import PageHeader from '../../components/PageHeader'
import BottomNav from '../../components/BottomNav'

export default function ScoutQR() {
  const { data: scout } = useQuery('my-scout', () => api.get('/scouts/my'))

  return (
    <div className="page">
      <PageHeader title="QR Code ของฉัน" />
      <div className="card flex flex-col items-center py-8">
        {scout ? (
          <>
            <div className="p-4 bg-white rounded-2xl shadow-inner border border-scout-100">
              <QRCodeSVG value={scout.scoutCode} size={200} level="H" />
            </div>
            <div className="mt-6 text-center space-y-1">
              <p className="font-display font-bold text-scout-900 text-lg">{scout.firstName} {scout.lastName}</p>
              <p className="text-sm text-gray-500">รหัส: {scout.scoutCode}</p>
              {scout.squad && (
                <p className="text-sm text-gray-500">หมู่ {scout.squad.number} · กอง {scout.squad.troop?.number}</p>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">แสดง QR นี้ให้ผู้จัดกิจกรรมสแกน</p>
          </>
        ) : (
          <div className="w-8 h-8 border-2 border-scout-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      <BottomNav />
    </div>
  )
}
