import { useState } from 'react';
import { cn } from '../../lib/utils';

/**
 * Extracts up to 2 initials from a full name.
 * "Ismayil Cahangirov" → "IC"
 * "Admin" → "A"
 * null/undefined → "?"
 */
const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Avatar — user photo (exempt from the colour law, marked data-user-image) or wine initials,
 * always inside an ornamental double ring (page-coloured gap + ornament hairline).
 *
 * @param {string}  name       Full name used for initials fallback
 * @param {string}  src        Avatar image URL (optional)
 * @param {string}  className  Size/shape classes for the root element (e.g. "w-10 h-10 rounded-full")
 * @param {string}  textSize   Tailwind text-size suffix e.g. 'base', 'xl', 'xs'
 * @param {boolean} frame      Ornamental ring (default true)
 */
const Avatar = ({ name, src, className = '', textSize = 'base', frame = true }) => {
  const [imgError, setImgError] = useState(false);

  const showImage = src && !imgError;
  const initials = getInitials(name);
  const ring = frame && 'shadow-[0_0_0_2px_var(--page),0_0_0_3px_var(--ornament-soft)]';

  return showImage ? (
    <img
      src={src}
      alt={name || 'avatar'}
      data-user-image=""
      className={cn('rounded-full object-cover', ring, className)}
      onError={() => setImgError(true)}
    />
  ) : (
    <div
      className={cn(
        'flex items-center justify-center rounded-full select-none',
        'bg-[#5C000E] font-sc font-bold tracking-wider text-white',
        `text-${textSize}`,
        ring,
        className
      )}
      role="img"
      aria-label={name || 'avatar'}
    >
      {initials}
    </div>
  );
};

export default Avatar;
