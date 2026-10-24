export interface FormSectionProps {
  title: string
  children: React.ReactNode
}

export default function FormSection({ title, children }: FormSectionProps): React.JSX.Element {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="border-b border-outline-variant pb-2 text-title-medium text-on-surface">
        {title}
      </h2>
      {children}
    </section>
  )
}
