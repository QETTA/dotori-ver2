'use client'

import type { TemplateField } from '@/lib/esignature-templates'
import { Fieldset, Field, Label } from '@/components/catalyst/fieldset'
import { Input } from '@/components/catalyst/input'
import { Select } from '@/components/catalyst/select'
import { Checkbox, CheckboxField } from '@/components/catalyst/checkbox'
import { DS_TEXT } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'

interface DocumentFormRendererProps {
  fields: TemplateField[]
  values: Record<string, string | boolean>
  onChange: (key: string, value: string | boolean) => void
}

export function DocumentFormRenderer({ fields, values, onChange }: DocumentFormRendererProps) {
  return (
    <Fieldset>
      {fields.map((field, idx) => {
        if (field.type === 'checkbox') {
          return (
            <CheckboxField key={field.key} className={idx > 0 ? 'mt-4' : undefined}>
              <Checkbox
                checked={values[field.key] === true}
                onChange={(checked) => onChange(field.key, checked)}
              />
              <Label>
                {field.label}
                {field.required && <span className={cn(DS_TEXT.muted, 'text-red-500')}> *</span>}
              </Label>
            </CheckboxField>
          )
        }

        if (field.type === 'select') {
          return (
            <Field key={field.key} className={idx > 0 ? 'mt-4' : undefined}>
              <Label>
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </Label>
              <Select
                value={(values[field.key] as string) ?? ''}
                onChange={(e) => onChange(field.key, e.target.value)}
              >
                <option value="">선택하세요</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </Field>
          )
        }

        return (
          <Field key={field.key} className={idx > 0 ? 'mt-4' : undefined}>
            <Label>
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </Label>
            <Input
              type={field.type === 'date' ? 'date' : 'text'}
              value={(values[field.key] as string) ?? ''}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          </Field>
        )
      })}
    </Fieldset>
  )
}
