import { lazy, Suspense, useEffect, useState } from 'react';

/**
 * PetalField — optional 3D delight for auth heroes: edelweiss petals tumbling slowly in palette tones.
 * three.js is loaded lazily in its own chunk ONLY when: WebGL is available, the user does not prefer
 * reduced motion, and the device is not in save-data mode. Otherwise nothing renders (the static
 * ornaments around it are the fallback). Never use it on data-heavy pages.
 *
 * <div className="relative"><PetalField className="absolute inset-0" /> …</div>
 */
const EdelweissPetals = lazy(() => import('./EdelweissPetals'));

const canRender = () => {
  if (typeof window === 'undefined' || typeof window.WebGLRenderingContext === 'undefined') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  if (navigator.connection?.saveData) return false;
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

const PetalField = ({ className, count }) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // defer until the page has painted so the 3D chunk never competes with first render
    const run = () => setEnabled(canRender());
    if (window.requestIdleCallback) {
      const id = window.requestIdleCallback(run, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(run, 300);
    return () => window.clearTimeout(id);
  }, []);

  if (!enabled) return null;
  return (
    <Suspense fallback={null}>
      <EdelweissPetals className={className} count={count} />
    </Suspense>
  );
};

export default PetalField;
