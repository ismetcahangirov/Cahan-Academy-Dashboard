import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { backdropVariants, modalVariants } from '../../lib/motion';
import ScriptTitle from '../ornament/ScriptTitle';

/**
 * Modal — framed dialog (outer border + inner hairline), script title + divider, scale .98 -> 1 + fade.
 * Closes on Escape and backdrop click; locks body scroll; focuses the panel on open, keeps Tab /
 * Shift+Tab inside the panel and gives focus back to the opener on close.
 * On < 640px it becomes a bottom sheet (full width, rounded top).
 *
 * <Modal open={open} onClose={() => setOpen(false)} title={t('groups.create')} subtitle={t('groups.createHint')}
 *        footer={<><Button variant="ghost" onClick={close}>{t('common.cancel')}</Button><Button type="submit" form="group-form">{t('common.save')}</Button></>}>
 *   <form id="group-form" onSubmit={…}>…</form>
 * </Modal>
 * Props: open, onClose, title (short fixed phrase, script), entity (the exam/quiz/group/person the dialog is
 * about, serif), subtitle, children, footer, size 'sm'|'md'|'lg'|'xl', className.
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

const Modal = ({ open, onClose, title, entity, subtitle, children, footer, size = 'md', className }) => {
  const { t } = useTranslation();
  const panelRef = useRef(null);
  // latest onClose without re-running the open effect (callers often pass inline functions;
  // re-running it would steal focus from the field being typed in)
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    const onKey = (e) => {
      const panel = panelRef.current;
      // a nested dialog opened on top owns the keyboard
      if (!panel || (document.activeElement && !panel.contains(document.activeElement) && document.activeElement.closest('[role="dialog"]'))) return;
      if (e.key === 'Escape') {
        onCloseRef.current?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      // give focus back to whatever opened the dialog (if it is still in the page)
      if (opener && opener instanceof HTMLElement && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="modal-backdrop"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? [title, typeof entity === 'string' ? entity : null].filter(Boolean).join(': ') : undefined}
            tabIndex={-1}
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'modal-panel relative z-[61] flex max-h-[92vh] w-full flex-col outline-none',
              'rounded-b-none sm:rounded-b-[var(--radius-xl)]',
              SIZES[size] || SIZES.md,
              className
            )}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="btn btn-ghost btn-icon btn-sm absolute right-4 top-4 z-10"
            >
              <X size={17} strokeWidth={1.6} />
            </button>
            {title && (
              <div className="px-6 pb-2 pt-7 sm:px-8">
                <ScriptTitle as="h2" size="card" align="center" title={title} entity={entity} subtitle={subtitle} />
              </div>
            )}
            <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-4 sm:px-8">{children}</div>
            {footer && (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line-hair px-6 py-4 sm:px-8">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
