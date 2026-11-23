import { cn } from '../../lib/utils';

/**
 * EdelweissCorner — small raster cluster of edelweiss blossoms that hugs a corner
 * (generated with Codex $imagegen, toned to the colour law by scripts/ornament-tone.py;
 * the dark variant swaps in under .dark and inside .theme-wine panels). The LMS's only floral ornament
 * (the lace corners and lace trims are retired, owner 2026-11-23).
 *
 * The cluster "opens" on mount: it unfurls from its own corner (.orn-bloom: scale + turn + fade,
 * transform/opacity only; reduced motion collapses it). The flip lives on the wrapper, the bloom on the art.
 *
 * <EdelweissCorner corner="br" className="absolute bottom-0 right-0 w-24" />
 * Props: corner 'tl'|'tr'|'bl'|'br', className (size + position), delay (ms before it opens), style.
 * Decorative only (aria-hidden).
 */
const CORNER_TRANSFORM = {
  tl: undefined,
  tr: 'scaleX(-1)',
  bl: 'scaleY(-1)',
  br: 'scale(-1, -1)',
};

const EdelweissCorner = ({ corner = 'tl', className = 'w-24', delay, style }) => (
  <div
    aria-hidden="true"
    className={cn('pointer-events-none', className)}
    style={{ transform: CORNER_TRANSFORM[corner], ...style }}
  >
    <div
      className="orn-bloom aspect-square origin-top-left bg-contain bg-no-repeat"
      style={{ backgroundImage: 'var(--tex-edel-corner)', ...(delay ? { '--bloom-delay': `${delay}ms` } : null) }}
    />
  </div>
);

export default EdelweissCorner;
