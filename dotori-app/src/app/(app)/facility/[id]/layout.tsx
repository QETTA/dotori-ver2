import type { Metadata } from 'next'
import { apiFetch } from '@/lib/api'

interface Props {
  params: Promise<{ id: string }>
}

interface FacilityResponse {
  name?: string
  address?: string
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const facility = await apiFetch<FacilityResponse>(`/api/facilities/${id}`, {
      unwrapData: true,
    })
    if (!facility?.name) {
      return { title: '시설 상세 — 도토리' }
    }
    const title = `${facility.name} — 도토리`
    const description = facility.address
      ? `${facility.name} · ${facility.address}`
      : facility.name
    return {
      title,
      description,
      openGraph: { title, description },
    }
  } catch {
    return { title: '시설 상세 — 도토리' }
  }
}

export default function FacilityDetailLayout({ children }: { children: React.ReactNode }) {
  return children
}
