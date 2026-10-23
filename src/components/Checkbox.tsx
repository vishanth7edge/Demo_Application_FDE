export interface CheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  name?: string | undefined
  disabled?: boolean | undefined
}

export function Checkbox({
  label,
  checked,
  onChange,
  name,
  disabled,
}: CheckboxProps): React.JSX.Element {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 text-body-medium">
      {label}
      <input
        type="checkbox"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.checked)
        }}
        className="size-4 accent-brand"
      />
    </label>
  )
}
