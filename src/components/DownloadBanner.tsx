import { useEffect, useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useLanguage } from '../LanguageContext';

interface DownloadBannerProps {
  /** Called when user dismisses the banner */
  onDismiss?: () => void;
  /** Optional message to display */
  message?: string;
  /** Optional flag to suppress rendering on specific screens (e.g. round-entry) */
  disabled?: boolean;
}

/**
 * PWA installation banner.
 *
 * Provides native installation via Chromium `beforeinstallprompt` prompt,
 * and clear, visual step-by-step guidance on iOS Safari and other browsers.
 */
export function DownloadBanner({
  onDismiss,
  message,
  disabled = false,
}: DownloadBannerProps) {
  const { state, install, dismiss, dismissed } = useInstallPrompt();
  const { t } = useLanguage();
  const [installing, setInstalling] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Close instructions modal on Escape key
  useEffect(() => {
    if (!showInstructions) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowInstructions(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInstructions]);

  if (disabled || dismissed || state === 'installed') {
    return null;
  }

  const handleInstall = async () => {
    if (state === 'can-install') {
      setInstalling(true);
      try {
        const accepted = await install();
        if (accepted) {
          onDismiss?.();
        }
      } catch (error) {
        console.error('Install execution failed:', error);
      } finally {
        setInstalling(false);
      }
    } else {
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    dismiss();
    onDismiss?.();
  };

  const bannerTitle = message ?? t('Install Callbreak Scorekeeper');
  const bannerSubtitle =
    state === 'ios-instructions'
      ? t('Add to your home screen')
      : state === 'can-install'
        ? t('Quick install available')
        : t('Install as app');

  return (
    <>
      <div
        className="download-banner"
        role="region"
        aria-label={t('App Installation')}
      >
        <div className="download-banner__content">
          <span className="download-banner__icon" aria-hidden="true">
            <Smartphone size={20} />
          </span>
          <div className="download-banner__text-group">
            <span className="download-banner__title">{bannerTitle}</span>
            <span className="download-banner__subtitle">{bannerSubtitle}</span>
          </div>
        </div>
        <div className="download-banner__actions">
          <button
            type="button"
            className="download-banner__install"
            onClick={handleInstall}
            disabled={installing}
            aria-label={t('Install App')}
          >
            <Download size={15} aria-hidden="true" />
            <span>{installing ? t('Working…') : t('Install')}</span>
          </button>
          <button
            type="button"
            className="download-banner__close"
            aria-label={t('Close dialog')}
            onClick={handleDismiss}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {showInstructions && (
        <div
          className="install-instructions"
          onClick={() => setShowInstructions(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-modal-title"
        >
          <div
            className="install-instructions__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="install-instructions__header">
              <h3 id="install-modal-title">{t('Install App')}</h3>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                aria-label={t('Close dialog')}
              >
                <X size={20} />
              </button>
            </div>
            <div className="install-instructions__content">
              {state === 'ios-instructions' ? (
                <>
                  <p>
                    <strong>{t('On iOS Safari:')}</strong>
                  </p>
                  <ol>
                    <li>
                      {t('Tap the Share button')} (
                      <Share size={14} style={{ verticalAlign: 'middle' }} />)
                    </li>
                    <li>{t('Scroll down and tap "Add to Home Screen"')}</li>
                    <li>{t('Tap "Add" in the top right corner')}</li>
                  </ol>
                </>
              ) : (
                <>
                  <p>
                    <strong>{t('On Chrome/Edge:')}</strong>
                  </p>
                  <ol>
                    <li>{t('Click the menu (3 dots) in the top right')}</li>
                    <li>
                      {t(
                        'Click "Install Callbreak Scorekeeper..." or "Add to Home screen"',
                      )}
                    </li>
                    <li>{t('Click "Install"')}</li>
                  </ol>
                  <p>
                    <strong>{t('On Firefox:')}</strong>
                  </p>
                  <ol>
                    <li>{t('Click the menu (3 lines)')}</li>
                    <li>{t('Click "Install" or "Add to Home Screen"')}</li>
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
