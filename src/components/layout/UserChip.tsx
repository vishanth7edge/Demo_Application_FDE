import { Link } from 'react-router'

import { useAuth } from '../../context/useAuth.ts'
import { ChevronRightIcon } from '../icons/UiIcons.tsx'

export interface UserChipProps {
  onNavigate: () => void
}

export function UserChip({ onNavigate }: UserChipProps): React.JSX.Element | null {
  const { user } = useAuth()
  if (user === null) {
    return null
  }
  const fullName = `${user.firstName} ${user.lastName}`.trim()
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()

  return (
    <Link
      to="/settings"
      onClick={onNavigate}
      className="mr-2.5 flex items-center gap-3 rounded-r-lg py-2 pr-5 pl-7 hover:bg-sidebar-active/60 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-label-medium font-semibold text-brand-foreground"
      >
        {initials}
      </span>
      <span className="min-w-0 flex-1 truncate text-title-medium font-semibold">{fullName}</span>
      <ChevronRightIcon className="size-3.5 shrink-0" />
    </Link>
  )
}
