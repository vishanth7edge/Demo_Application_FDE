import { IconBase } from './IconBase.tsx'

import type { IconProps } from './IconBase.tsx'

export type ProductIconProps = IconProps

// Icons for the product list, product detail page and modals. Drawn to match the Figma frames;
// swap in exported paths when available.

export function FilterIcon(props: ProductIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M6 4v5M6 13v7M12 4v9M12 17v3M18 4v3M18 11v9" />
      <path d="M4 11h4M10 15h4M16 9h4" />
    </IconBase>
  )
}

export function MoreVerticalIcon(props: ProductIconProps): React.JSX.Element {
  return (
    <IconBase {...props} strokeWidth={2.5}>
      <path d="M12 5h.01M12 12h.01M12 19h.01" />
    </IconBase>
  )
}

export function ChevronLeftIcon(props: ProductIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M15 5l-7 7 7 7" />
    </IconBase>
  )
}

export function ChevronNextIcon(props: ProductIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M9 5l7 7-7 7" />
    </IconBase>
  )
}

export function PencilIcon(props: ProductIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
    </IconBase>
  )
}

export function AlertCircleIcon(props: ProductIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </IconBase>
  )
}

export function CheckCircleIcon(props: ProductIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.7 2.7L16.5 9.5" />
    </IconBase>
  )
}

export function RecycleIcon(props: ProductIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M7.5 9.5L10 5.2a2 2 0 0 1 3.5 0l1.3 2.3M16.8 7.5l-2 .1-.9-1.8" />
      <path d="M17.5 11l2.4 4.2a2 2 0 0 1-1.7 3H15.5M15.6 16.1l-.1 2.1 1.6 1.2" />
      <path d="M10 18.2H5.8a2 2 0 0 1-1.7-3l1.4-2.4M3.8 13.8l1.7-1 1.7 1" />
    </IconBase>
  )
}

export function GlassIcon(props: ProductIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M7 3h10l-1 7a4 4 0 0 1-8 0L7 3zM12 14v6M8.5 20h7" />
    </IconBase>
  )
}

export function InboxDownIcon(props: ProductIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M12 4v9M8.5 9.5L12 13l3.5-3.5" />
      <path d="M4 13v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5h-4.5l-1 2h-5l-1-2H4z" />
    </IconBase>
  )
}

export function BoxIcon(props: ProductIconProps): React.JSX.Element {
  return (
    <IconBase {...props} strokeWidth={0}>
      <path fill="currentColor" d="M4 8.5l8-4 8 4-8 4-8-4z" opacity="0.7" />
      <path fill="currentColor" d="M4 9.5l7.5 3.8V21L4 17.2V9.5z" />
      <path fill="currentColor" d="M20 9.5l-7.5 3.8V21l7.5-3.8V9.5z" opacity="0.85" />
      <path fill="white" d="M14.5 13.5l3-1.5v3.5l-3 1.5v-3.5z" opacity="0.9" />
    </IconBase>
  )
}

export function CartIcon(props: ProductIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M3 4h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.2" />
      <circle cx="9.5" cy="19.5" r="1.25" />
      <circle cx="17" cy="19.5" r="1.25" />
    </IconBase>
  )
}

export function MinusIcon(props: ProductIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
    </IconBase>
  )
}

export function TrashIcon(props: ProductIconProps): React.JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </IconBase>
  )
}
