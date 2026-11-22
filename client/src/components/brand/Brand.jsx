import { MARK, STACKED, LOCKUP } from './brandPaths';

/*
 * Brand marks drawn from the owner's logo paths (src/assets/brand/logo-full.svg).
 * All are currentColor-driven: wine on light surfaces, white inside .theme-wine / .dark.
 * Set the size with height (h-*) or width (w-*) classes; the aspect ratio is kept.
 */
const BrandSvg = ({ data, title, className, ...rest }) => (
  <svg
    viewBox={data.viewBox}
    fill="currentColor"
    role={title ? 'img' : undefined}
    aria-label={title || undefined}
    aria-hidden={title ? undefined : true}
    focusable="false"
    className={className}
    {...rest}
  >
    {data.paths.map((p, i) => (
      <path key={i} d={p.d} transform={p.transform} />
    ))}
  </svg>
);

/** Crescent + edelweiss, no text. Favicon, collapsed sidebar, seals, avatars. */
export const BrandMark = ({ title = 'Cahan Academy', className = 'h-10 w-auto', ...rest }) => (
  <BrandSvg data={MARK} title={title} className={className} {...rest} />
);

/** Stacked logo: mark over CAHAN / ACADEMY. Auth hero, large brand spots. */
export const BrandLogo = ({ title = 'Cahan Academy', className = 'h-40 w-auto', ...rest }) => (
  <BrandSvg data={STACKED} title={title} className={className} {...rest} />
);

/** Horizontal lockup: mark left, CAHAN over tracked ACADEMY on the right. Sidebar, mobile header. */
export const BrandLockup = ({ title = 'Cahan Academy', className = 'h-10 w-auto', ...rest }) => (
  <BrandSvg data={LOCKUP} title={title} className={className} {...rest} />
);

export default BrandLockup;
