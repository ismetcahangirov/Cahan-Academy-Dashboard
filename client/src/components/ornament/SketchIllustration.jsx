import { cn } from '../../lib/utils';

/**
 * SketchIllustration — engraved pen-and-ink academic objects, toned to the colour law.
 * For empty states and page heads (never behind data). Lazy-loaded; the dark variant is used
 * under .dark and inside .theme-wine.
 *
 * <SketchIllustration name="books" className="w-40" />
 * name: 'books' (generic, courses) | 'inkwell' (homework, writing) | 'globe' (groups, students)
 *       | 'lamp' (schedule, study) | 'cap' (exams, results) | 'notebook' (classwork, notes)
 */
const SKETCHES = ['books', 'inkwell', 'globe', 'lamp', 'cap', 'notebook'];

const SketchIllustration = ({ name = 'books', className = 'w-40', alt = '' }) => {
  const key = SKETCHES.includes(name) ? name : 'books';
  return (
    <span className={cn('inline-block select-none orn-reveal', className)} aria-hidden={alt ? undefined : true}>
      <img
        src={`/ornaments/sketch-${key}.webp`}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable="false"
        className="block h-auto w-full dark:hidden"
      />
      <img
        src={`/ornaments/sketch-${key}-dark.webp`}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable="false"
        className="hidden h-auto w-full dark:block"
      />
    </span>
  );
};

export default SketchIllustration;
