import { cn } from '../../lib/utils';

const sizeClasses = {
  sm: 'h-5 w-5 border-t-2 border-b-2',
  md: 'h-8 w-8 border-t-2 border-b-2',
  lg: 'h-12 w-12 border-t-2 border-b-2',
};

const colorClasses = {
  bordo: 'border-bordo',
  white: 'border-white',
};

const Spinner = ({ size = 'lg', color = 'bordo', className = '' }) => (
  <div
    className={cn(
      'animate-spin rounded-full',
      sizeClasses[size] || sizeClasses.lg,
      colorClasses[color] || colorClasses.bordo,
      className
    )}
  />
);

export default Spinner;
