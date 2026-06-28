import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Dumbbell, UtensilsCrossed, Camera, MessageCircle, Home } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/meals', icon: UtensilsCrossed, label: '饮食' },
  { to: '/workout', icon: Dumbbell, label: '训练' },
  { to: '/pose', icon: Camera, label: '动作' },
  { to: '/chat', icon: MessageCircle, label: 'AI教练' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* 顶部 */}
      <header className="sticky top-0 z-50 bg-dark-950/90 backdrop-blur-md border-b border-dark-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-dark-950" />
            </div>
            <span className="text-lg font-bold text-white">FitAI</span>
            <span className="text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">AI</span>
          </div>
          <div className="text-sm text-dark-400">智能健身助手</div>
        </div>
      </header>

      {/* 内容 */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-24">
        <Outlet />
      </main>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-dark-900/95 backdrop-blur-md border-t border-dark-800 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[64px] ${
                  isActive
                    ? 'text-primary-400'
                    : 'text-dark-500 hover:text-dark-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
