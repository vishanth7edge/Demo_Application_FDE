export interface DetailItemProps {
  label: string
  value: string
}

export default function DetailItem({ label, value }: DetailItemProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-label-small text-on-surface-variant">{label}</dt>
      <dd className="text-body-medium text-on-surface">{value === '' ? 'n/a' : value}</dd>
    </div>
  )
}
