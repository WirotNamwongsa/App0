import React from 'react'
import { PlusCircle, Users, Calendar } from 'lucide-react'

export default function AdminEmptyState() {
  return (
    <div className="flex items-center justify-center min-h-screen px-6">
      <div className="max-w-2xl w-full">
        {/* Glassmorphism card */}
        <div className="bg-white/10 dark:bg-scout-900/20 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-scout-700/20">
          
          {/* Header with icon */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/40 dark:from-scout-600/30 dark:to-scout-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <div className="text-2xl">🏕️️</div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              The Base Camp is Quiet
            </h1>
            
            <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed text-lg">
              Your headquarters is currently empty. No activities have been charted yet. 
              Start by creating a new mission for your troops.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-scout-800/30 dark:to-scout-700/20 rounded-xl p-6 border border-emerald-200 dark:border-scout-600/30">
              <div className="text-center">
                <PlusCircle className="w-8 h-8 mx-auto mb-3 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Create Mission</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Start a new scouting activity</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-scout-800/30 dark:to-scout-700/20 rounded-xl p-6 border border-amber-200 dark:border-scout-600/30">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-3 text-amber-600 dark:text-amber-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Manage Scouts</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">View and manage scout profiles</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-scout-800/30 dark:to-scout-700/20 rounded-xl p-6 border border-blue-200 dark:border-scout-600/30">
              <div className="text-center">
                <Calendar className="w-8 h-8 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Schedule Events</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Plan and organize activities</p>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="text-center">
            <button className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-scout-600 dark:to-scout-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <span className="text-xl">🚀</span>
              <span>Deploy First Mission</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
