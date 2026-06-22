import { NavLink, Outlet } from 'react-router-dom'
import { BookOpen, CheckSquare, Home, MessageSquare, User } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/checklist', label: 'Checklist', icon: CheckSquare },
  { to: '/profile', label: 'Profile', icon: User },
]

export function AppShell() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-pnu-surface shadow-xl">
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-pnu-border bg-white/95 backdrop-blur"
      >
        <ul className="grid grid-cols-5">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    'flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition',
                    isActive ? 'text-pnu-blue-light' : 'text-pnu-muted hover:text-pnu-text',
                  ].join(' ')
                }
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
