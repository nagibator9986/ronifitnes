import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth'
import Layout from './components/Layout'
import { Spinner } from './components/common'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Questionnaire from './pages/Questionnaire'

import ClientDashboard from './pages/client/Dashboard'
import ClientPlan from './pages/client/Plan'
import ClientCalendar from './pages/client/Calendar'
import ClientProgress from './pages/client/Progress'
import ClientAchievements from './pages/client/Achievements'
import ClientChat from './pages/client/Chat'
import ClientProfile from './pages/client/Profile'
import WorkoutPlayer from './pages/client/WorkoutPlayer'

import TrainerOverview from './pages/trainer/Overview'
import TrainerClients from './pages/trainer/Clients'
import TrainerClientDetail from './pages/trainer/ClientDetail'
import TrainerLibrary from './pages/trainer/Library'
import TrainerTemplates from './pages/trainer/Templates'
import TrainerSchedule from './pages/trainer/Schedule'
import TrainerFinance from './pages/trainer/Finance'

import AdminUsers from './pages/admin/Users'
import AdminGallery from './pages/admin/Gallery'
import AdminTrainers from './pages/admin/Trainers'
import AdminActivity from './pages/admin/Activity'

function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="container"><Spinner /></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={defaultPath(user)} replace />
  return children
}

function defaultPath(u) {
  if (!u) return '/'
  if (u.role === 'admin') return '/admin'
  if (u.role === 'trainer') return '/trainer'
  if (u.needs_questionnaire) return '/onboarding'
  return '/app'
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <div className="container"><Spinner /></div>

  return (
    <Routes>
      <Route path="/" element={<Layout><Landing /></Layout>} />
      <Route path="/login" element={user ? <Navigate to={defaultPath(user)} replace /> : <Login />} />

      <Route path="/onboarding" element={
        <RequireAuth roles={['client']}>
          <Layout><Questionnaire /></Layout>
        </RequireAuth>
      } />

      <Route path="/app" element={<RequireAuth roles={['client','trainer','admin']}><Layout><ClientDashboard /></Layout></RequireAuth>} />
      <Route path="/app/plan" element={<RequireAuth roles={['client']}><Layout><ClientPlan /></Layout></RequireAuth>} />
      <Route path="/app/calendar" element={<RequireAuth roles={['client']}><Layout><ClientCalendar /></Layout></RequireAuth>} />
      <Route path="/app/progress" element={<RequireAuth roles={['client']}><Layout><ClientProgress /></Layout></RequireAuth>} />
      <Route path="/app/achievements" element={<RequireAuth roles={['client']}><Layout><ClientAchievements /></Layout></RequireAuth>} />
      <Route path="/app/chat" element={<RequireAuth roles={['client','trainer','admin']}><Layout><ClientChat /></Layout></RequireAuth>} />
      <Route path="/app/profile" element={<RequireAuth><Layout><ClientProfile /></Layout></RequireAuth>} />
      <Route path="/app/player/:dayId" element={<RequireAuth roles={['client']}><WorkoutPlayer /></RequireAuth>} />

      <Route path="/trainer" element={<RequireAuth roles={['trainer','admin']}><Layout><TrainerOverview /></Layout></RequireAuth>} />
      <Route path="/trainer/clients" element={<RequireAuth roles={['trainer','admin']}><Layout><TrainerClients /></Layout></RequireAuth>} />
      <Route path="/trainer/clients/:id" element={<RequireAuth roles={['trainer','admin']}><Layout><TrainerClientDetail /></Layout></RequireAuth>} />
      <Route path="/trainer/library" element={<RequireAuth roles={['trainer','admin']}><Layout><TrainerLibrary /></Layout></RequireAuth>} />
      <Route path="/trainer/templates" element={<RequireAuth roles={['trainer','admin']}><Layout><TrainerTemplates /></Layout></RequireAuth>} />
      <Route path="/trainer/schedule" element={<RequireAuth roles={['trainer','admin']}><Layout><TrainerSchedule /></Layout></RequireAuth>} />
      <Route path="/trainer/finance" element={<RequireAuth roles={['trainer','admin']}><Layout><TrainerFinance /></Layout></RequireAuth>} />

      <Route path="/admin" element={<RequireAuth roles={['admin']}><Layout><AdminUsers /></Layout></RequireAuth>} />
      <Route path="/admin/trainers" element={<RequireAuth roles={['admin']}><Layout><AdminTrainers /></Layout></RequireAuth>} />
      <Route path="/admin/activity" element={<RequireAuth roles={['admin']}><Layout><AdminActivity /></Layout></RequireAuth>} />
      <Route path="/admin/gallery" element={<RequireAuth roles={['admin']}><Layout><AdminGallery /></Layout></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
