import { IconBase } from './IconBase.tsx'

import type { IconProps } from './IconBase.tsx'

export type UiIconProps = IconProps

// Bell and dot from the Figma frame (the dot is the design's notification marker).
export function BellIcon({ className = 'size-6' }: UiIconProps): React.JSX.Element {
  return (
    <IconBase className={className} viewBox="1381 16 24 27" strokeWidth={2}>
      <path d="M1393.11 21.375C1396.47 21.375 1399.19 24.1732 1399.19 27.625V30.6301C1399.19 31.1106 1399.36 31.575 1399.68 31.9384L1401.91 34.5188C1402.75 35.4904 1402.06 37 1400.77 37H1385.44C1384.16 37 1383.47 35.4904 1384.31 34.5188L1386.54 31.9384C1386.85 31.575 1387.03 31.1106 1387.03 30.6301L1387.03 27.625C1387.03 24.1732 1389.75 21.375 1393.11 21.375ZM1393.11 21.375V18.25M1391.89 40.75H1394.32" />
      <ellipse cx="1397.8" cy="23.875" rx="4.257" ry="4.375" className="fill-brand stroke-none" />
    </IconBase>
  )
}

export function SearchIcon(props: UiIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </IconBase>
  )
}

export function PlusIcon(props: UiIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  )
}

export function ChevronRightIcon({ className = 'size-6' }: UiIconProps): React.JSX.Element {
  return (
    <IconBase className={className} viewBox="241 931 14 12" strokeWidth={0}>
      <path
        fill="currentColor"
        d="M248.6 937L244 932.4L245.4 931L251.4 937L245.4 943L244 941.6L248.6 937Z"
      />
    </IconBase>
  )
}

export function MenuIcon(props: UiIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </IconBase>
  )
}

export function CloseIcon(props: UiIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </IconBase>
  )
}

export function CheckIcon(props: UiIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </IconBase>
  )
}

export function ExternalLinkIcon(props: UiIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </IconBase>
  )
}

export function ImageIcon(props: UiIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 16l-5-5-9 9" />
    </IconBase>
  )
}
