// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import SplashPage from './pages/SplashPage';

// Scout
import ScoutHome from './pages/scout/ScoutHome';
import ScoutActivities from './pages/scout/ScoutActivities';
import ScoutQR from './pages/scout/ScoutQR';
import ScoutProfile from './pages/scout/ScoutProfile';

// Leader
import LeaderHome from './pages/leader/LeaderHome';
import LeaderScout from './pages/leader/LeaderScout';

// Camp
import CampDashboard from './pages/camp/CampDashboard';
import CampStructure from './pages/camp/CampStructure';
import CampPatrol from './pages/camp/CampPatrol';
import CampSquad from './pages/camp/Squad';
import CampSchedule from './pages/camp/CampSchedule';
import CampReport from './pages/camp/CampReport';

// Staff
import StaffScan from './pages/staff/Scan';
import StaffScanned from './pages/staff/Scanned';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminActivities from './pages/admin/AdminActivities';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminAudit from './pages/admin/AdminAudit';
import AdminReport from './pages/admin/AdminReport';

const ROLE_HOME = {
  ADMIN: '/admin/dashboard',
  CAMP_MANAGER: '/camp/dashboard',
  TROOP_LEADER: '/leader/home',
  STAFF: '/staff/scan',
  SCOUT: '/scout/home',
};

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <SplashPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return <SplashPage />;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={ROLE_HOME[user.role]} replace /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={user ? <Navigate to={ROLE_HOME[user.role]} replace /> : <LoginPage />} />

      {/* Scout */}
      <Route path="/scout/home" element={<ProtectedRoute roles={['SCOUT']}><ScoutHome /></ProtectedRoute>} />
      <Route path="/scout/activities" element={<ProtectedRoute roles={['SCOUT']}><ScoutActivities /></ProtectedRoute>} />
      <Route path="/scout/qr" element={<ProtectedRoute roles={['SCOUT']}><ScoutQR /></ProtectedRoute>} />
      <Route path="/scout/profile" element={<ProtectedRoute roles={['SCOUT']}><ScoutProfile /></ProtectedRoute>} />

      {/* Leader */}
      <Route path="/leader/home" element={<ProtectedRoute roles={['TROOP_LEADER']}><LeaderHome /></ProtectedRoute>} />
      <Route path="/leader/scout/:id" element={<ProtectedRoute roles={['TROOP_LEADER']}><LeaderScout /></ProtectedRoute>} />

      {/* Camp */}
      <Route path="/camp/dashboard" element={<ProtectedRoute roles={['CAMP_MANAGER', 'ADMIN']}><CampDashboard /></ProtectedRoute>} />
      <Route path="/camp/structure" element={<ProtectedRoute roles={['CAMP_MANAGER', 'ADMIN']}><CampStructure /></ProtectedRoute>} />
      <Route path="/camp/patrol/:id" element={<ProtectedRoute roles={['CAMP_MANAGER', 'ADMIN']}><CampPatrol /></ProtectedRoute>} />
      <Route path="/camp/squad/:id" element={<ProtectedRoute roles={['CAMP_MANAGER', 'ADMIN']}><CampSquad /></ProtectedRoute>} />
      <Route path="/camp/schedule" element={<ProtectedRoute roles={['CAMP_MANAGER', 'ADMIN']}><CampSchedule /></ProtectedRoute>} />
      <Route path="/camp/report" element={<ProtectedRoute roles={['CAMP_MANAGER', 'ADMIN']}><CampReport /></ProtectedRoute>} />

      {/* Staff */}
      <Route path="/staff/scan" element={<ProtectedRoute roles={['STAFF', 'ADMIN']}><StaffScan /></ProtectedRoute>} />
      <Route path="/staff/scanned" element={<RequireAuth roles={['STAFF', 'ADMIN']}><StaffScanned /></RequireAuth>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/activities" element={<ProtectedRoute roles={['ADMIN']}><AdminActivities /></ProtectedRoute>} />
      <Route path="/admin/accounts" element={<ProtectedRoute roles={['ADMIN']}><AdminAccounts /></ProtectedRoute>} />
      <Route path="/admin/audit" element={<ProtectedRoute roles={['ADMIN']}><AdminAudit /></ProtectedRoute>} />
      <Route path="/admin/report" element={<ProtectedRoute roles={['ADMIN']}><AdminReport /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)' },
            duration: 3000,
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
