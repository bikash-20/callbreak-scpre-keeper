import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { darkTokens, lightTokens, type TokenShape } from './tokens';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'cb_theme';

interface ThemeContextValue {
  mode: ThemeMode;
  tokens: TokenShape;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemeMode | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch {
    // Storage unavailable (private mode) — fall back to the system setting.
  }
  return null;
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = readStoredMode();
    if (stored) return stored;
    return systemPrefersDark() ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = mode;
    root.style.colorScheme = mode;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Non-fatal: the preference just will not survive a reload.
    }
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);
  const toggle = useCallback(
    () => setModeState((current) => (current === 'light' ? 'dark' : 'light')),
    [],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      tokens: mode === 'dark' ? darkTokens : lightTokens,
      setMode,
      toggle,
    }),
    [mode, setMode, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return context;
}
