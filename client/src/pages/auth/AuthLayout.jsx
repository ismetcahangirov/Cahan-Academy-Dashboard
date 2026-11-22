import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Dropdown from '../../components/common/Dropdown';
import { BrandLogo } from '../../components/brand';
import {
  DrapedRibbon,
  LaceCorner,
  LaceEdge,
  OrnamentDivider,
  WaveEdge,
  WaxSeal,
} from '../../components/ornament';
import PetalField from '../../components/three/PetalField';
import { cn } from '../../lib/utils';

/**
 * AuthLayout — the shared auth composition (DESIGN.md "Auth page"; Login is the reference).
 * Desktop: 46/54 grid, wine hero (logo, script line, small-caps line, divider, wax seal, lace,
 * PetalField) → vertical wave → parchment form panel, draped ribbon across the join.
 * Mobile: wine band (logo, script line, language menu, ribbon, lace) → lace + wave → wax seal
 * overlapping the join → form.
 *
 * <AuthLayout>
 *   <ScriptTitle align="center" size="page" title=… subtitle=… />
 *   <form>…</form>
 * </AuthLayout>
 * Props: children (the form column), className (extra classes on the form column).
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

const AuthLayout = ({ children, className }) => {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen bg-paper lg:grid lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)]">
      {/* ---------------------------------------------------------------- wine hero */}
      <aside className="theme-wine login-hero relative isolate overflow-hidden lg:min-h-screen">
        <PetalField className="absolute inset-0 -z-10" />
        <LaceCorner corner="tl" className="absolute left-0 top-0 w-32 sm:w-44 lg:w-60" />
        <LaceCorner corner="bl" className="absolute bottom-0 left-0 hidden w-52 lg:block" />
        <DrapedRibbon className="absolute -right-10 -top-3 w-52 sm:w-64 lg:hidden" />
        <div className="absolute left-4 top-4 z-30 lg:hidden">
          <LanguageMenu align="left" />
        </div>

        <div className="relative flex flex-col items-center px-6 pb-20 pt-12 text-center sm:pb-24 lg:min-h-screen lg:justify-center lg:pb-16 lg:pt-16">
          <BrandLogo className="orn-rise h-32 w-auto text-white sm:h-40 lg:h-56" />
          <p className="orn-rise mt-6 font-script text-[2.3rem] leading-none text-white sm:text-[2.7rem] lg:mt-10 lg:text-[3.2rem]">
            {t('auth.heroLine')}
          </p>
          <OrnamentDivider className="mt-4 hidden sm:flex" />
          <p className="sc mt-3 hidden text-[0.85rem] text-ink-muted sm:block lg:text-[0.95rem]">{t('auth.heroSub')}</p>
          <WaxSeal size={92} className="mt-10 hidden lg:inline-block" />
        </div>

        {/* lace trim + wave into the parchment (bottom on mobile, right edge on desktop) */}
        <LaceEdge direction="up" size={22} className="absolute inset-x-0 bottom-9 lg:hidden" />
        <WaveEdge fill="var(--paper-base)" className="absolute inset-x-0 -bottom-px lg:hidden" />
        <WaveEdge vertical fill="var(--paper-base)" className="absolute inset-y-0 -right-px hidden lg:block" />
      </aside>

      {/* ribbon draped over the join of the two panels (desktop) */}
      <DrapedRibbon className="absolute left-[46%] top-[-14px] z-20 hidden w-72 -translate-x-[42%] lg:block" />

      {/* ---------------------------------------------------------------- parchment form */}
      <main className="paper relative flex flex-col items-center px-5 pb-12 sm:px-8 lg:min-h-screen lg:justify-center lg:py-16">
        <WaxSeal size={72} className="relative z-10 -mt-12 mb-2 lg:hidden" />

        <div className="absolute right-6 top-6 z-30 hidden lg:block">
          <LanguageMenu align="right" />
        </div>

        <div className={cn('w-full max-w-[26rem] pt-4 lg:pt-0', className)}>{children}</div>
      </main>
    </div>
  );
};

export default AuthLayout;
