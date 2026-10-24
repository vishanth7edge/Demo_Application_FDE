interface IconProps {
  path: string
  size?: number
}

function Icon({ path, size = 24 }: IconProps): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}

export interface SizedIconProps {
  size?: number
}

export function MenuIcon(): React.JSX.Element {
  return <Icon path="M4 6h16M4 12h16M4 18h16" />
}

export function DashboardIcon(): React.JSX.Element {
  return <Icon path="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
}

export function ProductsIcon(): React.JSX.Element {
  return <Icon path="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9" />
}

export function SearchIcon(): React.JSX.Element {
  return <Icon path="M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5" />
}

export function KebabIcon(): React.JSX.Element {
  return <Icon path="M12 5h.01M12 12h.01M12 19h.01" />
}

export function CloseIcon(): React.JSX.Element {
  return <Icon path="M6 6l12 12M18 6L6 18" />
}

export function PlusIcon({ size }: SizedIconProps): React.JSX.Element {
  return <Icon path="M12 5v14M5 12h14" {...(size === undefined ? {} : { size })} />
}

export function WarningIcon(): React.JSX.Element {
  return <Icon size={36} path="M12 21a9 9 0 100-18 9 9 0 000 18zM12 8v5M12 16h.01" />
}

export function SuccessIcon(): React.JSX.Element {
  return <Icon size={36} path="M12 21a9 9 0 100-18 9 9 0 000 18zM8 12l3 3 5-6" />
}

export function ChevronLeftIcon(): React.JSX.Element {
  return <Icon path="M15 6l-6 6 6 6" />
}

export function ChevronRightIcon(): React.JSX.Element {
  return <Icon path="M9 6l6 6-6 6" />
}

export function ChevronDownIcon(): React.JSX.Element {
  return <Icon path="M6 9l6 6 6-6" />
}

export function TrashIcon(): React.JSX.Element {
  return <Icon path="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
}

export function UploadIcon(): React.JSX.Element {
  return <Icon path="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" />
}

export function ImageIcon({ size }: SizedIconProps): React.JSX.Element {
  return (
    <Icon
      path="M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9h.01"
      {...(size === undefined ? {} : { size })}
    />
  )
}

export function FileIcon(): React.JSX.Element {
  return <Icon path="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5" />
}
