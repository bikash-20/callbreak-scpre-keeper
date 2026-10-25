import { useEffect, useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

interface DownloadBannerProps {
  /** Called when user dismisses the banner */
  onDismiss: () => void;
  /** Optional message to display */
  message?: string;
}

/** PWA download banner - shows install prompt */
export function DownloadBanner({ onDismiss, message = 'Install Callbreak Scorekeeper' }: DownloadBannerProps) {
  const { state, install, dismiss } = useInstallPrompt();
  const [show, setShow] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

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
    } else if (state === 'ios-instructions') {
      setShowInstructions(true);
    } else {
      // For other browsers, show instructions
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    dismiss();
    onDismiss();
    setShow(false);
  };

  // Always show banner if not installed
  if (!show || state === 'installed') {
    return null;
  }

  return (
    <>
      <div className="download-banner" aria-live="polite" role="alert">
        <div className="download-banner__content">
          <span className="download-banner__icon" aria-hidden="true">📱</span>
          <div className="download-banner__text-group">
            <span className="download-banner__title">{message}</span>
            <span className="download-banner__subtitle">
              {state === 'ios-instructions' 
                ? 'Add to your home screen' 
                : state === 'can-install'
                ? 'Quick install available'
                : 'Install as app' 
              }
            </span>
          </div>
        </div>
        <div className="download-banner__actions">
          <button
            className="download-banner__install"
            onClick={handleInstall}
            disabled={installing}
            aria-label="Install app"
          >
            {installing ? 'Installing...' : 'Install'}
          </button>
          <button
            className="download-banner__close"
            aria-label="Dismiss"
            onClick={handleDismiss}
          >
            ×
          </button>
        </div>
      </div>
      
      {showInstructions && (
        <div className="install-instructions" onClick={() => setShowInstructions(false)}>
          <div className="install-instructions__modal" onClick={(e) => e.stopPropagation()}>
            <div className="install-instructions__header">
              <h3>Install App</h3>
              <button onClick={() => setShowInstructions(false)} aria-label="Close">×</button>
            </div>
            <div className="install-instructions__content">
              {state === 'ios-instructions' ? (
                <>
                  <p><strong>On iOS Safari:</strong></p>
                  <ol>
                    <li>Tap the Share button <span style={{fontSize: '1.2em'}}>⋮</span></li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" in the top right corner</li>
                  </ol>
                </>
              ) : (
                <>
                  <p><strong>On Chrome/Edge:</strong></p>
                  <ol>
                    <li>Click the menu (3 dots) in the top right</li>
                    <li>Click "Install Callbreak Scorekeeper..." or "Add to Home screen"</li>
                    <li>Click "Install"</li>
                  </ol>
                  <p><strong>On Firefox:</strong></p>
                  <ol>
                    <li>Click the menu (3 lines)</li>
                    <li>Click "Install" or "Add to Home Screen"</li>
                  </ol>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}