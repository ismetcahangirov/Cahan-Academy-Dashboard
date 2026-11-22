import { useState, useRef, useEffect, useCallback, cloneElement, isValidElement } from 'react';
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
 * Keyboard: opening moves focus to the first item; ArrowUp/ArrowDown/Home/End move between items;
 * Escape (or Tab) closes and returns focus to the trigger.
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
  const menuRef = useRef(null);

  const focusTrigger = () => triggerRef.current?.querySelector('button, [tabindex]')?.focus();
  const onMenuKeyDown = (e) => {
    const list = [...(menuRef.current?.querySelectorAll('[role="menuitem"]') || [])];
    const i = list.indexOf(document.activeElement);
    const move = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: list.length - 1 }[e.key];
    if (move !== undefined && list.length) {
      e.preventDefault();
      list[(move + list.length) % list.length].focus();
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      if (e.key === 'Escape') e.preventDefault();
      setIsOpen(false);
      focusTrigger();
    }
  };

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
    const handleScroll = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setIsOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        focusTrigger();
      }
    };
    // focus the first item (the ring only shows for keyboard users: :focus-visible)
    requestAnimationFrame(() => menuRef.current?.querySelector('[role="menuitem"]')?.focus({ preventScroll: true }));

    document.addEventListener('mousedown', handleClose);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleClose);

    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('keydown', handleKey);
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
          ref={menuRef}
          role="menu"
          onKeyDown={onMenuKeyDown}
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
          {isValidElement(trigger) ? cloneElement(trigger, { 'aria-haspopup': 'menu', 'aria-expanded': isOpen }) : trigger}
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
