import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Habitos } from './pages/Habitos'
import { Humor } from './pages/Humor'
import { ModulePlaceholder } from './pages/ModulePlaceholder'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/habitos"
        element={
          <ProtectedRoute>
            <Habitos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/humor"
        element={
          <ProtectedRoute>
            <Humor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/financeiro"
        element={
          <ProtectedRoute>
            <ModulePlaceholder title="Financeiro" accent="financeiro" />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
