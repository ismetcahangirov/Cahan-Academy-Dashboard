import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EdelweissGlyph } from '../ornament/Edelweiss';

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
 * Other props (aria-label, id, aria-describedby …) go to the trigger button.
 * Keyboard: opening focuses the selected (or first) option; ArrowUp/ArrowDown/Home/End move;
 * Enter/Space pick; Escape closes (without closing a surrounding Modal); Tab closes and moves on.
 */
const Select = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  error = false,
  ...buttonProps
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const selectRef = useRef(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const onMenuKeyDown = (e) => {
    const list = [...(menuRef.current?.querySelectorAll('[role="option"]') || [])];
    const i = list.indexOf(document.activeElement);
    const move = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: list.length - 1 }[e.key];
    if (move !== undefined && list.length) {
      e.preventDefault();
      list[(move + list.length) % list.length].focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation(); // the Escape belongs to the listbox, not to a Modal around it
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === 'Tab') {
      e.stopPropagation();
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  const calculatePosition = useCallback(() => {
    if (!selectRef.current) return;

    const rect = selectRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 8;
    const minMargin = 8;
    const preferredHeight = 240;
    const spaceBelow = viewportHeight - rect.bottom - gap - minMargin;
    const spaceAbove = rect.top - gap - minMargin;
    const openAbove = spaceBelow < 160 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, Math.min(preferredHeight, openAbove ? spaceAbove : spaceBelow));

    let left = rect.left;
    if (left + rect.width > viewportWidth - minMargin) {
      left = viewportWidth - rect.width - minMargin;
    }
    if (left < minMargin) left = minMargin;

    setMenuStyle({
      position: 'fixed',
      top: openAbove ? rect.top - gap - maxHeight : rect.bottom + gap,
      left,
      width: Math.max(rect.width, 160),
      maxHeight,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    calculatePosition();

    const handleViewportChange = () => {
      setIsOpen(false);
    };

    const handleScroll = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      handleViewportChange();
    };
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleViewportChange);
    // focus the selected option (ring only for keyboard users via :focus-visible)
    const raf = requestAnimationFrame(() => {
      const opts = menuRef.current?.querySelectorAll('[role="option"]');
      const sel = menuRef.current?.querySelector('[aria-selected="true"]');
      (sel || opts?.[0])?.focus({ preventScroll: false });
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [calculatePosition, isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  const menu = (
    <>
      {isOpen && (
        <div
          ref={menuRef}
          style={menuStyle}
          role="listbox"
          onKeyDown={onMenuKeyDown}
          className={cn('menu-panel orn-pop origin-top overflow-y-auto custom-scrollbar', menuClassName)}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              role="option"
              aria-selected={value === option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
                buttonRef.current?.focus({ preventScroll: true });
              }}
              className="menu-item"
            >
              <span className="flex-1 truncate">{option.label}</span>
              {value === option.value && <EdelweissGlyph className="h-3.5 w-3.5 text-current" />}
            </button>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className={cn('relative w-full', className)} ref={selectRef}>
      <button
        {...buttonProps}
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!isOpen) calculatePosition();
          setIsOpen(!isOpen);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={error || undefined}
        className={cn(
          'field flex items-center justify-between gap-2 text-left group',
          error && 'is-invalid',
          buttonClassName
        )}
      >
        <span className={cn('truncate', selectedOption ? 'text-ink' : 'text-ink-subtle')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.6}
          className={cn(
            'shrink-0 text-accent-text transition-transform duration-[var(--dur-2)]',
            isOpen ? 'rotate-180' : ''
          )}
        />
      </button>

      {createPortal(menu, document.body)}
    </div>
  );
};

export default Select;
