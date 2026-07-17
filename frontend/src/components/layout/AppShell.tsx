import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Bot,
  CalendarDays,
  Home,
  Map,
  User,
} from 'lucide-react'
import { api } from '@/api'
import { useLanguage } from '@/context/LanguageContext'
import { LanguageSelect } from '@/components/layout/LanguageSelect'
import pnuSeal from '@/assets/pnu-seal.png'

const tabs = [
  { to: '/', labelKey: 'nav.home', icon: Home, end: true },
  { to: '/schedule', labelKey: 'nav.schedule', icon: CalendarDays },
  { to: '/ai', labelKey: 'nav.aiAssistant', icon: Bot },
  { to: '/map', labelKey: 'nav.campusMap', icon: Map },
  { to: '/profile', labelKey: 'nav.profile', icon: User },
]

export function AppShell() {
  const { language, t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [highPriorityCount, setHighPriorityCount] = useState(0)

  useEffect(() => {
    api
      .getNotifications()
      .then((items) => {
        setHighPriorityCount(items.filter((n) => n.priority === 'HIGH').length)
      })
      .catch(() => setHighPriorityCount(0))
  }, [language, location.pathname])

  function isTabActive(to: string, end?: boolean) {
    if (end) return location.pathname === '/'
    if (to === '/schedule') {
      return location.pathname === '/schedule' || location.pathname.startsWith('/academic')
    }
    if (to === '/map') {
      return location.pathname === '/map' || location.pathname.startsWith('/campus-life/map')
    }
    if (to === '/profile') {
      return location.pathname === '/profile' || location.pathname === '/my'
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  return (
    <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-xl">
      <header className="relative z-10 flex items-center justify-between gap-2 border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-2.5">
          <img
            src={pnuSeal}
            alt="Pusan National University"
            className="h-9 w-9 shrink-0 rounded-full object-contain ring-1 ring-black/5"
          />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-tight text-pnu-blue">
              Hey! PNU
            </p>
            <p className="mt-0.5 truncate text-[10px] font-medium text-pnu-muted">
              Pusan National University
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="[&_label]:min-w-0 [&_label]:max-w-[7.5rem] [&_label]:rounded-full [&_label]:border-black/8 [&_label]:bg-[#F2F2F7]">
            <LanguageSelect />
          </div>
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            aria-label={t('home.bellAria')}
            className="relative shrink-0 rounded-full bg-[#F2F2F7] p-2.5 text-pnu-muted transition hover:text-pnu-blue"
          >
            <Bell className="h-4 w-4" />
            {highPriorityCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF3B30] px-1 text-[10px] font-bold leading-none text-white">
                {highPriorityCount > 9 ? '9+' : highPriorityCount}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      <main className="relative z-0 flex-1 overflow-y-auto bg-[#F2F2F7] pb-24">
        <Outlet />
      </main>

      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-black/5 bg-white/92 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl"
      >
        <ul className="grid grid-cols-5 gap-0.5">
          {tabs.map(({ to, labelKey, icon: Icon, end }) => {
            const active = isTabActive(to, end)
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={[
                    'flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-semibold transition',
                    active ? 'text-pnu-blue' : 'text-pnu-muted',
                  ].join(' ')}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 1.75} />
                  <span className="truncate">{t(labelKey)}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
