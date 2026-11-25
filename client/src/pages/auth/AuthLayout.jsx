import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Dropdown from '../../components/common/Dropdown';
import { BrandMark } from '../../components/brand';
import { EdelweissCorner } from '../../components/ornament';
import { cn } from '../../lib/utils';

/**
 * AuthLayout — the shared auth composition (Login, Register, Forgot/Reset password, Accept invitation).
 * Full-screen flat paper colour, the brand mark (no wordmark) as a large faint watermark behind, a small edelweiss
 * cluster in every corner, and the form centred on the page (no card, frame or seal).
 *
 * <AuthLayout>
 *   <ScriptTitle align="center" size="page" title=… subtitle=… />
 *   <form>…</form>
 * </AuthLayout>
 * Props: children (the form), className (extra classes on the form column).
 */
const LANGUAGES = [
  { code: 'az', name: 'Azərbaycanca' },
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
];

const LanguageMenu = ({ align }) => {
  const { i18n } = useTranslation();
  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];
  return (
    <Dropdown
      label={current.code.toUpperCase()}
      icon={<Globe size={15} strokeWidth={1.5} />}
      items={LANGUAGES.map((lang) => ({
        label: lang.name,
        active: i18n.language === lang.code,
        onClick: () => i18n.changeLanguage(lang.code),
      }))}
      align={align}
      menuClassName="w-44"
    />
  );
};

const CORNER_SIZE = 'w-20 sm:w-28 lg:w-36';

const AuthLayout = ({ children, className }) => (
  <div className="relative isolate flex min-h-screen bg-[var(--paper)] flex-col items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
    {/* ---------------------------------------------------------------- background (follows the page theme) */}
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      {/* parchment texture, toned down to a soft hint (owner: not flat, not as strong as .paper) */}
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'var(--tex-paper)', backgroundSize: '512px 512px' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        {/* full height on wide screens; on phones (portrait) the width decides, so the whole mark stays on screen
            (aspect 1.36: 60vw tall = 81vw wide; the 7% nudge is the old 6vw optical offset, relative to the mark) */}
        <BrandMark className="w-auto max-w-none shrink-0 translate-x-[7%] text-wine opacity-[0.13] dark:text-white dark:opacity-[0.1]" style={{ height: 'min(100vh, 60vw)' }} />
      </div>
      <EdelweissCorner corner="tl" className={cn('absolute left-0 top-0', CORNER_SIZE)} />
      <EdelweissCorner corner="tr" delay={240} className={cn('absolute right-0 top-0', CORNER_SIZE)} />
      <EdelweissCorner corner="bl" delay={360} className={cn('absolute bottom-0 left-0', CORNER_SIZE)} />
      <EdelweissCorner corner="br" delay={480} className={cn('absolute bottom-0 right-0', CORNER_SIZE)} />
    </div>

    {/* language menu: top centre, clear of the corner ornaments */}
    <div className="absolute left-1/2 top-5 z-30 flex -translate-x-1/2 items-center gap-2">
      <LanguageMenu align="left" />
    </div>

    {/* ---------------------------------------------------------------- centred form (owner: no card, frame or seal) */}
    <div className="relative w-full max-w-[37rem] px-4 py-8 sm:px-24">
      <div className={cn('mx-auto w-full max-w-[22rem]', className)}>{children}</div>
    </div>
  </div>
);

export default AuthLayout;
