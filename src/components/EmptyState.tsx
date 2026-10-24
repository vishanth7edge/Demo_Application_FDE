export interface EmptyStateProps {
  title: string
  description?: string | undefined
  action?: React.ReactNode
}

export default function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps): React.JSX.Element {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
      <h2 className="text-headline-small text-on-surface">{title}</h2>
      {description !== undefined && (
        <p className="text-body-large text-on-surface-variant">{description}</p>
      )}
      {action}
    </section>
  )
}
