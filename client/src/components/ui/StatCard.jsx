import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import CornerFlourish from '../ornament/CornerFlourish';

/**
 * StatCard — ornate frame for a single figure on dashboards.
 * The trend is shown by an arrow icon + words, never by green/red.
 *
 * <StatCard label={t('dashboard.students')} value={128} icon={Users} hint={t('dashboard.thisMonth')} trend="up" trendLabel="+12" />
 * Props: label (small caps), value (string/number, lining tabular figures), icon (lucide), hint,
 *        trend 'up'|'down'|'flat', trendLabel, as (e.g. Link for a clickable card), className.
 */
const TREND = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus };

const StatCard = ({ label, value, icon: Icon, hint, trend, trendLabel, as: Tag = 'div', className, ...rest }) => {
  const TrendIcon = trend ? TREND[trend] : null;
  return (
    <Tag className={cn('card-ornate card-hover block p-5 sm:p-6', className)} {...rest}>
      <CornerFlourish corner="tr" className="absolute right-2.5 top-2.5 h-6 w-6" />
      <CornerFlourish corner="bl" className="absolute bottom-2.5 left-2.5 h-6 w-6" />
      <div className="relative flex items-start gap-4">
        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-strong text-accent-text">
            <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <p className="sc text-[0.8rem] text-ink-muted">{label}</p>
          <p className="num mt-1 text-[2rem] font-semibold leading-none text-ink">{value}</p>
          {(hint || TrendIcon) && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
              {TrendIcon && <TrendIcon size={15} strokeWidth={1.8} aria-hidden="true" className="text-accent-text" />}
              {trendLabel && <span className="num font-semibold text-accent-text">{trendLabel}</span>}
              {hint && <span>{hint}</span>}
            </p>
          )}
        </div>
      </div>
    </Tag>
  );
};

export default StatCard;
