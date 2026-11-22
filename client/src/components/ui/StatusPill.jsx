import { cn } from '../../lib/utils';
import { STATUS } from './statusMap';

/**
 * StatusPill — status WITHOUT colour semantics: fill pattern + icon + text (a11y: never colour alone).
 *
 *   status       look      icon            use for
 *   success      filled    check           done, passed, paid, approved, active
 *   present      filled    check-check     attendance: present
 *   late         striped   clock           attendance: late, partial, in progress
 *   partial      striped   hourglass       partly paid, partly graded
 *   absent       outline   x               attendance: absent, not submitted
 *   pending      outline   circle          not started, awaiting review, upcoming
 *   excused      dotted    feather         attendance: excused, optional
 *   warning      dashed    alert-triangle  due soon, needs attention
 *   error        alert     alert-octagon   failed, overdue, rejected, blocked
 *   info         muted     info            informational
 *   neutral      muted     minus           draft, archived, inactive
 *
 * <StatusPill status="present">{t('attendance.present')}</StatusPill>
 * <StatusPill status="error">{t('payments.overdue')}</StatusPill>
 * <StatusDot status="late" label={t('attendance.late')} />  (dense tables/calendars; label is sr-only)
 */

const StatusPill = ({ status = 'neutral', icon, children, className }) => {
  const def = STATUS[status] || STATUS.neutral;
  const Icon = icon || def.icon;
  return (
    <span className={cn('status', `status-${def.look}`, className)} data-status={status}>
      <Icon aria-hidden="true" strokeWidth={2} />
      <span>{children}</span>
    </span>
  );
};

const DOT_CLASS = {
  filled: 'is-filled',
  striped: 'is-striped',
  outline: '',
  dotted: 'is-dotted',
  dashed: 'is-dashed',
  alert: 'is-filled',
  muted: 'is-muted',
};

export const StatusDot = ({ status = 'neutral', label, className }) => {
  const def = STATUS[status] || STATUS.neutral;
  return (
    <span className={cn('inline-flex items-center', className)} title={label}>
      <span aria-hidden="true" className={cn('status-dot', DOT_CLASS[def.look])} />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
};

/** Badge — small-caps tag/count. tone: 'default' | 'accent'. */
export const Badge = ({ tone = 'default', className, children }) => (
  <span className={cn('badge', tone === 'accent' && 'badge-accent', className)}>{children}</span>
);

export default StatusPill;
