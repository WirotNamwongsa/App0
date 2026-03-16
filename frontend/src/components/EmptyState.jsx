import React from 'react'

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  buttonText, 
  buttonAction,
  secondaryButton,
  secondaryAction 
}) {
  return (
    <div className="flex items-center justify-center min-h-screen px-6">
      <div className="max-w-md w-full text-center">
        {/* Glassmorphism card */}
        <div className="bg-white/10 dark:bg-scout-900/20 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-scout-700/20">
          
          {/* Central Icon */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/40 dark:from-scout-600/30 dark:to-scout-500/40 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <div className="text-3xl">{icon}</div>
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {title}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            {description}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {buttonText && (
              <button
                onClick={buttonAction}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-scout-600 dark:to-scout-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2">
                  {buttonText}
                </span>
              </button>
            )}
            
            {secondaryButton && (
              <button
                onClick={secondaryAction}
                className="w-full sm:w-auto px-6 py-3 bg-white/80 dark:bg-scout-800/50 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-white/90 dark:hover:bg-scout-800/70 border border-gray-200 dark:border-scout-600/30 transition-all duration-200"
              >
                {secondaryButton}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
