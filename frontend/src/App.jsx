import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'

// Pages
import LoginPage from './pages/LoginPage'
import SplashPage from './pages/SplashPage'

// Scout
import ScoutHome from './pages/scout/Home'
import ScoutActivities from './pages/scout/Activities'
import ScoutQR from './pages/scout/QRCode'
import ScoutProfile from './pages/scout/Profile'
<<<<<<< HEAD
import ScoutSchedule from './pages/scout/Schedule'
=======
>>>>>>> 257707a (first commit)

// Leader
import LeaderHome from './pages/leader/Home'
import LeaderMember from './pages/leader/Member'
import LeaderReport from './pages/leader/Report'
<<<<<<< HEAD
import LeaderSchedule from './pages/leader/Schedule'
=======
>>>>>>> 257707a (first commit)

// Staff
import StaffScan from './pages/staff/Scan'
import StaffScanned from './pages/staff/Scanned'
<<<<<<< HEAD
import StaffSchedule from './pages/staff/Schedule'
=======
>>>>>>> 257707a (first commit)

// Camp
import CampDashboard from './pages/camp/Dashboard'
import CampStructure from './pages/camp/Structure'
import CampSchedule from './pages/camp/Schedule'
import CampReport from './pages/camp/Report'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminActivities from './pages/admin/Activities'
import AdminAccounts from './pages/admin/Accounts'
<<<<<<< HEAD
import AdminCamps from './pages/admin/Camps'
=======
>>>>>>> 257707a (first commit)
import AdminAudit from './pages/admin/Audit'
import AdminImport from './pages/admin/Import'

function RequireAuth({ children, roles }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <Layout>{children}</Layout>
}

function RoleRedirect() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  const map = {
    ADMIN: '/admin/dashboard',
    CAMP_MANAGER: '/camp/dashboard',
    TROOP_LEADER: '/leader/home',
    STAFF: '/staff/scan',
    SCOUT: '/scout/home'
  }
  return <Navigate to={map[user.role] || '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/splash" element={<SplashPage />} />

      {/* Scout */}
      <Route path="/scout/home" element={<RequireAuth roles={['SCOUT']}><ScoutHome /></RequireAuth>} />
<<<<<<< HEAD
      <Route path="/scout/schedule" element={<RequireAuth roles={['SCOUT']}><ScoutSchedule /></RequireAuth>} />
=======
>>>>>>> 257707a (first commit)
      <Route path="/scout/activities" element={<RequireAuth roles={['SCOUT']}><ScoutActivities /></RequireAuth>} />
      <Route path="/scout/qr" element={<RequireAuth roles={['SCOUT']}><ScoutQR /></RequireAuth>} />
      <Route path="/scout/profile" element={<RequireAuth roles={['SCOUT']}><ScoutProfile /></RequireAuth>} />

      {/* Leader */}
      <Route path="/leader/home" element={<RequireAuth roles={['TROOP_LEADER']}><LeaderHome /></RequireAuth>} />
<<<<<<< HEAD
      <Route path="/leader/schedule" element={<RequireAuth roles={['TROOP_LEADER']}><LeaderSchedule /></RequireAuth>} />
=======
>>>>>>> 257707a (first commit)
      <Route path="/leader/member/:id" element={<RequireAuth roles={['TROOP_LEADER']}><LeaderMember /></RequireAuth>} />
      <Route path="/leader/report" element={<RequireAuth roles={['TROOP_LEADER']}><LeaderReport /></RequireAuth>} />

      {/* Staff */}
      <Route path="/staff/scan" element={<RequireAuth roles={['STAFF', 'ADMIN']}><StaffScan /></RequireAuth>} />
<<<<<<< HEAD
      <Route path="/staff/schedule" element={<RequireAuth roles={['STAFF', 'ADMIN']}><StaffSchedule /></RequireAuth>} />
=======
>>>>>>> 257707a (first commit)
      <Route path="/staff/scanned" element={<RequireAuth roles={['STAFF', 'ADMIN']}><StaffScanned /></RequireAuth>} />

      {/* Camp */}
      <Route path="/camp/dashboard" element={<RequireAuth roles={['CAMP_MANAGER', 'ADMIN']}><CampDashboard /></RequireAuth>} />
      <Route path="/camp/structure" element={<RequireAuth roles={['CAMP_MANAGER', 'ADMIN']}><CampStructure /></RequireAuth>} />
      <Route path="/camp/schedule" element={<RequireAuth roles={['CAMP_MANAGER', 'ADMIN']}><CampSchedule /></RequireAuth>} />
      <Route path="/camp/report" element={<RequireAuth roles={['CAMP_MANAGER', 'ADMIN']}><CampReport /></RequireAuth>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<RequireAuth roles={['ADMIN']}><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/activities" element={<RequireAuth roles={['ADMIN']}><AdminActivities /></RequireAuth>} />
      <Route path="/admin/accounts" element={<RequireAuth roles={['ADMIN']}><AdminAccounts /></RequireAuth>} />
<<<<<<< HEAD
      <Route path="/admin/camps" element={<RequireAuth roles={['ADMIN']}><AdminCamps /></RequireAuth>} />
=======
>>>>>>> 257707a (first commit)
      <Route path="/admin/audit" element={<RequireAuth roles={['ADMIN']}><AdminAudit /></RequireAuth>} />
      <Route path="/admin/import" element={<RequireAuth roles={['ADMIN']}><AdminImport /></RequireAuth>} />
    </Routes>
  )
}