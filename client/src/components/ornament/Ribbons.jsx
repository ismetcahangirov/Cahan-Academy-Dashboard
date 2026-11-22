import { cn } from '../../lib/utils';

/**
 * Ribbons (raster satin, toned to the colour law).
 *
 * <BookmarkRibbon />  hangs from the top edge of a featured card like a book's bookmark.
 *                     Parent must be `relative`; default position: top-right.
 *                     <Card variant="featured"> adds one for you.
 * <DrapedRibbon />    a bow with long tails draped over a corner (auth hero, celebratory spots).
 *                     Place absolutely: <DrapedRibbon className="absolute -right-6 -top-4 w-64" />
 */
export const BookmarkRibbon = ({ className, length = 64, width = 16 }) => (
  <div
    aria-hidden="true"
    className={cn('pointer-events-none absolute -top-px right-6 bg-no-repeat orn-reveal', className)}
    style={{
      width,
      height: length,
      backgroundImage: 'var(--tex-bookmark)',
      backgroundSize: '100% auto',
      backgroundPosition: 'bottom center',
    }}
  />
);

export const DrapedRibbon = ({ className = 'w-64', flip = false, style }) => (
  <div
    aria-hidden="true"
    className={cn('pointer-events-none aspect-[720/486] bg-contain bg-no-repeat orn-reveal', className)}
    style={{ backgroundImage: 'var(--tex-ribbon)', transform: flip ? 'scaleX(-1)' : undefined, ...style }}
  />
);

export default BookmarkRibbon;
