import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Rendered in the footer area, before the close button. */
  actions?: ReactNode;
  /** Hide the header close button when the content provides its own actions. */
  hideClose?: boolean;
}

/**
 * A modal dialog. Traps focus loosely (moves focus in on open, restores it on
 * close), closes on Escape, and locks body scroll while open.
 */
export function Modal({ title, children, onClose, actions, hideClose }: ModalProps) {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog.
    const timer = window.setTimeout(() => {
      const focusable = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previousFocus.current?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={dialogRef}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <h2 className="modal__title">{title}</h2>
          {!hideClose && (
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              aria-label={t('Close dialog')}
              style={{ marginTop: -8, marginRight: -8 }}
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div className="modal__body">{children}</div>
        {actions && <div className="modal__actions">{actions}</div>}
      </div>
    </div>
  );
}
