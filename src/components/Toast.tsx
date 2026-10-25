import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export type ToastVariant = 'info' | 'success' | 'error';

export interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss. `0` keeps it until dismissed. */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastEntry extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current;
      nextId.current += 1;
      const entry: ToastEntry = { id, duration: 4000, ...options };
      setToasts((current) => [...current, entry]);
      if (entry.duration && entry.duration > 0) {
        window.setTimeout(() => dismiss(id), entry.duration);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.variant ?? 'info'];
          return (
            <div
              key={toast.id}
              className={`toast${toast.variant && toast.variant !== 'info' ? ` toast--${toast.variant}` : ''}`}
            >
              <Icon size={18} style={{ flex: '0 0 auto' }} />
              <span style={{ flex: 1 }}>{t(toast.message)}</span>
              {toast.action && (
                <button
                  type="button"
                  className="toast__action"
                  onClick={() => {
                    toast.action?.onClick();
                    dismiss(toast.id);
                  }}
                >
                  {t(toast.action.label)}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a ToastProvider');
  }
  return context;
}
