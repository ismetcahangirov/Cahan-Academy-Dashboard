import { AlertTriangle, Check, Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { OrnamentDivider, OrnateFrame, WaxSeal } from '../../../components/ornament';

/**
 * Shared pieces for the exam / quiz surfaces (page-local, composed from the ornament kit).
 *
 * <ExamClock remainingMs={ms} label={t('exams.timeLeft')} />
 *   Small framed clock. Never red: when time is short (< 60 s) the icon switches to a warning
 *   triangle, the figures turn bold and the frame pulses softly (motion-safe only).
 * <ChoiceList name="q1" options={[{ value, label }]} value={v} onChange={setV} />
 *   Options as selectable cards. A native radio group sits inside, so arrow keys and focus
 *   work. Selected = filled wine + check icon (never colour alone).
 * <QuestionHeading index text extra />  italic serif question number + text.
 * <ScoreSeal ... />  Result frame with the wax seal.
 */
const formatRemaining = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const URGENT_MS = 60 * 1000;

export const ExamClock = ({ remainingMs, label, className }) => {
  const urgent = remainingMs <= URGENT_MS;
  const Icon = urgent ? AlertTriangle : Clock;
  return (
    <div
      role="timer"
      aria-label={`${label}: ${formatRemaining(remainingMs)}`}
      className={cn(
        'inline-flex items-center gap-2.5 rounded-full border bg-surface px-4 py-1.5 text-ink',
        'shadow-[inset_0_0_0_3px_var(--surface),inset_0_0_0_4px_var(--line-hair)]',
        urgent ? 'border-2 border-accent-text motion-safe:animate-pulse' : 'border-line-strong',
        className
      )}
    >
      <Icon aria-hidden="true" size={17} strokeWidth={urgent ? 2.2 : 1.6} className="text-accent-text" />
      <span className="sc text-[0.78rem] text-ink-muted">{label}</span>
      <span className={cn('num time-italic text-[1.15rem] tabular-nums', urgent ? 'font-bold' : 'font-medium')}>
        {formatRemaining(remainingMs)}
      </span>
    </div>
  );
};

export const ChoiceList = ({ name, options, value, onChange, className }) => (
  <div role="radiogroup" className={cn('space-y-2.5', className)}>
    {options.map((opt, i) => {
      const selected = value === opt.value;
      return (
        <label
          key={opt.value}
          className={cn(
            'relative flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 transition-colors',
            'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
            selected
              ? 'border-accent bg-accent text-accent-fg'
              : 'border-line-strong bg-surface text-ink hover:bg-surface-2'
          )}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={selected}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          <span aria-hidden="true" className="time-italic w-5 shrink-0 text-[1.05rem] leading-snug">
            {String.fromCharCode(65 + i)}.
          </span>
          <span className="min-w-0 flex-1 break-words text-[1.02rem] leading-snug">{opt.label}</span>
          <span
            aria-hidden="true"
            className={cn(
              'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.5px]',
              selected ? 'border-accent-fg bg-accent-fg text-accent' : 'border-line-strong'
            )}
          >
            {selected && <Check size={13} strokeWidth={3} />}
          </span>
        </label>
      );
    })}
  </div>
);

export const QuestionHeading = ({ index, text, extra, className }) => (
  <h3 className={cn('flex items-baseline gap-3 text-[1.1rem] font-medium leading-snug text-ink', className)}>
    <span className="time-italic w-8 shrink-0 text-right text-[1.7rem] font-normal leading-none text-accent-text dark:text-ink">
      {index}
    </span>
    <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
      {text}
      {extra && <span className="ml-2 text-[0.85rem] font-normal text-ink-muted">{extra}</span>}
    </span>
  </h3>
);

export const ScoreSeal = ({ eyebrow, score, total, percent, caption, children, className }) => (
  <OrnateFrame paper className={cn('flex flex-col items-center px-6 py-9 text-center', className)}>
    <WaxSeal size={84} />
    {eyebrow && <p className="sc mt-4 text-[0.85rem] text-ink-muted">{eyebrow}</p>}
    <p className="num mt-1 text-ink">
      <span className="time-italic text-[3.2rem] leading-none">{score}</span>
      {total !== undefined && total !== null && (
        <span className="time-italic text-[1.6rem] text-ink-muted"> / {total}</span>
      )}
    </p>
    {percent !== undefined && percent !== null && (
      <p className="sc mt-2 text-[0.9rem] text-accent-text dark:text-ink">{percent}%</p>
    )}
    <OrnamentDivider draw={false} className="my-3" />
    {caption && <p className="text-[0.98rem] text-ink-muted">{caption}</p>}
    {children}
  </OrnateFrame>
);
