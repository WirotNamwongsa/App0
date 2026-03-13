import { NavLink } from 'react-router-dom'
import { Home, Calendar, QrCode, User, Users, FileText, MapPin, ScanLine, LayoutDashboard, ClipboardList, LogOut, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import ThemeToggle from './ThemeToggle'

const navConfig = {
  SCOUT: [
    { to: '/scout/home', icon: Home, label: 'หน้าแรก' },
    { to: '/scout/schedule', icon: Calendar, label: 'ตารางกิจกรรม' },
    { to: '/scout/activities', icon: Calendar, label: 'กิจกรรม' },
    { to: '/scout/qr', icon: QrCode, label: 'QR ฉัน' },
    { to: '/scout/profile', icon: User, label: 'โปรไฟล์' },
  ],
  TROOP_LEADER: [
    { to: '/leader/home', icon: Users, label: 'หมู่ของฉัน' },
    { to: '/leader/schedule', icon: Calendar, label: 'ตารางกิจกรรม' },
    { to: '/leader/report', icon: FileText, label: 'รายงาน' },
  ],
  STAFF: [
    { to: '/staff/scan', icon: ScanLine, label: 'สแกน QR' },
    { to: '/staff/schedule', icon: Calendar, label: 'ตาราง' },
    { to: '/staff/scanned', icon: ClipboardList, label: 'รายชื่อ' },
  ],
  CAMP_MANAGER: [
    { to: '/camp/dashboard', icon: Home, label: 'ภาพรวม' },
    { to: '/camp/structure', icon: Users, label: 'โครงสร้าง' },
    { to: '/camp/schedule', icon: Calendar, label: 'ตาราง' },
    { to: '/camp/report', icon: FileText, label: 'รายงาน' },
  ],
  ADMIN: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'ภาพรวม' },
    { to: '/admin/activities', icon: MapPin, label: 'กิจกรรม' },
    { to: '/admin/accounts', icon: Users, label: 'บัญชี' },
    { to: '/admin/camps', icon: FileText, label: 'ค่าย' },
    { to: '/admin/audit', icon: ClipboardList, label: 'Audit' },
  ],
}

const roleLabel = {
  ADMIN: 'ผู้ดูแลระบบ',
  CAMP_MANAGER: 'ผู้ดูแลค่าย',
  TROOP_LEADER: 'ผู้กำกับหมู่',
  STAFF: 'ผู้จัดกิจกรรม',
  SCOUT: 'ลูกเสือ',
}

function Sidebar({ items, user, logout }) {
  return (
    <aside
      className="hidden md:flex w-64 bg-white dark:bg-scout-950 border-r border-gray-200 dark:border-scout-800 fixed left-0 top-0 bottom-0 z-40"
      style={{ flexDirection: 'column', height: '100vh' }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-scout-800" style={{ flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-scout-100 dark:bg-scout-800 flex items-center justify-center text-xl">⚜️</div>
          <div>
            <p className="font-bold text-scout-900 dark:text-white text-sm">ชุมนุมลูกเสือ</p>
            <p className="text-xs text-gray-400">อาชีวศึกษา</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-gray-100 dark:bg-scout-900 border border-gray-200 dark:border-scout-800" style={{ flexShrink: 0 }}>
        <p className="text-sm font-semibold text-scout-900 dark:text-white truncate">{user?.name}</p>
        <p className="text-xs text-gray-400">{roleLabel[user?.role]}</p>
      </div>

      {/* Nav — กินพื้นที่ที่เหลือ + scroll ได้ */}
      <nav style={{ flex: '1 1 0px', overflowY: 'auto', padding: '16px 12px', minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive ? 'bg-scout-700 text-white' : 'text-gray-600 dark:text-scout-400 hover:bg-gray-100 dark:hover:bg-scout-800'}`
              }>
              {({ isActive }) => (
                <>
                  <Icon size={18} />
                  <span>{label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom — ติดล่างเสมอ */}
      <div
        className="border-t border-gray-200 dark:border-scout-800"
        style={{ flexShrink: 0, padding: '12px' }}
      >
        <div className="flex items-center justify-between px-3 py-2 mb-1">
          <span className="text-sm text-gray-500 dark:text-scout-400">โหมดสี</span>
          <ThemeToggle />
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}

function BottomNavMobile({ items, logout }) {
  return (
    <nav className="md:hidden bottom-nav shadow-lg">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <Icon size={18} />
          <span className="truncate w-full text-center">{label}</span>
        </NavLink>
      ))}
      <button onClick={logout} className="bottom-nav-item text-red-400 dark:text-red-400">
        <div className="w-7 h-7 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
          <LogOut size={15} className="text-red-500" />
        </div>
        <span style={{fontSize:10}}>ออก</span>
      </button>
    </nav>
  )
}

export default function Layout({ children }) {
  const { user, logout } = useAuthStore()
  const items = navConfig[user?.role] || []

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-scout-950">
      <Sidebar items={items} user={user} logout={logout} />
      <main className="md:ml-64 min-h-screen">
        <div className="max-w-2xl mx-auto px-0 md:px-6 md:py-6">
          {children}
        </div>
      </main>
      <BottomNavMobile items={items} logout={logout} />
    </div>
  )
}