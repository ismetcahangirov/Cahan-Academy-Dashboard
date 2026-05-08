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
 * Avatar component — shows image if available, otherwise renders
 * bordo initials circle. No external API dependency.
 *
 * @param {string}  name       Full name used for initials fallback
 * @param {string}  src        Avatar image URL (optional)
 * @param {string}  className  Tailwind classes for the root element
 * @param {number}  textSize   Tailwind text-size class suffix e.g. 'base', 'xl', 'xs'
 */
const Avatar = ({ name, src, className = '', textSize = 'base' }) => {
  const [imgError, setImgError] = useState(false);

  const showImage = src && !imgError;
  const initials  = getInitials(name);

  return showImage ? (
    <img
      src={src}
      alt={name || 'avatar'}
      className={cn('object-cover', className)}
      onError={() => setImgError(true)}
    />
  ) : (
    <div
      className={cn(
        'flex items-center justify-center font-bold select-none',
        'bg-bordo text-white',
        `text-${textSize}`,
        className
      )}
      aria-label={name || 'avatar'}
    >
      {initials}
    </div>
  );
};

export default Avatar;
