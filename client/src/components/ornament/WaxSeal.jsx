import { MARK } from '../brand/brandPaths';
import { cn } from '../../lib/utils';

/**
 * WaxSeal — satin-finish wax seal (raster) pressed with the crescent + edelweiss mark (vector).
 * Brand/closing element: sidebar footer, login, exam results, certificate-like moments.
 *
 * <WaxSeal size={72} />
 * Props: size (px), className, title (if it should be announced; decorative by default).
 * The emboss uses two opaque wine tones, so it obeys the colour law on any backdrop.
 */
const WaxSeal = ({ size = 72, className, title }) => (
  <div
    role={title ? 'img' : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
    className={cn('relative inline-block shrink-0 bg-contain bg-center bg-no-repeat', className)}
    style={{ width: size, height: size, backgroundImage: 'var(--tex-seal)' }}
  >
    <svg
      viewBox={MARK.viewBox}
      aria-hidden="true"
      focusable="false"
      className="absolute left-1/2 top-1/2 w-[50%] -translate-x-[48%] -translate-y-[52%]"
    >
      {/* highlight edge (light tone, offset down-right) then the pressed mark (deep tone) */}
      <g fill="#C6A6AB" transform="translate(8 8)">
        {MARK.paths.map((p, i) => <path key={i} d={p.d} />)}
      </g>
      <g fill="#3C0009">
        {MARK.paths.map((p, i) => <path key={i} d={p.d} />)}
      </g>
    </svg>
  </div>
);

export default WaxSeal;
