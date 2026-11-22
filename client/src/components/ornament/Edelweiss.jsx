import { EDELWEISS } from '../brand/brandPaths';
import { cn } from '../../lib/utils';

/**
 * Edelweiss — the brand's primary ornament motif.
 *
 * <Edelweiss />       the logo's own line-art flower (crisp from ~24px up): empty states, seals, hero art.
 * <EdelweissGlyph />  a simplified solid glyph for 8–20px: divider centres, bullets, button motif,
 *                     timeline dots. Both use currentColor (default text-ornament).
 */
export const Edelweiss = ({ className = 'h-8 w-8', ...rest }) => (
  <svg
    viewBox={EDELWEISS.viewBox}
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    className={cn('text-ornament', className)}
    {...rest}
  >
    <path d={EDELWEISS.paths[0].d} />
  </svg>
);

const LONG = 'M0-2.6C1.6-4.8 2-8.1 0-11.6C-2-8.1-1.6-4.8 0-2.6Z';
const SHORT = 'M0-2.6C1.3-4.2 1.6-6.4 0-8.9C-1.6-6.4-1.3-4.2 0-2.6Z';

export const EdelweissGlyph = ({ className = 'h-4 w-4', ...rest }) => (
  <svg
    viewBox="-12 -12 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    className={cn('text-ornament', className)}
    {...rest}
  >
    {[0, 90, 180, 270].map((a) => (
      <path key={a} d={LONG} transform={`rotate(${a})`} />
    ))}
    {[45, 135, 225, 315].map((a) => (
      <path key={a} d={SHORT} transform={`rotate(${a})`} />
    ))}
    <path fillRule="evenodd" d="M0-2.9a2.9 2.9 0 1 1 0 5.8a2.9 2.9 0 1 1 0-5.8ZM0-1.8a1.8 1.8 0 1 0 0 3.6a1.8 1.8 0 1 0 0-3.6Z" />
    <circle r="0.9" />
  </svg>
);

export default Edelweiss;
