import { cn } from '../../lib/utils';
import ScriptTitle from '../ornament/ScriptTitle';

/**
 * PageShell — standard page frame inside AppLayout: max width, vertical rhythm, ScriptTitle header.
 * Section — a titled block inside a page (script section title + divider), optionally on parchment.
 *
 * <PageShell title={t('courses.title')} subtitle={t('courses.subtitle')} actions={<Button icon={Plus}>…</Button>}>
 *   <Section title={t('courses.active')} variant="paper">…</Section>
 * </PageShell>
 * PageShell props: title, subtitle, eyebrow, actions, width 'default'|'narrow'|'wide', className, children.
 * Section props: title, subtitle, actions, variant 'plain'|'paper', className, children.
 */
const WIDTHS = { narrow: 'max-w-3xl', default: 'max-w-7xl', wide: 'max-w-[1600px]' };

const PageShell = ({ title, subtitle, eyebrow, actions, width = 'default', className, children }) => (
  <div className={cn('mx-auto w-full space-y-8', WIDTHS[width] || WIDTHS.default, className)}>
    {title && <ScriptTitle title={title} subtitle={subtitle} eyebrow={eyebrow} actions={actions} />}
    {children}
  </div>
);

export const Section = ({ title, subtitle, actions, variant = 'plain', className, children }) => (
  <section className={cn(variant === 'paper' && 'theme-light card-paper p-5 sm:p-7', className)}>
    {title && (
      <ScriptTitle as="h2" size="section" title={title} subtitle={subtitle} actions={actions} className="mb-5" />
    )}
    {children}
  </section>
);

export default PageShell;
