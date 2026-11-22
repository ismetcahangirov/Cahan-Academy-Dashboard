import { Children, cloneElement, isValidElement, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Form fields. Inputs use the serif body face (never script), tokens for every colour, a 3px
 * soft focus halo and a 1.5px border + alert icon for errors (no red).
 *
 * <FormField label={t('auth.email')} error={errors.email?.message} hint="…">
 *   {(id, describedBy) => <Input id={id} aria-describedby={describedBy} icon={Mail} {...register('email')} />}
 * </FormField>
 * FormField also accepts a plain child: a single <Input>/<Textarea>/<NativeSelect> (or native input/textarea/
 * select) gets the label's id and aria-describedby automatically; for anything else pass `htmlFor` yourself.
 * <Input icon={Search} placeholder="…" />   <Textarea rows={4} />   <NativeSelect>…<option/></NativeSelect>
 * <Checkbox label="Yadda saxla" />  (also .check on a raw input)
 * Classes for raw elements: .field, .field-label, .field-hint, .field-error, .check
 */
// Wire a plain single field child to the label (id) and to the hint/error (aria-describedby).
const LABELLABLE = new Set(['input', 'textarea', 'select']);
const isFieldChild = (children) =>
  typeof children !== 'function' &&
  Children.count(children) === 1 &&
  isValidElement(children) &&
  (LABELLABLE.has(children.type) || children.type === Input || children.type === Textarea || children.type === NativeSelect);
const linkChild = (children, id, describedBy, error) => {
  if (!isFieldChild(children)) return children;
  const { type, props } = children;
  return cloneElement(children, {
    id,
    'aria-describedby': [props['aria-describedby'], describedBy].filter(Boolean).join(' ') || undefined,
    ...(error && type !== 'input' && type !== 'textarea' && type !== 'select' ? { invalid: props.invalid ?? true } : null),
  });
};

export const FormField = ({ label, hint, error, required, htmlFor, className, children }) => {
  const autoId = useId();
  const id = htmlFor || (isFieldChild(children) && children.props.id) || autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('min-w-0', className)}>
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      {typeof children === 'function' ? children(id, describedBy, Boolean(error)) : linkChild(children, id, describedBy, error)}
      {hint && !error && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error" role="alert">
          <AlertCircle aria-hidden="true" strokeWidth={2} />
          {error}
        </p>
      )}
    </div>
  );
};

export const Input = ({ icon: Icon, invalid, className, wrapperClassName, ref, ...props }) => {
  const input = (
    <input
      ref={ref}
      aria-invalid={invalid || props['aria-invalid'] || undefined}
      className={cn('field', Icon && 'field-icon', className)}
      {...props}
    />
  );
  if (!Icon) return input;
  return (
    <div className={cn('relative', wrapperClassName)}>
      <Icon
        aria-hidden="true"
        strokeWidth={1.6}
        className="pointer-events-none absolute left-3.5 top-1/2 h-[1.05rem] w-[1.05rem] -translate-y-1/2 text-ink-subtle"
      />
      {input}
    </div>
  );
};

export const Textarea = ({ invalid, className, ref, ...props }) => (
  <textarea ref={ref} aria-invalid={invalid || undefined} className={cn('field', className)} {...props} />
);

export const NativeSelect = ({ invalid, className, ref, children, ...props }) => (
  <select ref={ref} aria-invalid={invalid || undefined} className={cn('field', className)} {...props}>
    {children}
  </select>
);

export const Checkbox = ({ label, className, ref, ...props }) => (
  <label className={cn('inline-flex cursor-pointer items-center gap-2.5 text-[0.95rem] text-ink', className)}>
    <input ref={ref} type="checkbox" className="check" {...props} />
    {label}
  </label>
);

export default FormField;
