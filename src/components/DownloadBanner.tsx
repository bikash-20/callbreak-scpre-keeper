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

  // Don't show if already installed or unavailable
  useEffect(() => {
    if (state === 'installed' || state === 'unavailable') {
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

  if (!show || state === 'installed' || state === 'unavailable') {
    return null;
  }

  return (
    <div className="download-banner" aria-live="polite" role="alert">
      <div className="download-banner__content">
        <span className="download-banner__icon" aria-hidden="true">📱</span>
        <div className="download-banner__text-group">
          <span className="download-banner__title">{message}</span>
          {state === 'ios-instructions' && (
            <span className="download-banner__subtitle">
              Tap Share → Add to Home Screen
            </span>
          )}
        </div>
      </div>
      <div className="download-banner__actions">
        {state === 'can-install' && (
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