import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Layout() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col pb-safe">
      <nav className="sticky top-0 z-10 bg-slate-800/95 border-b border-slate-700 safe-area top-safe">
        <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">
          <div className="flex gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'}`
              }
            >
              Hoy
            </NavLink>
            <NavLink
              to="/review"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'}`
              }
            >
              Ver rutina
            </NavLink>
            <NavLink
              to="/calendar"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'}`
              }
            >
              Calendario
            </NavLink>
            <NavLink
              to="/manage"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'}`
              }
            >
              Gestionar
            </NavLink>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-slate-400 hover:text-white"
          >
            Salir
          </button>
        </div>
      </nav>
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4">
        <Outlet />
      </main>
    </div>
  )
}
