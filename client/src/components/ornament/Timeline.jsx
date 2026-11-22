import { cn } from '../../lib/utils';
import { EdelweissGlyph } from './Edelweiss';

/**
 * Timeline — vertical hairline with dots; italic times on the left, small-caps labels on the right.
 * Schedule, the dashboard "today" agenda, activity history.
 *
 * <Timeline>
 *   <TimelineItem time="09:00" title="Riyaziyyat" meta="Qrup A · Otaq 3" state="done" />
 *   <TimelineItem time="11:00" title="Fizika" state="current">…children…</TimelineItem>
 *   <TimelineItem time="14:00" title="Kimya" />
 * </Timeline>
 * state: 'done' (filled dot) | 'current' (edelweiss) | 'upcoming' (outline dot, default) | 'cancelled' (dashed, struck)
 */
export const Timeline = ({ className, children }) => (
  <ol className={cn('relative orn-stagger', className)}>{children}</ol>
);

const Dot = ({ state }) => {
  if (state === 'current') {
    return <EdelweissGlyph className="h-5 w-5 text-accent-text" />;
  }
  return (
    <span
      className={cn(
        'block h-2.5 w-2.5 rounded-full border-[1.5px] border-accent-text bg-page',
        state === 'done' && 'bg-accent-text',
        state === 'cancelled' && 'border-dashed border-line-strong'
      )}
    />
  );
};

export const TimelineItem = ({ time, title, meta, state = 'upcoming', children, className }) => (
  <li className={cn('relative grid grid-cols-[4.25rem_1.5rem_1fr] gap-x-2 sm:grid-cols-[5.25rem_1.75rem_1fr]', className)}>
    <div className="time-italic pt-0.5 text-right text-[1.05rem] text-ink-muted">{time}</div>
    <div className="relative flex justify-center">
      <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line-strong" />
      <span className="relative z-10 mt-1.5 flex h-5 items-start justify-center">
        <Dot state={state} />
      </span>
    </div>
    <div className={cn('pb-6', state === 'cancelled' && 'line-through decoration-line-strong')}>
      <p className={cn('sc text-[0.95rem]', state === 'current' ? 'text-accent-text' : 'text-ink')}>{title}</p>
      {meta && <p className="mt-0.5 text-sm text-ink-muted">{meta}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  </li>
);

export default Timeline;
