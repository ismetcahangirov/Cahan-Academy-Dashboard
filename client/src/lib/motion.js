// Motion system. Durations/easings mirror the CSS tokens in index.css (--dur-*, --ease-*).
// Rules (docs/DESIGN.md#motion): animate transform/opacity only, entrances run once,
// stagger is capped, everything collapses under prefers-reduced-motion
// (<MotionConfig reducedMotion="user"> in App.jsx strips transforms automatically).

export const DUR = { fast: 0.15, base: 0.25, slow: 0.4, draw: 0.9 };
export const EASE = {
  silk: [0.22, 0.61, 0.36, 1],
  spring: { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 },
};
export const STAGGER = 0.04;
export const STAGGER_CAP = 8;

/** Route/page entrance: fade + 8px rise. */
export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE.silk } },
};

/** Staggered list/grid: put on the parent, `listItem` on children (first 8 items stagger, the rest arrive together). */
export const listContainer = {
  initial: {},
  animate: { transition: { staggerChildren: STAGGER } },
};
export const listItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE.silk } },
};
/** Use for item index >= STAGGER_CAP so long lists do not cascade forever. */
export const staggerDelay = (i) => Math.min(i, STAGGER_CAP) * STAGGER;

export const modalVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: DUR.base, ease: EASE.silk } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: DUR.fast, ease: EASE.silk } },
};
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DUR.base, ease: EASE.silk } },
  exit: { opacity: 0, transition: { duration: DUR.fast } },
};
export const menuVariants = {
  initial: { opacity: 0, y: 6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: DUR.fast, ease: EASE.silk } },
  exit: { opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.1 } },
};
