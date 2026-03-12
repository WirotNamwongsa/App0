import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'

export default function ThemeToggle({ className = '' }) {
  const { dark, toggle } = useThemeStore()

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-xl transition-all
        hover:bg-scout-100 dark:hover:bg-scout-800
        text-scout-600 dark:text-scout-300
        ${className}`}
      title={dark ? 'เปลี่ยนเป็น Light mode' : 'เปลี่ยนเป็น Dark mode'}
    >
      {dark
        ? <Sun size={20} className="text-gold-400" />
        : <Moon size={20} />
      }
    </button>
  )
}