// src/pages/staff/StaffScanned.jsx
import { useParams, useNavigate } from 'react-router-dom'

export default function StaffScanned() {
  const { scheduleId } = useParams()
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-scout-700 bg-scout-50 hover:bg-scout-100"
        >
          ← กลับ
        </button>
      </div>

      <h1 className="text-lg font-display font-bold text-scout-900 mb-2">
        รายชื่อการสแกน
      </h1>
      <p className="text-sm text-gray-500">
        schedule: {scheduleId || 'ทั้งหมด'}
      </p>
    </div>
  )
}

