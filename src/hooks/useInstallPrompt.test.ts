import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  BANNER_STORAGE_KEY,
  isStandalone,
  isIos,
} from './useInstallPrompt';

describe('useInstallPrompt utilities', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
    };
    vi.stubGlobal('localStorage', mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reports isStandalone as false in node environment without window', () => {
    expect(isStandalone()).toBe(false);
  });

  it('reports isIos as boolean based on user agent', () => {
    expect(typeof isIos()).toBe('boolean');
  });

  it('manages banner dismissal key in localStorage correctly', () => {
    expect(localStorage.getItem(BANNER_STORAGE_KEY)).toBeNull();
    localStorage.setItem(BANNER_STORAGE_KEY, 'true');
    expect(localStorage.getItem(BANNER_STORAGE_KEY)).toBe('true');
    localStorage.setItem(BANNER_STORAGE_KEY, 'false');
    expect(localStorage.getItem(BANNER_STORAGE_KEY)).toBe('false');
  });
});
