'use client'

import { useState, useCallback } from 'react'
import { Badge } from '@/components/catalyst/badge'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { apiFetch } from '@/lib/api'
import { DS_TEXT } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'

interface FacilityTag {
  id: string
  name: string
}

interface FacilityTagInputProps {
  tags: FacilityTag[]
  onChange: (tags: FacilityTag[]) => void
  className?: string
}

interface SearchResult {
  id: string
  name: string
  address: string
}

export function FacilityTagInput({ tags, onChange, className = '' }: FacilityTagInputProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    setIsSearching(true)
    try {
      const res = await apiFetch<{ data: SearchResult[] }>(`/api/facilities?q=${encodeURIComponent(q)}&limit=5`)
      setResults(res.data ?? [])
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleInput = (value: string) => {
    setQuery(value)
    search(value)
  }

  const addTag = (facility: SearchResult) => {
    if (tags.some((t) => t.id === facility.id)) return
    onChange([...tags, { id: facility.id, name: facility.name }])
    setQuery('')
    setResults([])
  }

  const removeTag = (id: string) => {
    onChange(tags.filter((t) => t.id !== id))
  }

  return (
    <div className={className}>
      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag.id} color="dotori" className="flex items-center gap-1">
              {tag.name}
              <button onClick={() => removeTag(tag.id)} aria-label={`${tag.name} 제거`}>
                <XMarkIcon className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="시설 이름 검색..."
          className="w-full rounded-lg border border-dotori-200 bg-white px-3 py-2 text-body-sm text-dotori-900 placeholder:text-dotori-400 focus:border-dotori-500 focus:outline-none focus:ring-1 focus:ring-dotori-500 dark:border-dotori-700 dark:bg-dotori-900 dark:text-dotori-100"
        />

        {(results.length > 0 || isSearching) && (
          <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-dotori-200 bg-white shadow-lg dark:border-dotori-700 dark:bg-dotori-900">
            {isSearching ? (
              <div className="px-3 py-2 text-body-sm text-dotori-400">검색 중...</div>
            ) : (
              results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => addTag(r)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-dotori-50 dark:hover:bg-dotori-800"
                >
                  <span className={cn('text-body-sm font-medium', DS_TEXT.primary)}>
                    {r.name}
                  </span>
                  <span className="truncate text-caption text-dotori-500">{r.address}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
