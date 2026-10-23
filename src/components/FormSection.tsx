export interface FormSectionProps {
  title: string
  children: React.ReactNode
  className?: string | undefined
}

// Titled group of fields, as in the Figma product form (title with a rule under it).
export function FormSection({
  title,
  children,
  className = '',
}: FormSectionProps): React.JSX.Element {
  return (
    <fieldset className={`flex flex-col gap-4 ${className}`}>
      <legend className="mb-4 w-full border-b border-outline pb-2 text-title-small font-semibold">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}
