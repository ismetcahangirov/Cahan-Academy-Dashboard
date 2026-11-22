import { cn } from '../../lib/utils';

/**
 * EdelweissCorner — small raster cluster of edelweiss blossoms that hugs a corner
 * (generated with Codex $imagegen, toned to the colour law by scripts/ornament-tone.py;
 * the dark variant swaps in under .dark and inside .theme-wine panels).
 *
 * <EdelweissCorner corner="br" className="absolute bottom-0 right-0 w-24" />
 * Decorative only (aria-hidden).
 */
const CORNER_TRANSFORM = {
  tl: undefined,
  tr: 'scaleX(-1)',
  bl: 'scaleY(-1)',
  br: 'scale(-1, -1)',
};

const EdelweissCorner = ({ corner = 'tl', className = 'w-24', style }) => (
  <div
    aria-hidden="true"
    className={cn('pointer-events-none aspect-square bg-contain bg-no-repeat orn-reveal', className)}
    style={{ backgroundImage: 'var(--tex-edel-corner)', transform: CORNER_TRANSFORM[corner], ...style }}
  />
);

export default EdelweissCorner;
