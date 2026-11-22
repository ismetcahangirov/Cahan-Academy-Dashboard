import { cn } from '../../lib/utils';

/**
 * WaveEdge — organic wave where two sections meet (dark wine panel -> parchment, etc.).
 * Place it absolutely at the bottom (or top) of the UPPER section; `fill` is the colour of the
 * section it flows into. A hairline in the ornament tone follows the wave (`line`).
 *
 * <div className="relative theme-wine ..."> ... <WaveEdge fill="var(--paper)" className="absolute inset-x-0 bottom-0" /></div>
 * <WaveEdge vertical fill="var(--paper)" className="absolute inset-y-0 right-0" />  (side-by-side panels)
 * Props: fill (CSS colour/var), line (bool), vertical (bool), flip (mirror), className (size/position).
 */
const H_FILL = 'M0 50C180 18 360 16 540 38C720 60 900 72 1080 48C1260 24 1350 24 1440 36V80H0Z';
const H_LINE = 'M0 42C180 10 360 8 540 30C720 52 900 64 1080 40C1260 16 1350 16 1440 28';
const V_FILL = 'M50 0C18 180 16 360 38 540C60 720 72 900 48 1080C24 1260 24 1350 36 1440H80V0Z';
const V_LINE = 'M42 0C10 180 8 360 30 540C52 720 64 900 40 1080C16 1260 16 1350 28 1440';

const WaveEdge = ({ fill = 'var(--page)', line = true, vertical = false, flip = false, className }) => (
  <svg
    viewBox={vertical ? '0 0 80 1440' : '0 0 1440 80'}
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
    className={cn('pointer-events-none block', vertical ? 'h-full w-10 md:w-14' : 'h-10 w-full md:h-14', className)}
    style={flip ? { transform: vertical ? 'scaleY(-1)' : 'scaleX(-1)' } : undefined}
  >
    <path d={vertical ? V_FILL : H_FILL} style={{ fill }} />
    {line && (
      <path
        d={vertical ? V_LINE : H_LINE}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        className="text-ornament"
      />
    )}
  </svg>
);

export default WaveEdge;
