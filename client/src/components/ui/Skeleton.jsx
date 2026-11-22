import { cn } from '../../lib/utils';

/**
 * Skeleton — loading placeholder; shimmer is a translateX gradient on ::after (compositor-only),
 * disabled under prefers-reduced-motion. Size it with classes.
 *
 * <Skeleton className="h-5 w-40" />   <Skeleton className="h-24 w-full rounded-[var(--radius-lg)]" />
 */
const Skeleton = ({ className }) => <div aria-hidden="true" className={cn('skeleton h-4 w-full', className)} />;

export default Skeleton;
