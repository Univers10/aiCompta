import type { DocumentStatus } from '@aicompta/types';
import { cn } from '@/lib/utils/cn';

const CONFIG: Record<DocumentStatus, { label: string; className: string }> = {
  PENDING: { label: 'En attente', className: 'bg-zinc-200 text-zinc-700' },
  PROCESSING: { label: 'Extraction…', className: 'bg-blue-100 text-blue-700 animate-pulse' },
  EXTRACTED: { label: 'Extrait', className: 'bg-blue-100 text-blue-700' },
  NEEDS_REVIEW: { label: 'À vérifier', className: 'bg-orange-100 text-orange-700' },
  VALIDATED: { label: 'Validé', className: 'bg-green-100 text-green-700' },
  POSTED: { label: 'Comptabilisé', className: 'bg-green-200 text-green-900' },
  REJECTED: { label: 'Rejeté', className: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Annulé', className: 'bg-zinc-300 text-zinc-600 line-through' },
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const cfg = CONFIG[status];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.className)}>
      {cfg.label}
    </span>
  );
}
