import { useQuery } from 'react-query'
import api from '../../lib/api'
import PageHeader from '../../components/PageHeader'
import BottomNav from '../../components/BottomNav'

const typeLabel = { MAIN: 'กิจกรรมหลัก', SPECIAL: 'กิจกรรมพิเศษ', FREE: 'กิจกรรมยามว่าง' }
const typeClass = { MAIN: 'badge-main', SPECIAL: 'badge-special', FREE: 'badge-free' }

export default function ScoutActivities() {
  const { data: scout } = useQuery('my-scout', () => api.get('/scouts/my'))
  const { data: allActivities } = useQuery('activities', () => api.get('/activities'))

  const attended = new Set(scout?.attendances?.map(a => a.activityId))
  const groups = { MAIN: [], SPECIAL: [], FREE: [] }
  allActivities?.forEach(a => { if (groups[a.type]) groups[a.type].push(a) })

  return (
    <div className="page">
      <PageHeader title="กิจกรรมของฉัน" />
      {Object.entries(groups).map(([type, acts]) => (
        <div key={type} className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className={typeClass[type]}>{typeLabel[type]}</span>
            <span className="text-xs text-gray-400">{acts.filter(a => attended.has(a.id)).length}/{acts.length}</span>
          </div>
          <div className="space-y-2">
            {acts.map(a => (
              <div key={a.id} className="card flex items-center gap-3 py-3">
                <span className="text-xl">{attended.has(a.id) ? '✅' : '⬜'}</span>
                <span className={`text-sm ${attended.has(a.id) ? 'text-scout-800 font-medium' : 'text-gray-500'}`}>{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <BottomNav />
    </div>
  )
}
