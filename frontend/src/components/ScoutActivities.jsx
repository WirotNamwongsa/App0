import React from 'react'
import { Calendar, Clock } from 'lucide-react'

export default function ScoutActivities({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-6">
        <div className="max-w-md w-full text-center">
          {/* Main card with glassmorphism effect */}
          <div className="bg-white/10 dark:bg-scout-900/20 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-scout-700/20">
            
            {/* Centered icon with gradient background */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-scout-600/20 to-scout-700/40 dark:from-scout-500/30 dark:to-scout-600/40 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Calendar className="w-12 h-12 text-scout-700 dark:text-scout-300" />
            </div>

            {/* Main message */}
            <h2 className="text-2xl font-bold text-scout-900 dark:text-white mb-3">
              There are no activities currently available
            </h2>
            
            {/* Suggestion with icon */}
            <div className="flex items-center justify-center gap-2 text-scout-600 dark:text-scout-400 mb-6">
              <Clock className="w-4 h-4" />
              <p className="text-sm">
                Please wait for updates from the Scout Leader.
              </p>
            </div>

            {/* Additional context */}
            <div className="bg-scout-50 dark:bg-scout-800/30 rounded-xl p-4 border border-scout-200 dark:border-scout-600/30">
              <p className="text-xs text-scout-700 dark:text-scout-300">
                Activities will appear here once they are scheduled and assigned to your troop.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-scout-900 dark:text-white mb-4">
        Scout Activities
      </h2>
      {activities.map((activity, index) => (
        <div key={index} className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-scout-900 dark:text-white">
                {activity.name || 'Activity Name'}
              </h3>
              <p className="text-sm text-scout-600 dark:text-scout-400">
                {activity.description || 'Activity description'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-scout-500 dark:text-scout-400">
                {activity.time || 'Time not set'}
              </p>
              <p className="text-xs text-scout-500 dark:text-scout-400">
                {activity.location || 'Location not set'}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
