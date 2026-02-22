import { Button } from '@/components/catalyst/button'
import { Text } from '@/components/catalyst/text'
import { ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface ExploreSuggestionPanelProps {
  recentSearches: string[]
  popularSearches: readonly string[]
  onClearRecent: () => void
  onSelectTerm: (term: string) => void
}

export function ExploreSuggestionPanel({
  recentSearches,
  popularSearches,
  onClearRecent,
  onSelectTerm,
}: ExploreSuggestionPanelProps) {
  return (
    <div className="absolute top-full right-0 left-0 z-30 mt-2 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-dotori-100 duration-150 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1">
      {recentSearches.length > 0 ? (
        <div className="mb-4">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4 text-dotori-500" />
              <Text className="text-sm font-medium text-dotori-500">최근 검색</Text>
            </div>
            <Button
              type="button"
              plain={true}
              onClick={onClearRecent}
              className="min-h-[44px] px-2 text-sm text-dotori-500 transition-colors hover:text-dotori-600"
            >
              전체 삭제
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term) => (
              <Button
                key={term}
                type="button"
                onClick={() => onSelectTerm(term)}
                plain={true}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-dotori-50 px-3 py-2 text-sm text-dotori-700 transition-all hover:bg-dotori-100"
              >
                <ClockIcon className="h-3.5 w-3.5 text-dotori-300" />
                {term}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <div className="mb-2.5 flex items-center gap-1.5">
          <MagnifyingGlassIcon className="h-4 w-4 text-dotori-500" />
          <Text className="text-sm font-medium text-dotori-500">인기 검색어</Text>
        </div>
        <div className="flex flex-wrap gap-2">
          {popularSearches.map((term) => (
            <Button
              key={term}
              type="button"
              plain={true}
              onClick={() => onSelectTerm(term)}
              className="inline-flex min-h-[44px] items-center rounded-full bg-white px-3 py-2 text-sm font-medium text-dotori-500 shadow-sm ring-1 ring-dotori-100 transition-all hover:bg-dotori-50 hover:text-dotori-700"
            >
              {term}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
