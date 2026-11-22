import { Globe, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/useTheme';
import Dropdown from '../../components/common/Dropdown';
import { BrandMark } from '../../components/brand';
import { EdelweissCorner, OrnateFrame, WaxSeal } from '../../components/ornament';
import { cn } from '../../lib/utils';

/**
 * AuthLayout — the shared auth composition (Login, Register, Forgot/Reset password, Accept invitation).
 * Full-screen flat paper colour, the brand mark (no wordmark) as a large faint watermark behind, a small edelweiss
 * cluster in every corner, and the form centred in a transparent ornate frame under a wax seal.
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

const ThemeToggle = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const label = theme === 'dark' ? t('common.lightMode') : t('common.darkMode');
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      aria-pressed={theme === 'dark'}
      className="flex h-[2.15rem] w-[2.15rem] items-center justify-center rounded-full border border-line-strong bg-surface text-ink-muted transition-colors hover:border-ornament-soft hover:text-ink"
    >
      {theme === 'dark' ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
    </button>
  );
};

const AuthLayout = ({ children, className }) => (
  <div className="relative isolate flex min-h-screen bg-[var(--paper)] flex-col items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
    {/* ---------------------------------------------------------------- background (follows the page theme) */}
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      {/* parchment texture, toned down to a soft hint (owner: not flat, not as strong as .paper) */}
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'var(--tex-paper)', backgroundSize: '512px 512px' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <BrandMark className="h-[92vh] w-auto max-w-[96vw] text-wine opacity-[0.16] dark:text-white dark:opacity-[0.12]" />
      </div>
      <EdelweissCorner corner="tl" className={cn('absolute left-0 top-0', CORNER_SIZE)} />
      <EdelweissCorner corner="tr" className={cn('absolute right-0 top-0', CORNER_SIZE)} />
      <EdelweissCorner corner="bl" className={cn('absolute bottom-0 left-0', CORNER_SIZE)} />
      <EdelweissCorner corner="br" className={cn('absolute bottom-0 right-0', CORNER_SIZE)} />
    </div>

    {/* language menu + theme toggle: top centre, clear of the corner ornaments */}
    <div className="absolute left-1/2 top-5 z-30 flex -translate-x-1/2 items-center gap-2">
      <LanguageMenu align="left" />
      <ThemeToggle />
    </div>

    {/* ---------------------------------------------------------------- centred form card */}
    <div className="relative w-full max-w-[30rem]">
      <WaxSeal size={76} className="relative z-10 mx-auto -mb-9 block" />
      {/* oval frame (owner): elliptical radii, no corner flourishes (they would sit outside the curve) */}
      <OrnateFrame
        paper
        corners="none"
        className="relative bg-transparent bg-none px-8 pb-20 pt-20 shadow-none sm:px-16"
        style={{ borderRadius: '50% / 25%' }}
      >
        <div className={cn('mx-auto w-full max-w-[26rem]', className)}>{children}</div>
      </OrnateFrame>
    </div>
  </div>
);

export default AuthLayout;
