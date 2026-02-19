/**
 * JSON-LD Structured Data for SEO
 * https://developers.google.com/search/docs/appearance/structured-data
 */

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '도토리',
    url: 'https://dotori.ai',
    logo: 'https://dotori.ai/icons/icon-512.png',
    description: 'AI 기반 어린이집 입소 확률 분석, 실시간 TO 알림, 맞춤 전략 상담',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['Korean', 'English'],
    },
  }
}

export function facilityJsonLd(facility: {
  name: string
  address: string
  phone?: string
  rating?: number
  reviewCount?: number
  type?: string
  lat?: number
  lng?: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ChildCare',
    name: facility.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: facility.address,
      addressLocality: '서울',
      addressCountry: 'KR',
    },
    ...(facility.phone && { telephone: facility.phone }),
    ...(facility.lat &&
      facility.lng && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: facility.lat,
          longitude: facility.lng,
        },
      }),
    ...(facility.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: facility.rating,
        reviewCount: facility.reviewCount ?? 0,
        bestRating: 5,
      },
    }),
  }
}

export function breadcrumbJsonLd(items: { name: string; href: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `https://dotori.ai${item.href}`,
    })),
  }
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/** React component for injecting JSON-LD */
export function JsonLd({ data }: { data: Record<string, any> }) {
  return <script type="application/ld+json">{JSON.stringify(data)}</script>
}
