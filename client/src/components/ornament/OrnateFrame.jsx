import { cn } from '../../lib/utils';
import CornerFlourish from './CornerFlourish';

/**
 * OrnateFrame — panel with thin border, inner hairline, soft inner glow and corner flourishes.
 * Use for hero blocks, stat cards, featured content, result certificates. For dense list cards
 * prefer <Card> (plain thin frame) — flourishes on every row get noisy.
 *
 * <OrnateFrame className="p-6">...</OrnateFrame>
 * <OrnateFrame corners="diagonal" cornerSize="h-6 w-6" as="section">...</OrnateFrame>
 * Props: as, corners 'all'|'diagonal'|'none', cornerSize (classes), paper (parchment fill), className.
 */
const PLACES = {
  tl: 'left-2.5 top-2.5',
  tr: 'right-2.5 top-2.5',
  bl: 'left-2.5 bottom-2.5',
  br: 'right-2.5 bottom-2.5',
};

const OrnateFrame = ({
  as: Tag = 'div',
  corners = 'all',
  cornerSize = 'h-7 w-7',
  paper = false,
  className,
  children,
  ...rest
}) => {
  const list = corners === 'all' ? ['tl', 'tr', 'bl', 'br'] : corners === 'diagonal' ? ['tl', 'br'] : [];
  return (
    <Tag className={cn(paper ? 'card-paper' : 'card-ornate', 'relative', className)} {...rest}>
      {list.map((c) => (
        <CornerFlourish key={c} corner={c} className={cn('absolute', PLACES[c], cornerSize)} />
      ))}
      {children}
    </Tag>
  );
};

export default OrnateFrame;
