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
 * Closes on Escape and backdrop click; locks body scroll; focuses the panel on open.
 * On < 640px it becomes a bottom sheet (full width, rounded top).
 *
 * <Modal open={open} onClose={() => setOpen(false)} title={t('groups.create')} subtitle={t('groups.createHint')}
 *        footer={<><Button variant="ghost" onClick={close}>{t('common.cancel')}</Button><Button type="submit" form="group-form">{t('common.save')}</Button></>}>
 *   <form id="group-form" onSubmit={…}>…</form>
 * </Modal>
 * Props: open, onClose, title, subtitle, children, footer, size 'sm'|'md'|'lg'|'xl', className.
 */
const SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

const Modal = ({ open, onClose, title, subtitle, children, footer, size = 'md', className }) => {
  const { t } = useTranslation();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

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
            aria-label={typeof title === 'string' ? title : undefined}
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
                <ScriptTitle as="h2" size="card" align="center" title={title} subtitle={subtitle} />
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
