import { AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EdelweissGlyph } from '../ornament/Edelweiss';
import Spinner from '../common/Spinner';

/**
 * Button — small-caps label, pill shape.
 *
 * variant:
 *   'primary'  solid #5C000E, the main action of a view (one per area)
 *   'outline'  outline pill with the edelweiss motif at the end (secondary CTA, reference style)
 *   'ghost'    quiet text button (toolbar, cancel)
 *   'danger'   destructive: heavy outline + alert icon (meaning carried by icon + weight, not colour)
 * size: 'sm' | 'md' | 'lg';  block: full width;  icon: lucide component on the left;
 * iconOnly: square icon button (pass aria-label);  motif: force/hide the edelweiss (default on for outline);
 * loading: shows a spinner and disables;  as: render another element/component (e.g. as={Link} to="/x").
 *
 * <Button onClick={save}>Yadda saxla</Button>
 * <Button variant="outline" as={Link} to="/courses">Bütün kurslar</Button>
 * <Button variant="danger" icon={Trash2} size="sm">Sil</Button>
 * <Button variant="ghost" iconOnly icon={X} aria-label={t('common.close')} />
 */
const Button = ({
  as: Comp = 'button',
  variant = 'primary',
  size = 'md',
  block = false,
  icon: Icon,
  iconOnly = false,
  motif,
  loading = false,
  disabled,
  className,
  children,
  type,
  ...rest
}) => {
  const showMotif = motif ?? (variant === 'outline' && !iconOnly);
  const LeadIcon = variant === 'danger' && !Icon ? AlertTriangle : Icon;
  const iconSize = size === 'sm' ? 15 : size === 'lg' ? 19 : 17;
  const isButton = Comp === 'button';

  return (
    <Comp
      type={isButton ? type || 'button' : type}
      disabled={isButton ? disabled || loading : undefined}
      aria-disabled={!isButton && (disabled || loading) ? true : undefined}
      aria-busy={loading || undefined}
      className={cn(
        'btn',
        `btn-${variant}`,
        size !== 'md' && `btn-${size}`,
        block && 'btn-block',
        iconOnly && 'btn-icon',
        className
      )}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" color={variant === 'primary' ? 'onAccent' : 'accent'} />
      ) : (
        LeadIcon && <LeadIcon size={iconSize} strokeWidth={1.6} aria-hidden="true" />
      )}
      {!iconOnly && children}
      {showMotif && !loading && <EdelweissGlyph className="btn-motif text-current" />}
    </Comp>
  );
};

export default Button;
