import { cn } from '../../lib/utils';
import { EdelweissGlyph } from '../ornament/Edelweiss';

/**
 * Spinner — a hairline ring with a turning arc (transform-only animation) and, at lg size,
 * a still edelweiss in the middle.
 * size: 'sm' | 'md' | 'lg';  color: 'accent' (default, alias 'bordo') | 'onAccent' (alias 'white').
 */
const SIZES = { sm: 'h-4 w-4', md: 'h-7 w-7', lg: 'h-12 w-12' };
const COLORS = {
  accent: 'text-accent-text',
  bordo: 'text-accent-text',
  onAccent: 'text-accent-fg',
  white: 'text-accent-fg',
};

const Spinner = ({ size = 'lg', color = 'accent', className = '', label }) => (
  <span
    role="status"
    aria-label={label}
    className={cn(
      'relative inline-flex shrink-0 items-center justify-center',
      SIZES[size] || SIZES.lg,
      COLORS[color] || COLORS.accent,
      className
    )}
  >
    <svg viewBox="0 0 24 24" fill="none" className="spin absolute inset-0 h-full w-full" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" strokeDasharray="1.2 2.4" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
    {size === 'lg' && <EdelweissGlyph className="h-5 w-5 text-current" />}
  </span>
);

export default Spinner;
