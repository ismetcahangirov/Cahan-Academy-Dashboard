import { cn } from '../../lib/utils';
import OrnamentDivider from '../ornament/OrnamentDivider';

/**
 * Table — framed, scrollable wrapper + .table-ornate (small-caps header, hairline rules,
 * soft row hover). Write ordinary <thead>/<tbody>/<tr>/<td>; add className="num" to numeric cells.
 *
 * <Table caption={t('students.list')}>
 *   <thead><tr><th>{t('common.name')}</th><th className="num">{t('common.score')}</th></tr></thead>
 *   <tbody>{rows.map((r) => <tr key={r.id}><td>{r.name}</td><td className="num">{r.score}</td></tr>)}</tbody>
 * </Table>
 * Props: caption (sr-only text for the table), divider (ornament divider above), className, tableClassName.
 * Mobile: below 640px prefer a card list for >4 columns; the wrapper scrolls horizontally otherwise.
 */
const Table = ({ caption, divider = false, className, tableClassName, children }) => (
  <div className={className}>
    {divider && <OrnamentDivider className="mb-4" />}
    <div className="table-wrap custom-scrollbar">
      <table className={cn('table-ornate', tableClassName)}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  </div>
);

export default Table;
