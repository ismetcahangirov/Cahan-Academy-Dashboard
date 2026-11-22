import { cn } from '../../lib/utils';
import SketchIllustration from '../ornament/SketchIllustration';
import OrnamentDivider from '../ornament/OrnamentDivider';

/**
 * EmptyState — sketch illustration + one script line + plain explanation + the action to take.
 * Copy rule: say what is empty and what to do next ("Hələ tapşırıq yoxdur" + "Yeni tapşırıq yarat").
 *
 * <EmptyState sketch="inkwell" title={t('homeworks.emptyTitle')} description={t('homeworks.emptyHint')}
 *             action={<Button variant="outline" icon={Plus}>{t('homeworks.create')}</Button>} />
 * Props: sketch (see SketchIllustration names), title (script), description, action, compact, className.
 */
const EmptyState = ({ sketch = 'books', title, description, action, compact = false, className }) => (
  <div
    className={cn(
      'flex flex-col items-center text-center',
      compact ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-14',
      className
    )}
  >
    <SketchIllustration name={sketch} className={compact ? 'w-24' : 'w-36 sm:w-44'} />
    {title && (
      <p className={cn('font-script text-accent-text dark:text-ink', compact ? 'text-[1.25rem]' : 'text-[1.6rem]')}>
        {title}
      </p>
    )}
    {!compact && <OrnamentDivider draw={false} className="-mt-1" />}
    {description && <p className="max-w-md text-[0.98rem] text-ink-muted">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export default EmptyState;
