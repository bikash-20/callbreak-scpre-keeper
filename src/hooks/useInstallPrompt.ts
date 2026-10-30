import { useCallback, useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallState =
  | 'installed'
  | 'can-install'
  | 'ios-instructions'
  | 'unavailable';

export const BANNER_STORAGE_KEY = 'cb_pwa_banner_dismissed';

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of promptListeners) {
    try {
      listener();
    } catch {
      // ignore callback error
    }
  }
}

// Global capture so we never miss beforeinstallprompt if it fires before React mount
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Prevent the mini-infobar on mobile
    event.preventDefault();
    globalDeferredPrompt = event as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    try {
      localStorage.setItem(BANNER_STORAGE_KEY, 'true');
    } catch {
      // ignore storage error
    }
    notifyListeners();
  });
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (
    window.navigator as Navigator & { standalone?: boolean }
  ).standalone;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    iosStandalone === true
  );
}

export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes('Macintosh') && 'ontouchend' in document)
  );
}

export interface UseInstallPromptResult {
  state: InstallState;
  /** Triggers the native install prompt. Returns true if accepted, false otherwise. */
  install: () => Promise<boolean>;
  dismiss: () => void;
  showBanner: () => void;
  dismissed: boolean;
  isStandalone: boolean;
}

export function useInstallPrompt(): UseInstallPromptResult {
  const [promptAvailable, setPromptAvailable] = useState<boolean>(() =>
    Boolean(globalDeferredPrompt),
  );
  const [standalone, setStandalone] = useState<boolean>(isStandalone);
  const [dismissed, setDismissedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(BANNER_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handlePromptChange = () => {
      setPromptAvailable(Boolean(globalDeferredPrompt));
      setStandalone(isStandalone());
    };

    promptListeners.add(handlePromptChange);

    const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setStandalone(e.matches);
    };
    mediaQuery?.addEventListener?.('change', handleMediaChange);

    return () => {
      promptListeners.delete(handlePromptChange);
      mediaQuery?.removeEventListener?.('change', handleMediaChange);
    };
  }, []);

  const dismiss = useCallback(() => {
    setDismissedState(true);
    try {
      localStorage.setItem(BANNER_STORAGE_KEY, 'true');
    } catch {
      // ignore storage error
    }
  }, []);

  const showBanner = useCallback(() => {
    setDismissedState(false);
    try {
      localStorage.setItem(BANNER_STORAGE_KEY, 'false');
    } catch {
      // ignore storage error
    }
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!globalDeferredPrompt) {
      return false;
    }
    try {
      await globalDeferredPrompt.prompt();
      const { outcome } = await globalDeferredPrompt.userChoice;
      if (outcome === 'accepted') {
        globalDeferredPrompt = null;
        setPromptAvailable(false);
        dismiss();
        return true;
      }
      return false;
    } catch (err) {
      console.error('PWA install prompt execution error:', err);
      return false;
    }
  }, [dismiss]);

  let state: InstallState = 'unavailable';
  if (standalone) {
    state = 'installed';
  } else if (promptAvailable) {
    state = 'can-install';
  } else if (isIos()) {
    state = 'ios-instructions';
  }

  return {
    state,
    install,
    dismiss,
    showBanner,
    dismissed,
    isStandalone: standalone,
  };
}
