import { NavLink } from 'react-router-dom'

import { Home, Calendar, QrCode, User, Users, FileText, MapPin, Settings, ScanLine, LayoutDashboard, ClipboardList, Group, UserPlus } from 'lucide-react'

import { useAuthStore } from '../store/authStore'



const navConfig = {

  SCOUT: [

    { to: '/scout/home', icon: Home, label: 'หน้าแรก' },

    { to: '/scout/activities', icon: Calendar, label: 'กิจกรรม' },

    { to: '/scout/qr', icon: QrCode, label: 'QR ฉัน' },

    { to: '/scout/profile', icon: User, label: 'โปรไฟล์' },

  ],

  TROOP_LEADER: [

    { to: '/leader/home', icon: Users, label: 'หมู่' },

    { to: '/leader/report', icon: FileText, label: 'รายงาน' },

    { to: '/leader/profile', icon: User, label: 'โปรไฟล์' },

  ],

  SQUAD_LEADER: [

    { to: '/squad-leader/home', icon: Users, label: 'หมู่ของฉัน' },

    { to: '/squad-leader/activities', icon: Calendar, label: 'ตารางกิจกรรม' },

    { to: '/squad-leader/report', icon: FileText, label: 'รายงาน' },

  ],

  STAFF: [

    { to: '/staff/scan', icon: ScanLine, label: 'สแกน' },

    { to: '/staff/scanned', icon: ClipboardList, label: 'รายชื่อ' },

  ],

  CAMP_MANAGER: [

    { to: '/camp/dashboard', icon: Home, label: 'ภาพรวม' },

    { to: '/camp/structure', icon: Users, label: 'โครงสร้าง' },

    { to: '/camp/activity-groups', icon: Group, label: 'จัดกลุ่ม' },

    { to: '/camp/schedule', icon: Calendar, label: 'ตาราง' },

    { to: '/camp/report', icon: FileText, label: 'รายงาน' },

  ],

  ADMIN: [

    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'ภาพรวม' },

    { to: '/admin/activities', icon: MapPin, label: 'กิจกรรม' },

    { to: '/admin/accounts', icon: Users, label: 'บัญชี' },

    { to: '/admin/add-users', icon: UserPlus, label: 'เพิ่มผู้กำกับ/ลูกเสือ' },

    { to: '/admin/audit', icon: FileText, label: 'Audit' },

  ]

}



export default function BottomNav() {

  const { user } = useAuthStore()

  const items = navConfig[user?.role] || []



  return (

    <nav className="bottom-nav shadow-lg md:hidden">

      {items.map(({ to, icon: Icon, label }) => (

        <NavLink key={to} to={to} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>

          <Icon size={22} />

          <span>{label}</span>

        </NavLink>

      ))}

    </nav>

  )

}

