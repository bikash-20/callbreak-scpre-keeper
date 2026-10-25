import { useEffect, useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

interface DownloadBannerProps {
  /** Called when user dismisses the banner */
  onDismiss: () => void;
  /** Optional message to display */
  message?: string;
}

/** PWA download banner - shows install prompt for supported browsers */
export function DownloadBanner({ onDismiss, message = 'Install Callbreak Scorekeeper' }: DownloadBannerProps) {
  const { state, install, dismiss } = useInstallPrompt();
  const [show, setShow] = useState(true);
  const [installing, setInstalling] = useState(false);

  // Don't show if already installed
  useEffect(() => {
    if (state === 'installed') {
      setShow(false);
    }
  }, [state]);

  const handleInstall = async () => {
    if (state === 'can-install') {
      setInstalling(true);
      try {
        const accepted = await install();
        if (accepted) {
          setShow(false);
        }
      } catch (error) {
        console.error('Install failed:', error);
      } finally {
        setInstalling(false);
      }
    }
  };

  const handleDismiss = () => {
    dismiss();
    onDismiss();
    setShow(false);
  };

  // Show banner if not installed and not dismissed by user action
  if (!show || state === 'installed') {
    return null;
  }

  // In dev mode or if no prompt available, still show a manual install message
  const showInstallButton = state === 'can-install';
  const showIosMessage = state === 'ios-instructions';
  const showManualMessage = state === 'unavailable';

  return (
    <div className="download-banner" aria-live="polite" role="alert">
      <div className="download-banner__content">
        <span className="download-banner__icon" aria-hidden="true">📱</span>
        <div className="download-banner__text-group">
          <span className="download-banner__title">{message}</span>
          {showIosMessage && (
            <span className="download-banner__subtitle">
              Tap Share → Add to Home Screen
            </span>
          )}
          {showManualMessage && (
            <span className="download-banner__subtitle">
              Use browser menu to install
            </span>
          )}
        </div>
      </div>
      <div className="download-banner__actions">
        {showInstallButton && (
          <button
            className="download-banner__install"
            onClick={handleInstall}
            disabled={installing}
            aria-label="Install app"
          >
            {installing ? 'Installing...' : 'Install'}
          </button>
        )}
        <button
          className="download-banner__close"
          aria-label="Dismiss"
          onClick={handleDismiss}
        >
          ×
        </button>
      </div>
    </div>
  );
}