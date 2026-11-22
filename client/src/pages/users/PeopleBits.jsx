import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Badge } from '../../components/ui';
import { cn } from '../../lib/utils';

/**
 * Small shared pieces for the people pages (users / teachers / students / invitations / payments).
 * Lives in the users folder because it belongs to the people-pages redesign; not part of the shared kit.
 */


export const RoleBadge = ({ role }) => {
  const { t } = useTranslation();
  const labels = { admin: t('common.admin'), teacher: t('common.teacher'), student: t('common.student') };
  return <Badge tone="accent">{labels[role] || role}</Badge>;
};

/** Filter chips: the active one is a solid pill, the rest outline pills (no motif). */
export const FilterChips = ({ items, value, onChange, className }) => (
  <div role="group" className={cn('flex flex-wrap items-center gap-2', className)}>
    {items.map((item) => (
      <Button
        key={item.value || 'all'}
        size="sm"
        variant={value === item.value ? 'primary' : 'outline'}
        motif={false}
        aria-pressed={value === item.value}
        onClick={() => onChange(item.value)}
      >
        {item.label}
      </Button>
    ))}
  </div>
);

/** Pagination: ghost buttons + tabular page numbers. Shows at most 7 numbers around the current page. */
export const Pagination = ({ page, pages, total, pageSize, onChange }) => {
  const { t } = useTranslation();
  if (!pages || pages < 2) return null;
  const nums = [];
  const start = Math.max(1, Math.min(page - 3, pages - 6));
  for (let i = start; i <= Math.min(pages, start + 6); i += 1) nums.push(i);
  return (
    <div className="flex flex-col items-center justify-between gap-3 px-1 pt-4 sm:flex-row">
      <p className="num text-sm text-ink-muted">
        {t('students.totalCount', { total, from: (page - 1) * pageSize + 1, to: Math.min(page * pageSize, total) })}
      </p>
      <nav className="flex items-center gap-1" aria-label="pagination">
        <Button variant="ghost" iconOnly size="sm" icon={ChevronLeft} aria-label={t('students.prev')} disabled={page === 1} onClick={() => onChange(page - 1)} />
        {nums.map((n) => (
          <Button
            key={n}
            size="sm"
            variant={page === n ? 'primary' : 'ghost'}
            iconOnly
            aria-current={page === n ? 'page' : undefined}
            className="num"
            onClick={() => onChange(n)}
          >
            {n}
          </Button>
        ))}
        <Button variant="ghost" iconOnly size="sm" icon={ChevronRight} aria-label={t('students.next')} disabled={page === pages} onClick={() => onChange(page + 1)} />
      </nav>
    </div>
  );
};
