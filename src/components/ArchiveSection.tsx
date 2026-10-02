import { Archive, ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { secondaryButtonClass } from './ui'

export function ArchiveSection({ weekCount, children }: { weekCount: number; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  if (weekCount === 0) return null
  return (
    <section aria-labelledby="archive-heading" className="space-y-6">
      <h2 id="archive-heading">
        <button type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-controls="archive-weeks" className={`${secondaryButtonClass} w-full justify-between`}>
          <span className="flex items-center gap-2"><Archive aria-hidden="true" size={19} />الأرشيف ({weekCount} {weekCount === 1 ? 'أسبوع' : 'أسابيع'})</span>
          <ChevronDown aria-hidden="true" size={19} className={`transition-transform motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </h2>
      {isOpen && <div id="archive-weeks" className="space-y-10">{children}</div>}
    </section>
  )
}
