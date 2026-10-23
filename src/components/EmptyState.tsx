export interface EmptyStateProps {
  title: string
  description?: string | undefined
  // Artwork above the title, e.g. an exported Figma illustration.
  illustration?: React.ReactNode
  // Usually a <Button>.
  action?: React.ReactNode
}

// Layout follows the Figma "Product Empty Scenario" frame: artwork, headline, copy, wide button.
export function EmptyState({
  title,
  description,
  illustration,
  action,
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-12 text-center">
      {illustration !== undefined && <div className="mb-12 w-full max-w-97">{illustration}</div>}
      <h2 className="font-poppins text-headline-small font-semibold md:text-headline-medium">
        {title}
      </h2>
      {description !== undefined && (
        <p className="mt-6 text-body-large text-on-surface-muted">{description}</p>
      )}
      {action !== undefined && <div className="mt-14 w-full max-w-115">{action}</div>}
    </div>
  )
}
