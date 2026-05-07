import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * A reusable, premium select component with standardized design.
 * 
 * @param {Object} props
 * @param {Array} props.options - Array of option objects { label, value }
 * @param {any} props.value - Current selected value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional class names for the container
 * @param {string} props.buttonClassName - Additional class names for the select button
 * @param {string} props.menuClassName - Additional class names for the dropdown menu
 * @param {boolean} props.error - Error state
 */
const Select = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={cn('relative w-full', className)} ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between w-full px-4 py-3 rounded-xl bg-[var(--card)] backdrop-blur-md border transition-all shadow-sm group',
          error ? 'border-red-500/50' : 'border-[var(--border)] focus:border-bordo focus:ring-2 focus:ring-bordo/20',
          buttonClassName
        )}
      >
        <span className={cn(
          'text-sm truncate',
          selectedOption ? 'text-[var(--foreground)] font-medium' : 'text-[var(--muted-foreground)]/40'
        )}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            'text-[var(--muted-foreground)]/40 transition-transform duration-300 group-hover:text-[var(--foreground)]',
            isOpen ? 'rotate-180' : ''
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 mt-2 w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden py-2 backdrop-blur-2xl max-h-60 overflow-y-auto custom-scrollbar',
              menuClassName
            )}
          >
            {options.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex items-center gap-3 w-full px-5 py-3 text-sm transition-all text-left',
                  value === option.value
                    ? 'bg-bordo/10 text-bordo font-semibold'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                )}
              >
                <span className="flex-1 truncate">{option.label}</span>
                {value === option.value && (
                  <Check size={14} className="text-bordo" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Select;
