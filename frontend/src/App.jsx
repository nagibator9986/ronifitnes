import { Navigate, Route, Routes } from 'react-router-dom'

import { RequireAdmin } from './auth'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'
import Landing from './pages/Landing'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <Admin />
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
