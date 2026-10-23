export interface IconProps {
  className?: string | undefined
}

export interface IconBaseProps extends IconProps {
  children: React.ReactNode
  // Icons traced from Figma keep the frame's own coordinates.
  viewBox?: string | undefined
  strokeWidth?: number | undefined
}

// Outline icon drawn in the current text color. Decorative: label the control, not the icon.
export function IconBase({
  className = 'size-6',
  children,
  viewBox = '0 0 24 24',
  strokeWidth = 1.5,
}: IconBaseProps): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  )
}
