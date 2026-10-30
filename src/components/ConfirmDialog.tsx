import { useState } from 'react';
import { Modal } from './Modal';
import { useLanguage } from '../LanguageContext';

interface ConfirmDialogProps {
  /** If provided and false, dialog will not render */
  open?: boolean;
  title: string;
  body?: React.ReactNode;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in the destructive style. */
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * A robust confirmation dialog supporting both conditional render and `open` flag.
 */
export function ConfirmDialog({
  open = true,
  title,
  body,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  const content = body ?? message;

  return (
    <Modal
      title={title}
      onClose={busy ? () => undefined : onCancel}
      actions={
        <>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onCancel}
            disabled={busy}
          >
            {t(cancelLabel)}
          </button>
          <button
            type="button"
            className={`btn ${destructive ? 'btn--danger' : 'btn--primary'}`}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? t('Working…') : t(confirmLabel)}
          </button>
        </>
      }
    >
      {content}
    </Modal>
  );
}
