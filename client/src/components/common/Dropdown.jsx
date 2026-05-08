import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * A reusable, premium dropdown component with Portal support.
 * Renders the menu via createPortal so it escapes overflow-hidden table wrappers.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.trigger - Custom trigger element
 * @param {string} props.label - Label for the default trigger button
 * @param {React.ReactNode} props.icon - Icon for the default trigger button
 * @param {Array} props.items - Array of item objects { label, value, icon, onClick, active, className }
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
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 200; // approximate min-width
    const menuHeight = items.length * 48 + 16; // approximate

    let top = rect.bottom + 8;
    let left = align === 'right' ? rect.right - menuWidth : rect.left;

    // Clamp to viewport edges
    if (left < 8) left = 8;
    if (left + menuWidth > viewportWidth - 8) left = viewportWidth - menuWidth - 8;
    if (top + menuHeight > viewportHeight - 8) top = rect.top - menuHeight - 8;

    setMenuStyle({ top, left, minWidth: Math.max(menuWidth, rect.width) });
  }, [align, items.length]);

  const handleToggle = () => {
    if (!isOpen) calculatePosition();
    setIsOpen((prev) => !prev);
  };

  // Close on outside click or scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleClose = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => setIsOpen(false);

    document.addEventListener('mousedown', handleClose);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleClose);

    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [isOpen]);

  const menu = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: menuStyle.top,
            left: menuStyle.left,
            minWidth: menuStyle.minWidth,
            zIndex: 9999,
          }}
          className={cn(
            'bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden py-2 backdrop-blur-2xl',
            menuClassName
          )}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                if (item.onClick) item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-all',
                item.active
                  ? 'bg-bordo text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                item.className
              )}
            >
              {item.icon && (
                <span className="flex items-center justify-center shrink-0">{item.icon}</span>
              )}
              <span className="font-semibold whitespace-nowrap">{item.label}</span>
              {item.active && (
                <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              )}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={cn('relative inline-block text-left', className)} ref={triggerRef}>
      {trigger ? (
        <div onClick={handleToggle} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          onClick={handleToggle}
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

      {createPortal(menu, document.body)}
    </div>
  );
};

export default Dropdown;
