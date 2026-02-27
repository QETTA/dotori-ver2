'use client'

/**
 * RegionCombobox — Catalyst Combobox 래퍼
 * 한국어 substring 필터, Field + Label 래퍼
 */
import { Combobox, ComboboxOption } from '@/components/catalyst/combobox'
import { Field, Label } from '@/components/catalyst/fieldset'

export function RegionCombobox({
  value,
  onChange,
  options,
  placeholder = '지역 선택',
  label,
}: {
  value: string | undefined
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  label?: string
}) {
  return (
    <Field>
      {label && <Label>{label}</Label>}
      <Combobox<string>
        value={value}
        onChange={(v) => v && onChange(v)}
        options={options}
        displayValue={(v) => v ?? ''}
        filter={(option, query) =>
          option.toLowerCase().includes(query.toLowerCase())
        }
        placeholder={placeholder}
      >
        {(option) => (
          <ComboboxOption key={option} value={option}>
            {option}
          </ComboboxOption>
        )}
      </Combobox>
    </Field>
  )
}
