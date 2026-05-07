import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * A reusable, premium dropdown component with standard design.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.trigger - Custom trigger element (optional, replaces default button)
 * @param {string} props.label - Label for the default trigger button
 * @param {React.ReactNode} props.icon - Icon for the default trigger button
 * @param {Array} props.items - Array of item objects { label, value, icon, onClick, active }
 * @param {string} props.className - Additional class names for the container
 * @param {string} props.buttonClassName - Additional class names for the trigger button
 * @param {string} props.menuClassName - Additional class names for the dropdown menu
 * @param {string} props.align - Alignment of the menu: 'left' or 'right'
 */
const Dropdown = ({
  trigger,
  label,
  icon,
  items = [],
  className = '',
  buttonClassName = '',
  menuClassName = '',
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">{trigger}</div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--card)] backdrop-blur-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all shadow-lg',
            buttonClassName
          )}
        >
          {icon && <span className="flex items-center justify-center">{icon}</span>}
          {label && <span className="text-sm font-bold uppercase tracking-wider">{label}</span>}
          <ChevronDown
            size={16}
            className={cn('transition-transform duration-300', isOpen ? 'rotate-180' : '')}
          />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 mt-2 w-48 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden py-2 backdrop-blur-2xl',
              align === 'right' ? 'right-0' : 'left-0',
              menuClassName
            )}
          >
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  'flex items-center gap-4 w-full px-5 py-3 text-sm transition-all',
                  item.active
                    ? 'bg-bordo text-white'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                  item.className
                )}
              >
                {item.icon && <span className="text-xl flex items-center justify-center">{item.icon}</span>}
                <span className="font-semibold">{item.label}</span>
                {item.active && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown;
