import { cn } from '../../lib/utils';
import { BookmarkRibbon } from '../ornament/Ribbons';
import CornerFlourish from '../ornament/CornerFlourish';

/**
 * Card — the content container.
 *
 * variant:
 *   'plain'     thin frame, white/wine surface — dense lists, table wrappers, forms (default)
 *   'ornate'    + inner hairline, inner glow, two corner flourishes — highlights, summaries
 *   'paper'     parchment fill + texture — reading content, forms in auth/detail pages
 *   'featured'  ornate + a satin bookmark ribbon hanging from the top edge — the one item to notice
 * hover: lift on hover (transform only) for clickable cards;  as: element/component (e.g. Link).
 *
 * <Card className="p-5">…</Card>
 * <Card variant="featured" as={Link} to={`/courses/${id}`} hover className="p-6">…</Card>
 * <CardHeader title="Son tapşırıqlar" subtitle="Bu həftə" actions={<Button size="sm" variant="ghost">…</Button>} />
 */
const VARIANT = {
  plain: 'card',
  ornate: 'card-ornate',
  paper: 'card-paper',
  featured: 'card-ornate',
};

const Card = ({ as: Tag = 'div', variant = 'plain', hover = false, className, children, ...rest }) => (
  <Tag className={cn(VARIANT[variant] || VARIANT.plain, hover && 'card-hover', className)} {...rest}>
    {(variant === 'ornate' || variant === 'featured') && (
      <>
        <CornerFlourish corner="tl" className="absolute left-2.5 top-2.5 h-6 w-6" />
        <CornerFlourish corner="br" className="absolute bottom-2.5 right-2.5 h-6 w-6" />
      </>
    )}
    {variant === 'featured' && <BookmarkRibbon />}
    {children}
  </Tag>
);

/** Card heading row: serif title + small-caps subtitle + actions. Not script — script is for page/section titles. */
export const CardHeader = ({ title, subtitle, actions, className }) => (
  <div className={cn('flex items-start justify-between gap-3', className)}>
    <div className="min-w-0">
      <h3 className="text-[1.2rem] font-semibold leading-snug text-ink">{title}</h3>
      {subtitle && <p className="sc mt-0.5 text-[0.8rem] text-ink-muted">{subtitle}</p>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
  </div>
);

export default Card;
