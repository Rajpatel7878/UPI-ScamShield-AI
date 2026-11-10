import { useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw, SearchX } from 'lucide-react'

import { SCAMS, SCAM_CATEGORIES } from '../../data/awareness/scams.js'
import { Button, EmptyState, SearchInput } from '../ui/index.js'
import { ResponsiveGrid } from '../common/ResponsiveGrid.jsx'
import { ScamCard } from './ScamCard.jsx'
import { ScamDetail } from './ScamDetail.jsx'

function matchesQuery(scam, query) {
  const haystack = [
    scam.name,
    scam.description,
    scam.category,
    ...scam.warningSigns,
    ...scam.howItWorks,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(query)
}

/** Searchable, filterable scam library with an inline detail view. */
export function ScamLibrary() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const libraryRef = useRef(null)
  const isFirstRender = useRef(true)

  const normalizedQuery = query.trim().toLowerCase()
  const hasFilters = normalizedQuery.length > 0 || category !== 'All'

  const filteredScams = useMemo(
    () =>
      SCAMS.filter(
        (scam) =>
          (category === 'All' || scam.category === category) &&
          (normalizedQuery === '' || matchesQuery(scam, normalizedQuery)),
      ),
    [category, normalizedQuery],
  )

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    libraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedId])

  const resetFilters = () => {
    setQuery('')
    setCategory('All')
  }

  const selectedScam = SCAMS.find((scam) => scam.id === selectedId) ?? null

  return (
    <div ref={libraryRef} className="scroll-mt-24">
      {selectedScam ? (
        <ScamDetail
          scam={selectedScam}
          onBack={() => setSelectedId(null)}
          onOpen={setSelectedId}
        />
      ) : (
        <>
          <div className="rounded-card border border-white/8 bg-navy-800 p-4 sm:p-5">
            <SearchInput
              label="Search scam guides"
              placeholder="Search by scam name, warning sign, or description…"
              value={query}
              onChange={setQuery}
              hint="Results update as you type."
            />

            <div className="mt-4" role="group" aria-label="Filter scams by category">
              <p className="type-label mb-2">Categories</p>
              <div className="flex flex-wrap gap-2">
                {['All', ...SCAM_CATEGORIES].map((item) => {
                  const active = category === item
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCategory(item)}
                      className={
                        active
                          ? 'rounded-full border border-brand-500/50 bg-brand-500/15 px-3 py-1.5 text-xs font-medium text-brand-200'
                          : 'rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-brand-500/30 hover:text-ink'
                      }
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
              <p className="type-body-sm" role="status" aria-live="polite">
                Showing {filteredScams.length} of {SCAMS.length} guides
                {category !== 'All' ? ` in ${category}` : ''}
                {normalizedQuery ? ` for “${query.trim()}”` : ''}
              </p>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RotateCcw className="size-3.5" aria-hidden="true" />}
                onClick={resetFilters}
                disabled={!hasFilters}
              >
                Reset filters
              </Button>
            </div>
          </div>

          {filteredScams.length > 0 ? (
            <ResponsiveGrid columns={3} gap="md" className="mt-5">
              {filteredScams.map((scam) => (
                <ScamCard key={scam.id} scam={scam} onOpen={setSelectedId} />
              ))}
            </ResponsiveGrid>
          ) : (
            <EmptyState
              icon={SearchX}
              title="No scam guides match your search"
              description="Try a different keyword, choose another category, or reset the filters to see all 15 guides."
              action={<Button onClick={resetFilters}>Reset filters</Button>}
              className="mt-5"
            />
          )}
        </>
      )}
    </div>
  )
}
