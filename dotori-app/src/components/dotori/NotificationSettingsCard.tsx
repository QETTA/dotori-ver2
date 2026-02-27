'use client'

/**
 * NotificationSettingsCard — Catalyst Switch 기반 설정 카드
 * SwitchGroup + SwitchField, FadeInStagger
 */
import { useState } from 'react'
import { Switch, SwitchField, SwitchGroup } from '@/components/catalyst/switch'
import { Label, Description } from '@/components/catalyst/fieldset'
import { Subheading } from '@/components/catalyst/heading'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'

interface SettingItem {
  id: string
  label: string
  description?: string
  defaultChecked?: boolean
}

export function NotificationSettingsCard({
  title,
  settings,
  onChange,
}: {
  title: string
  settings: SettingItem[]
  onChange?: (values: Record<string, boolean>) => void
}) {
  const [values, setValues] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const s of settings) {
      initial[s.id] = s.defaultChecked ?? false
    }
    return initial
  })

  const handleChange = (id: string, checked: boolean) => {
    setValues((prev) => {
      const next = { ...prev, [id]: checked }
      onChange?.(next)
      return next
    })
  }

  return (
    <div>
      <Subheading level={3} className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">
        {title}
      </Subheading>
      <SwitchGroup className="mt-4">
        <FadeInStagger faster className="space-y-4">
          {settings.map((setting) => (
            <FadeIn key={setting.id}>
              <SwitchField>
                <Label>{setting.label}</Label>
                {setting.description && (
                  <Description>{setting.description}</Description>
                )}
                <Switch
                  color="dotori"
                  checked={values[setting.id] ?? false}
                  onChange={(checked) => handleChange(setting.id, checked)}
                />
              </SwitchField>
            </FadeIn>
          ))}
        </FadeInStagger>
      </SwitchGroup>
    </div>
  )
}
