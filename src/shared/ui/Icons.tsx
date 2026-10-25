// Small inline icon set (24px outline, currentColor). Decorative by default.

import type { ReactNode } from 'react'

export interface IconProps {
  className?: string
}

export function Svg({
  className = 'size-5',
  children,
}: IconProps & { children: ReactNode }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  )
}

export function IconLogo(props: IconProps): React.JSX.Element {
  return (
    <Svg {...props}>
      <path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
      <circle cx="12" cy="14" r="1.6" />
    </Svg>
  )
}

export function IconDashboard(props: IconProps): React.JSX.Element {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="7" height="8" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
      <rect x="3.5" y="14.5" width="7" height="6" rx="1.5" />
    </Svg>
  )
}

export function IconBox(props: IconProps): React.JSX.Element {
  return (
    <Svg {...props}>
      <path d="m21 8-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </Svg>
  )
}

export function IconLogout(props: IconProps): React.JSX.Element {
  return (
    <Svg {...props}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l-5-5 5-5" />
      <path d="M5 12h11" />
    </Svg>
  )
}

export function IconSearch(props: IconProps): React.JSX.Element {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </Svg>
  )
}

export function IconPlus(props: IconProps): React.JSX.Element {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function IconPencil(props: IconProps): React.JSX.Element {
  return (
    <Svg {...props}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </Svg>
  )
}

export function IconTrash(props: IconProps): React.JSX.Element {
  return (
    <Svg {...props}>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </Svg>
  )
}

export function IconEye(props: IconProps): React.JSX.Element {
  return (
    <Svg {...props}>
      <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  )
}

export function IconEyeOff(props: IconProps): React.JSX.Element {
  return (
    <Svg {...props}>
      <path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c6 0 9.5 7 9.5 7a16 16 0 0 1-2.4 3.3M6.6 6.6C3.9 8.4 2.5 12 2.5 12s3.5 7 9.5 7a9.3 9.3 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </Svg>
  )
}

export function IconChevronLeft(props: IconProps): React.JSX.Element {
  return (
    <Svg {...props}>
      <path d="m15 18-6-6 6-6" />
    </Svg>
  )
}

export function IconChevronRight(props: IconProps): React.JSX.Element {
  return (
    <Svg {...props}>
      <path d="m9 18 6-6-6-6" />
    </Svg>
  )
}

export function IconSort({
  direction,
  ...props
}: IconProps & { direction: 'asc' | 'desc' | null }): React.JSX.Element {
  return (
    <Svg {...props}>
      <path d="m8 9 4-4 4 4" className={direction === 'desc' ? 'opacity-30' : ''} />
      <path d="m16 15-4 4-4-4" className={direction === 'asc' ? 'opacity-30' : ''} />
    </Svg>
  )
}

export function IconMenu(props: IconProps): React.JSX.Element {
  return (
    <Svg {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Svg>
  )
}

export function IconX(props: IconProps): React.JSX.Element {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  )
}
