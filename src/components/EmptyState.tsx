export interface EmptyStateProps {
  title: string
  description?: string | undefined
  action?: React.ReactNode
  image?: string | undefined
  imageAlt?: string | undefined
}

export default function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps): React.JSX.Element {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
      <img src='/assignment-request.svg' alt='Assignment Request' className='mx-auto mt-10 w-1/2'/>
      <h2 className="text-headline-small text-on-surface">{title}</h2>
      {description !== undefined && (
        <p className="text-body-large text-on-surface-variant">{description}</p>
      )}
      {action}
    </section>  
  )
}
