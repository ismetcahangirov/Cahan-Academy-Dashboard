import { cn } from '../../lib/utils';
import OrnamentDivider from './OrnamentDivider';

/**
 * ScriptTitle — the page/section heading block: calligraphic title, small-caps subtitle,
 * ornament divider, optional actions slot. The ONLY place the script font is used.
 *
 * Page header (start-aligned, actions on the right, wraps under the title on mobile):
 *   <ScriptTitle title={t('groups.title')} subtitle={t('groups.subtitle')} actions={<Button>…</Button>} />
 * Centred section / hero / modal heading:
 *   <ScriptTitle align="center" size="section" title="…" subtitle="…" />
 * Props: title, subtitle, eyebrow (small caps above), actions, align 'start'|'center',
 *        size 'hero'|'page'|'section'|'card', as (heading tag, default h1 for page/hero else h2),
 *        entity (serif line under the script title), divider (default true), className.
 *
 * Rule: the script carries a SHORT FIXED phrase ("İmtahan nəticələri", "Yeni qrup"). Data — an exam,
 * quiz, course, group or person name — never goes into the script; pass it as `entity` (serif,
 * semibold, wraps cleanly). Only a detail page may use its entity's (person's) name as the page title.
 */
const SIZES = {
  // sized for EB Garamond titles; the old script font needed ~25% more
  hero: 'text-[2.7rem] sm:text-[3.3rem]',
  page: 'text-[2.1rem] sm:text-[2.45rem]',
  section: 'text-[1.7rem] sm:text-[1.95rem]',
  card: 'text-[1.4rem]',
};

const ScriptTitle = ({
  title,
  subtitle,
  eyebrow,
  actions,
  align = 'start',
  size = 'page',
  as,
  divider = true,
  entity,
  className,
}) => {
  const Tag = as || (size === 'page' || size === 'hero' ? 'h1' : 'h2');
  const center = align === 'center';
  return (
    <header className={cn('orn-rise', center && 'text-center', className)}>
      <div
        className={cn(
          'flex flex-col gap-4',
          center ? 'items-center' : 'sm:flex-row sm:items-end sm:justify-between'
        )}
      >
        <div className="min-w-0">
          {eyebrow && <p className="sc mb-1 text-[0.8rem] text-ink-muted">{eyebrow}</p>}
          <Tag className={cn('script-title break-words pb-1', SIZES[size])}>{title}</Tag>
          {entity && <p className="mt-0.5 break-words text-[1.2rem] font-semibold leading-snug text-ink">{entity}</p>}
          {subtitle && <p className="sc mt-1.5 text-[0.9rem] text-ink-muted">{subtitle}</p>}
        </div>
        {actions && (
          <div className={cn('flex flex-wrap items-center gap-2', center ? 'justify-center' : 'sm:justify-end')}>
            {actions}
          </div>
        )}
      </div>
      {divider && <OrnamentDivider align={center ? 'center' : 'start'} className="mt-3" />}
    </header>
  );
};

export default ScriptTitle;
