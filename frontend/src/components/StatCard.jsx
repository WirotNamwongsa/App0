export default function StatCard({ label, value, max, color = 'scout', icon }) {
  const pct = (max != null && max > 0) ? Math.round((value / max) * 100) : 0

  return (
    <div className="card flex-1">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-display font-bold text-scout-800">
        {value}
        {max != null && (
          <span className="text-sm font-normal text-gray-400">/{max}</span>
        )}
      </div>
      {max != null && (
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-scout-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}