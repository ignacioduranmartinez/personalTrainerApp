import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import type { User } from '@supabase/supabase-js'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import RoutineList from './pages/RoutineList'
import RoutineCreate from './pages/RoutineCreate'
import RoutineImport from './pages/RoutineImport'
import RoutineDetail from './pages/RoutineDetail'
import RoutineReview from './pages/RoutineReview'
import Calendar from './pages/Calendar'
import Manage from './pages/Manage'
import Today from './pages/Today'
import ExerciseFicha from './pages/ExerciseFicha'
import Stats from './pages/Stats'
import ExerciseLibrary from './pages/ExerciseLibrary'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-slate-400">Cargando...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
      <Route path="/" element={user ? <Layout /> : <Navigate to="/login" replace />}>
        <Route index element={<Today />} />
        <Route path="routines" element={<RoutineList />} />
        <Route path="routines/new" element={<RoutineCreate />} />
        <Route path="routines/import" element={<RoutineImport />} />
        <Route path="routines/:id" element={<RoutineDetail />} />
        <Route path="review" element={<RoutineReview />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="stats" element={<Stats />} />
        <Route path="manage" element={<Manage />} />
        <Route path="library" element={<ExerciseLibrary />} />
        <Route path="exercise/:id" element={<ExerciseFicha />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default App
