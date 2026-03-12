import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set) => ({
      dark: false,
      toggle: () => set(s => {
        const next = !s.dark
        if (next) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
        return { dark: next }
      }),
      init: () => {
        const stored = JSON.parse(localStorage.getItem('jamboree-theme') || '{}')
        if (stored?.state?.dark) document.documentElement.classList.add('dark')
      }
    }),
    { name: 'jamboree-theme' }
  )
)