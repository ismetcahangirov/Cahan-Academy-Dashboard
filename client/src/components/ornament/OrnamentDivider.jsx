import { cn } from '../../lib/utils';
import { EdelweissGlyph } from './Edelweiss';

/**
 * OrnamentDivider — edelweiss in the middle, plain strokes tapering from thick (centre) to thin (ends).
 * Goes under every ScriptTitle, above tables, between form sections, inside modals.
 *
 * <OrnamentDivider />                       centred (default)
 * <OrnamentDivider align="start" />         glyph at the start, flourish running to the right
 * <OrnamentDivider motif="dot" draw={false} />
 * Props: align 'center'|'start', motif 'edelweiss'|'dot'|'none', draw (one-shot stroke draw), className.
 */
const Flourish = ({ flip, draw, className }) => (
  <svg
    viewBox="0 0 120 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
    preserveAspectRatio="xMaxYMid meet"
    className={cn('h-4 overflow-visible', draw && 'orn-draw', className)}
    style={flip ? { transform: 'scaleX(-1)' } : undefined}
  >
    <path pathLength="1" vectorEffect="non-scaling-stroke" d="M1 8C30 8 55 8 74 8" />
    <path pathLength="1" vectorEffect="non-scaling-stroke" d="M74 8C86 8 90 2.5 97 2.8C103 3 104.5 9 100 10.2C96.5 11 94.5 7.2 97.5 6" />
    <path pathLength="1" vectorEffect="non-scaling-stroke" d="M74 8C86 8 90 13.5 97 13.2C103 13 104.5 7 100 5.8C96.5 5 94.5 8.8 97.5 10" />
    <path pathLength="1" vectorEffect="non-scaling-stroke" d="M105 8H117" />
    <circle cx="1.5" cy="8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const Motif = ({ motif }) => {
  if (motif === 'none') return null;
  if (motif === 'dot') return <span className="mx-1 inline-block h-1.5 w-1.5 rotate-45 bg-current" aria-hidden="true" />;
  return <EdelweissGlyph className="h-4 w-4 shrink-0 text-current" />;
};

/** Plain tapered stroke: thickest next to the motif, thinning to a point at the outer end. */
const Taper = ({ flip, className }) => (
  <svg
    viewBox="0 0 120 4"
    aria-hidden="true"
    focusable="false"
    preserveAspectRatio="none"
    className={cn('h-1', className)}
    style={flip ? { transform: 'scaleX(-1)' } : undefined}
  >
    <path d="M0 2L118 1Q120 2 118 3Z" fill="currentColor" />
  </svg>
);

/** line: 'taper' (default, plain stroke thick at the centre → thin at the ends) | 'flourish' (curled hairline). */
const OrnamentDivider = ({ align = 'center', motif = 'edelweiss', line = 'taper', draw = true, className }) => {
  const centerW = 'w-24 sm:w-32';
  const sideW = align === 'center' ? centerW : 'w-40 sm:w-56';
  const side = (flip, cls) =>
    line === 'taper' ? <Taper flip={flip} className={cls} /> : <Flourish flip={flip} draw={draw} className={cls} />;
  return (
    <div
      role="presentation"
      className={cn(
        'flex items-center text-ornament',
        line === 'taper' ? 'gap-2.5' : 'gap-1.5',
        align === 'center' ? 'justify-center' : 'justify-start',
        className
      )}
    >
      {align === 'center' && side(false, centerW)}
      <Motif motif={motif} />
      {side(true, sideW)}
    </div>
  );
};

export default OrnamentDivider;
