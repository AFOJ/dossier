import { NavLink } from 'react-router-dom'
import {
  File01Icon,
  FileAddIcon,
  FileUploadIcon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon, type HugeiconsIconProps } from '@hugeicons/react'
import { Divider } from '../components/ui'
import useProtectedRouteData from '../hooks/useProtectedRouteData'
import { cn } from '../utils'

type NavItem = {
  to: string
  label: string
  icon: HugeiconsIconProps['icon']
  end?: boolean
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Resumes',
    items: [
      { to: '/resumes', label: 'Resumes', icon: File01Icon, end: true },
      { to: '/resumes/create', label: 'Create', icon: FileAddIcon },
      { to: '/resumes/upload', label: 'Upload', icon: FileUploadIcon },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/profile', label: 'Profile', icon: UserIcon }],
  },
]

function getInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

type SidebarProps = {
  onNavigate?: () => void
  className?: string
}

export function Sidebar(props: Readonly<SidebarProps>) {
  const { onNavigate, className } = props
  const { profile } = useProtectedRouteData()

  return (
    <aside className={cn('flex h-full flex-col bg-white', className)}>
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-6">
        <img src="/favicon.svg" alt="" className="size-8" />
        <span className="font-heading text-lg font-bold text-gray-900">
          Dossier
        </span>
      </div>

      <nav
        aria-label="Main"
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-3"
      >
        {NAV_SECTIONS.map((section, index) => (
          <div key={section.label} className="space-y-1">
            <p className="px-3 pb-1 text-xs font-medium text-gray-500">
              {section.label}
            </p>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )
                }
              >
                <HugeiconsIcon
                  icon={item.icon}
                  size={18}
                  strokeWidth={2}
                  className="shrink-0"
                />
                {item.label}
              </NavLink>
            ))}
            {index < NAV_SECTIONS.length - 1 && <Divider />}
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-200">
        <div className="flex items-center gap-3 px-5 py-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white"
          >
            {getInitials(profile.full_name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {profile.full_name}
            </p>
            {profile.role && (
              <p className="truncate text-xs text-gray-500">{profile.role}</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}