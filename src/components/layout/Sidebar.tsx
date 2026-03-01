import { NavLink } from 'react-router-dom'
import {
  BookOpen,
  Brain,
  Home,
  List,
  Settings,
  BarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: <Home className="h-5 w-5" /> },
  { to: '/study', label: 'Study', icon: <Brain className="h-5 w-5" /> },
  { to: '/grammar', label: 'Grammar', icon: <BookOpen className="h-5 w-5" /> },
  { to: '/quiz', label: 'Quiz', icon: <List className="h-5 w-5" /> },
  { to: '/vocabulary', label: 'Vocabulary', icon: <List className="h-5 w-5" /> },
  { to: '/progress', label: 'Progress', icon: <BarChart2 className="h-5 w-5" /> },
  { to: '/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  return (
    <nav className="flex flex-col gap-1 p-4">
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-11',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )
          }
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
