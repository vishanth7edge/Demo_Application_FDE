export interface LoadingRegionProps {
  // Read by screen readers, e.g. "Loading products…".
  label: string
  // The skeleton layout.
  children: React.ReactNode
  className?: string | undefined
}

// Wraps skeleton placeholders: one polite "Loading…" announcement instead of many empty blocks.
export function LoadingRegion({
  label,
  children,
  className = '',
}: LoadingRegionProps): React.JSX.Element {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
