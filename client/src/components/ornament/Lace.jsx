import { cn } from '../../lib/utils';

/**
 * Lace (raster, toned to the colour law by scripts/ornament-tone.py; dark variants swap in
 * automatically under .dark and inside .theme-wine panels).
 *
 * <LaceEdge />                      horizontal scalloped trim, scallops pointing down (default)
 * <LaceEdge direction="up" />       scallops pointing up (sits on top of a section)
 * <LaceEdge vertical />             vertical trim, scallops pointing right (sidebar inner edge)
 * <LaceCorner corner="tr" className="absolute right-0 top-0 w-48" />
 * Decorative only (aria-hidden). Keep lace on section edges and corners, never behind data.
 */
export const LaceEdge = ({ direction = 'down', vertical = false, size = 28, className, style }) => (
  <div
    aria-hidden="true"
    className={cn(vertical ? 'lace-strip-v' : 'lace-strip', 'orn-reveal', className)}
    style={{
      ...(vertical ? { width: size } : { height: size }),
      ...(direction === 'up' && !vertical ? { transform: 'scaleY(-1)' } : null),
      ...(direction === 'left' && vertical ? { transform: 'scaleX(-1)' } : null),
      ...style,
    }}
  />
);

const CORNER_TRANSFORM = {
  tl: undefined,
  tr: 'scaleX(-1)',
  bl: 'scaleY(-1)',
  br: 'scale(-1, -1)',
};

export const LaceCorner = ({ corner = 'tl', className = 'w-40', style }) => (
  <div
    aria-hidden="true"
    className={cn('pointer-events-none aspect-[400/396] bg-contain bg-no-repeat orn-reveal', className)}
    style={{ backgroundImage: 'var(--tex-lace-corner)', transform: CORNER_TRANSFORM[corner], ...style }}
  />
);

export default LaceEdge;
