import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EdelweissGlyph } from '../ornament/Edelweiss';

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
    <>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: menuStyle.top,
            left: menuStyle.left,
            minWidth: menuStyle.minWidth,
            zIndex: 9999,
          }}
          role="menu"
          className={cn('menu-panel orn-pop overflow-hidden origin-top', menuClassName)}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              role="menuitem"
              onClick={() => {
                if (item.onClick) item.onClick();
                setIsOpen(false);
              }}
              className={cn('menu-item', item.active && 'is-active', item.className)}
            >
              {item.icon && (
                <span className="flex items-center justify-center shrink-0">{item.icon}</span>
              )}
              <span className="whitespace-nowrap">{item.label}</span>
              {item.active && <EdelweissGlyph className="ml-auto h-3.5 w-3.5 text-current" />}
            </button>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className={cn('relative inline-block text-left', className)} ref={triggerRef}>
      {trigger ? (
        <div onClick={handleToggle} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleToggle}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-line-strong bg-surface text-ink-muted hover:text-ink hover:border-ornament-soft transition-colors',
            buttonClassName
          )}
        >
          {icon && <span className="flex items-center justify-center">{icon}</span>}
          {label && <span className="sc text-[0.85rem]">{label}</span>}
          <ChevronDown
            size={15}
            strokeWidth={1.6}
            className={cn('transition-transform duration-[var(--dur-2)]', isOpen ? 'rotate-180' : '')}
          />
        </button>
      )}

      {createPortal(menu, document.body)}
    </div>
  );
};

export default Dropdown;
