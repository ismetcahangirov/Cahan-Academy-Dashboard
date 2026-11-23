/**
 * Keeps the sticky / fixed sidebar from scrolling the page behind it (and so the main column).
 *
 * A wheel over the panel scrolls the panel's own scroll area (the nav) while it can move; once that area is at its
 * top / bottom — or the pointer is over a part that does not scroll (brand, footer) — the wheel is swallowed instead
 * of chaining to the page. Touch chaining is stopped in CSS (`overscroll-contain` on the scroll area). Pinch / ctrl+wheel
 * zoom and horizontal-only wheels pass through untouched.
 *
 * useEffect(() => (asideRef.current ? isolateWheel(asideRef.current) : undefined), []);
 */
export function isolateWheel(panel) {
  const onWheel = (e) => {
    if (e.ctrlKey || e.deltaY === 0) return;
    let el = e.target instanceof Element ? e.target : null;
    while (el && panel.contains(el)) {
      if (el instanceof HTMLElement && el.scrollHeight > el.clientHeight + 1) {
        const { overflowY } = getComputedStyle(el);
        if (overflowY === 'auto' || overflowY === 'scroll') {
          const canUp = el.scrollTop > 0;
          const canDown = Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight;
          if ((e.deltaY < 0 && canUp) || (e.deltaY > 0 && canDown)) return; // this area scrolls itself
        }
      }
      if (el === panel) break;
      el = el.parentElement;
    }
    e.preventDefault();
  };
  panel.addEventListener('wheel', onWheel, { passive: false });
  return () => panel.removeEventListener('wheel', onWheel);
}
