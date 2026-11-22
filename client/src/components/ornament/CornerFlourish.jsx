import { cn } from '../../lib/utils';

/**
 * CornerFlourish — a line-art corner bracket with scrolls. Four rotations.
 * Usually placed by <OrnateFrame>; standalone: put it in a `relative` parent.
 *
 * <CornerFlourish corner="tl" className="absolute left-2 top-2 h-8 w-8" />
 * Props: corner 'tl'|'tr'|'bl'|'br', className (size + position), draw (one-shot stroke draw).
 */
const TRANSFORM = {
  tl: undefined,
  tr: 'scaleX(-1)',
  bl: 'scaleY(-1)',
  br: 'scale(-1, -1)',
};

const CornerFlourish = ({ corner = 'tl', className = 'h-8 w-8', draw = false }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.1"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
    className={cn('pointer-events-none text-ornament', draw && 'orn-draw', className)}
    style={TRANSFORM[corner] ? { transform: TRANSFORM[corner] } : undefined}
  >
    <path pathLength="1" vectorEffect="non-scaling-stroke" d="M3 44V15C3 8.4 8.4 3 15 3H44" />
    <path pathLength="1" vectorEffect="non-scaling-stroke" d="M44 3C51 3 54 7.5 51.2 10.2C49 12.3 45.6 10.6 47 8.3" />
    <path pathLength="1" vectorEffect="non-scaling-stroke" d="M3 44C3 51 7.5 54 10.2 51.2C12.3 49 10.6 45.6 8.3 47" />
    <path pathLength="1" vectorEffect="non-scaling-stroke" d="M10 10C15.5 15.5 17 21.5 13.8 24.4C11.6 26.4 8.6 24.4 10.2 22" />
    <path pathLength="1" vectorEffect="non-scaling-stroke" d="M10 10C15.5 15.5 21.5 17 24.4 13.8C26.4 11.6 24.4 8.6 22 10.2" />
    <circle cx="9" cy="9" r="1.8" fill="currentColor" stroke="none" />
    <circle cx="28" cy="7.2" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="7.2" cy="28" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export default CornerFlourish;
