import { useEffect, useState } from 'react';

interface DownloadBannerProps {
  /** Called when user dismisses the banner */
  onDismiss: () => void;
  /** Optional message to display */
  message?: string;
}

/** PWA download banner - appears at bottom, auto-hides after 5s, user can dismiss */
export function DownloadBanner({ onDismiss, message = 'Install Callbreak Scorekeeper to your home screen' }: DownloadBannerProps) {
  const [show, setShow] = useState(true);

  // Auto-hide after 5 seconds
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(timer);
  }, [show]);

  if (show === false) return null;

  return (
    <div className="download-banner" aria-live="polite" role="alert">
      <div className="download-banner__content">
        <span className="download-banner__icon" aria-hidden="true" />
        <span className="download-banner__text">{message}</span>
      </div>
      <button
        className="download-banner__close"
        aria-label="Dismiss"
        onClick={onDismiss}
      >
        ×
      </button>
    </div>
  );
}