import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

const PasswordInput = ({ className, wrapperClassName, ref, ...props }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const label = visible ? t('common.hidePassword') : t('common.showPassword');

  return (
    <div className={cn('relative w-full', wrapperClassName)}>
      <input
        {...props}
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={cn(className, 'pr-11')}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:text-accent-text hover:bg-surface-2 transition-colors"
      >
        {visible ? <EyeOff className="h-4 w-4" strokeWidth={1.6} /> : <Eye className="h-4 w-4" strokeWidth={1.6} />}
      </button>
    </div>
  );
};

export default PasswordInput;
