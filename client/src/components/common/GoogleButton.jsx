import { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { cn } from '../../lib/utils';

/**
 * GoogleButton — Google sign-in drawn in our palette.
 * The official multicolour "G" is off the colour law, so we show an outline pill with a monochrome
 * G glyph (Simple Icons, CC0) and keep Google's real button (it issues the ID token the API needs)
 * stacked on top, fully transparent, so the click lands on it. Keyboard focus is mirrored on the
 * visible pill via :focus-within.
 *
 * <GoogleButton label={t('auth.googleContinue')} onSuccess={onGoogleSuccess} onError={…} />
 */
const GoogleG = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
  </svg>
);

const GoogleButton = ({ label, onSuccess, onError, disabled, className }) => {
  const boxRef = useRef(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.min(400, Math.max(200, Math.round(entry.contentRect.width)))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      className={cn(
        'group relative h-11 w-full rounded-full focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--focus)]',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
    >
      <span aria-hidden="true" className="btn btn-outline btn-block pointer-events-none h-11 group-hover:border-accent-text group-hover:bg-accent-soft">
        <GoogleG className="h-4 w-4" />
        {label}
      </span>
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-0">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          theme="outline"
          shape="pill"
          size="large"
          text="continue_with"
          width={String(width)}
        />
      </div>
    </div>
  );
};

export default GoogleButton;
