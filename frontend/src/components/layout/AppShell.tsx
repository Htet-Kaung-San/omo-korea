import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  Home,
  Map,
  User,
  type LucideIcon,
} from 'lucide-react'
import { api } from '@/api'
import { useLanguage } from '@/context/LanguageContext'
import { LanguageSelect } from '@/components/layout/LanguageSelect'
import pnuSeal from '@/assets/pnu-seal.png'
import sanjini from '@/assets/pnu-character.png'

type TabItem = {
  to: string
  labelKey: string
  icon?: LucideIcon
  end?: boolean
  featured?: boolean
}

const tabs: TabItem[] = [
  { to: '/', labelKey: 'nav.home', icon: Home, end: true },
  { to: '/schedule', labelKey: 'nav.schedule', icon: CalendarDays },
  { to: '/ai', labelKey: 'nav.aiAssistant', featured: true },
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
      return (
        location.pathname === '/schedule' ||
        (location.pathname.startsWith('/academic') &&
          !location.pathname.startsWith('/academic/scholarships'))
      )
    }
    if (to === '/map') {
      return location.pathname === '/map' || location.pathname.startsWith('/campus-life/map')
    }
    if (to === '/profile') {
      return location.pathname === '/profile' || location.pathname === '/my'
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  const isAi = location.pathname === '/ai' || location.pathname.startsWith('/ai/')
  const isCourses =
    location.pathname === '/courses' || location.pathname.startsWith('/courses/')
  const isCredits =
    location.pathname === '/credits' || location.pathname.startsWith('/credits/')
  const isScholarships =
    location.pathname === '/academic/scholarships' ||
    location.pathname.startsWith('/academic/scholarships/')
  const isNotifications =
    location.pathname === '/notifications' ||
    location.pathname.startsWith('/notifications/')
  const hideShellHeader =
    isAi || isCourses || isCredits || isScholarships || isNotifications

  return (
    <div className="relative mx-auto flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-hidden bg-white shadow-xl">
      {!hideShellHeader ? (
        <header className="relative z-10 flex shrink-0 items-center justify-between gap-2 border-b border-black/5 bg-white/90 px-4 py-2.5 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src={pnuSeal}
              alt="Pusan National University"
              className="h-8 w-8 shrink-0 rounded-full object-contain ring-1 ring-black/5"
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
      ) : null}

      <main
        className={[
          'relative z-0 min-h-0 flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom))]',
          isAi
            ? 'overflow-hidden bg-white'
            : 'no-scrollbar overflow-y-auto bg-[#F5F7FB]',
          isCourses || isCredits || isScholarships || isNotifications
            ? 'bg-[#F5F7FB]'
            : '',
        ].join(' ')}
      >
        <Outlet />
      </main>

      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 rounded-t-[18px] border-t border-black/5 bg-white px-1.5 pb-[max(0.3rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-4px_18px_rgba(15,23,42,0.05)]"
      >
        <ul className="grid grid-cols-5 items-end">
          {tabs.map(({ to, labelKey, icon: Icon, end, featured }) => {
            const active = isTabActive(to, end)

            if (featured) {
              return (
                <li key={to} className="relative flex justify-center">
                  <NavLink
                    to={to}
                    className="group flex -translate-y-3 flex-col items-center gap-0.5"
                  >
                    <span
                      className={[
                        'flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_6px_16px_rgba(0,91,172,0.2)] ring-1 ring-black/5 transition',
                        active ? 'scale-[1.02] ring-pnu-blue/25' : 'group-active:scale-95',
                      ].join(' ')}
                    >
                      <img
                        src={sanjini}
                        alt=""
                        className="h-9 w-9 object-contain"
                        draggable={false}
                      />
                    </span>
                    <span
                      className={[
                        'max-w-[4.5rem] truncate text-center text-[9px] font-semibold leading-tight',
                        active ? 'text-pnu-blue' : 'text-pnu-muted',
                      ].join(' ')}
                    >
                      {t(labelKey)}
                    </span>
                  </NavLink>
                </li>
              )
            }

            return (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={[
                    'flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-0.5 text-[9px] font-semibold transition',
                    active ? 'text-pnu-blue' : 'text-pnu-muted',
                  ].join(' ')}
                >
                  {Icon ? (
                    <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 1.75} />
                  ) : null}
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
