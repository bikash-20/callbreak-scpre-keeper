import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallState =
  | 'installed'
  | 'can-install'
  | 'ios-instructions'
  | 'unavailable';

export interface UseInstallPromptResult {
  state: InstallState;
  /** Triggers the native install prompt. Returns false if unavailable. */
  install: () => Promise<boolean>;
  dismiss: () => void;
  dismissed: boolean;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (
    window.navigator as Navigator & { standalone?: boolean }
  ).standalone;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    iosStandalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes('Macintosh') && 'ontouchend' in document)
  );
}

/**
 * Handles PWA installation.
 *
 * Chromium browsers fire `beforeinstallprompt`, which we capture so we can
 * offer our own Install button. iOS Safari never fires that event, so there
 * we show "Add to Home Screen" instructions instead.
 */
export function useInstallPrompt(): UseInstallPromptResult {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  const dismiss = useCallback(() => setDismissed(true), []);

  let state: InstallState = 'unavailable';
  if (isStandalone()) {
    state = 'installed';
  } else if (deferredPrompt) {
    state = 'can-install';
  } else if (isIos()) {
    state = 'ios-instructions';
  }

  return { state, install, dismiss, dismissed };
}
