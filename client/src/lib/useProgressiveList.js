import { startTransition, useEffect, useMemo, useState } from 'react';

/**
 * Render a long list in slices so a route change never blocks the main thread for the whole list.
 *
 *   const visible = useProgressiveList(groups);          // first 12 now, then +12 per task
 *   visible?.map((g) => <GroupCard key={g._id} … />)
 *
 * The first slice renders with the page; the rest follow in low-priority transitions (one slice
 * per macrotask), so the browser can paint and handle input in between. Within ~5 tasks a
 * 60-item list is complete. Search/filter results keep the current slice size.
 */
export function useProgressiveList(items, { initial = 12, step = 12 } = {}) {
  const total = items?.length ?? 0;
  const [count, setCount] = useState(initial);

  useEffect(() => {
    if (count >= total) return undefined;
    const id = setTimeout(() => startTransition(() => setCount((c) => c + step)), 0);
    return () => clearTimeout(id);
  }, [count, total, step]);

  return useMemo(() => (items && items.length > count ? items.slice(0, count) : items), [items, count]);
}

export default useProgressiveList;
