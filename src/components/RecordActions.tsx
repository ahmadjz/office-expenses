import { Pencil, Trash2 } from 'lucide-react'
import { iconButtonClass } from './ui'

type RecordActionsProps = { label: string; onEdit: () => void; onDelete: () => void }

export function RecordActions({ label, onEdit, onDelete }: RecordActionsProps) {
  return (
    <div className="flex shrink-0 gap-2">
      <button type="button" onClick={onEdit} className={iconButtonClass} aria-label={`تعديل ${label}`}>
        <Pencil aria-hidden="true" size={18} />
      </button>
      <button type="button" onClick={onDelete} className={`${iconButtonClass} hover:text-[var(--color-negative)]`} aria-label={`حذف ${label}`}>
        <Trash2 aria-hidden="true" size={18} />
      </button>
    </div>
  )
}
