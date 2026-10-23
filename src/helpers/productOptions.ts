import type { SelectOption } from '../components/Select.tsx'

// Placeholder choices until the real API provides them.

function toOptions(labels: readonly string[]): SelectOption[] {
  return labels.map((label) => ({ value: label.toLowerCase().replace(/\s+/g, '-'), label }))
}

export const CATEGORY_OPTIONS = toOptions([
  'Construction',
  'Electrical',
  'Plumbing',
  'Hardware',
  'Paint',
  'Tools',
])
export const FORM_OPTIONS = toOptions(['Powder', 'Liquid', 'Solid', 'Gas'])
export const SAFETY_OPTIONS = toOptions([
  'Flammable',
  'Non-flammable',
  'Corrosive',
  'Toxic',
  'Non-hazardous',
])
export const UOM_OPTIONS = toOptions(['Per Unit', 'Per Kg', 'Per Litre', 'Per Bag', 'Per Box'])

// Edit mode: keep an existing value selectable even if it is not in the list
// (DummyJSON products use categories like "beauty").
export function withCurrentOption(options: SelectOption[], value: string): SelectOption[] {
  if (value === '' || options.some((option) => option.value === value)) {
    return options
  }
  const label = value.replace(/-/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase())
  return [...options, { value, label }]
}
