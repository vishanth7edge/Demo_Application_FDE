export interface AuthFormHeadingProps {
  eyebrow: string
  title: string
  description: string
}

// Eyebrow, title and intro shown above the login and signup forms.
export function AuthFormHeading({
  eyebrow,
  title,
  description,
}: AuthFormHeadingProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label-small text-brand uppercase">{eyebrow}</p>
      <h1 className="text-headline-small font-medium">{title}</h1>
      <p className="text-body-medium text-on-surface-muted">{description}</p>
    </div>
  )
}
