export interface CheckboxFieldProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export default function CheckboxField({
  label,
  checked,
  onChange,
}: CheckboxFieldProps): React.JSX.Element {
  return (
    <label className="flex items-center gap-3 text-body-medium text-on-surface-variant">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked)
        }}
        className="size-5 accent-primary"
      />
    </label>
  )
}
