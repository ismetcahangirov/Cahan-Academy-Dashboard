import { Lock } from 'lucide-react';
import PasswordInput from '../../components/common/PasswordInput';
import { FormField } from '../../components/ui';

/**
 * AuthPasswordField — FormField + lock icon + PasswordInput (show/hide), the password row used on
 * Register / ResetPassword / AcceptInvitation / Settings. Works with react-hook-form `register()`
 * (ref is a plain prop in React 19) and with controlled `value`/`onChange`.
 *
 * <AuthPasswordField label={t('auth.password')} error={errors.password?.message} {...register('password')} />
 * Props: label, error, hint, required, icon (default true), className (on the FormField), rest → <input>.
 */
const AuthPasswordField = ({ label, error, hint, required, icon = true, className, ...inputProps }) => (
  <FormField label={label} error={error} hint={hint} required={required} className={className}>
    {(id, describedBy, invalid) => (
      <div className="relative">
        {icon && (
          <Lock
            aria-hidden="true"
            strokeWidth={1.6}
            className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-[1.05rem] w-[1.05rem] -translate-y-1/2 text-ink-subtle"
          />
        )}
        <PasswordInput
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          required={required}
          className={icon ? 'field field-icon' : 'field'}
          {...inputProps}
        />
      </div>
    )}
  </FormField>
);

export default AuthPasswordField;
