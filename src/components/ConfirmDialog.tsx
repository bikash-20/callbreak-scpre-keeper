import { useState } from 'react';
import { Modal } from './Modal';
import { useLanguage } from '../LanguageContext';

interface ConfirmDialogProps {
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in the destructive style. */
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * A confirmation dialog. The confirm action may be async; the button is
 * disabled while it runs so a double tap cannot fire it twice.
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

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
      {body}
    </Modal>
  );
}
