import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const navItems = [
  { to: '/', label: 'Hoy' },
  { to: '/review', label: 'Ver rutina' },
  { to: '/calendar', label: 'Calendario' },
  { to: '/stats', label: 'Estadísticas' }
] as const

const moreItems = [
  { to: '/manage', label: 'Gestionar' }
] as const

function NavLinkMobile({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center flex-1 min-w-0 py-2 text-xs font-medium transition-colors touch-manipulation ${isActive ? 'text-sky-400' : 'text-slate-400 active:text-slate-200'}`
      }
    >
      {label}
    </NavLink>
  )
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showMore, setShowMore] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const isMoreActive = moreItems.some(({ to }) => location.pathname === to || location.pathname.startsWith(to + '/'))

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* Top bar: only on desktop, or minimal on mobile */}
      <header
        className="sticky top-0 z-20 bg-slate-800/95 border-b border-slate-700 shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between h-12 md:h-14 px-4 max-w-2xl mx-auto gap-2">
          {/* Desktop: barra única, sin título duplicado; enlaces en una línea */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `shrink-0 px-3 py-2 rounded-lg text-sm font-medium h-9 flex items-center whitespace-nowrap ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'}`
                }
              >
                {label}
              </NavLink>
            ))}
            {moreItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `shrink-0 px-3 py-2 rounded-lg text-sm font-medium h-9 flex items-center whitespace-nowrap ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden md:flex items-center shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 rounded-lg text-sm font-medium h-9 text-slate-400 hover:text-white whitespace-nowrap"
            >
              Salir
            </button>
          </div>
          <div className="md:hidden w-8" />
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4 main-content-safe">
        <Outlet />
      </main>

      {/* Mobile bottom nav: barra fija debajo del contenido, bien diferenciada */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch bg-slate-800 border-t-2 border-slate-600 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.5)]"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          minHeight: 'calc(56px + env(safe-area-inset-bottom))'
        }}
      >
        {navItems.map(({ to, label }) => (
          <NavLinkMobile key={to} to={to} label={label} />
        ))}
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center py-2">
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className={`text-xs font-medium touch-manipulation py-1 px-2 rounded-lg min-h-[44px] flex items-center justify-center ${isMoreActive ? 'text-sky-400' : 'text-slate-400 active:text-slate-200'}`}
            aria-expanded={showMore}
            aria-haspopup="dialog"
          >
            Más
          </button>
        </div>
      </nav>

      {/* Mobile "Más" overlay */}
      {showMore && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setShowMore(false)}
            aria-hidden
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden rounded-t-2xl bg-slate-800 border-t border-slate-700 shadow-2xl"
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)'
            }}
          >
            <div className="pt-3 pb-2 px-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Más opciones</p>
            </div>
            <ul className="px-2 pb-4">
              {moreItems.map(({ to, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={() => setShowMore(false)}
                    className={({ isActive }) =>
                      `flex items-center w-full px-4 py-3.5 rounded-xl text-left text-base font-medium min-h-[48px] active:bg-slate-700/80 ${isActive ? 'bg-slate-700/50 text-sky-400' : 'text-white'}`
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
              <li className="border-t border-slate-700 mt-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMore(false)
                    handleLogout()
                  }}
                  className="flex items-center w-full px-4 py-3.5 rounded-xl text-left text-base font-medium min-h-[48px] text-slate-400 active:bg-slate-700/80 active:text-white"
                >
                  Salir
                </button>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
