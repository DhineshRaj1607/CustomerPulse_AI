import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    setToasts(prev => [...prev, { id: Date.now(), type, message }]);
  }, []);

  useEffect(() => {
    const timers = toasts.map(toastItem => {
      const timeout = window.setTimeout(() => {
        setToasts(prev => prev.filter(item => item.id !== toastItem.id));
      }, 4000);
      return () => window.clearTimeout(timeout);
    });
    return () => timers.forEach(clean => clean());
  }, [toasts]);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`w-80 rounded-xl border px-4 py-3 text-xs font-semibold shadow-premium ${
                item.type === 'success'
                  ? 'bg-white border-success/30 text-success'
                  : item.type === 'error'
                  ? 'bg-white border-danger/30 text-danger'
                  : 'bg-white border-[var(--border)] text-[var(--text-primary)]'
              }`}
            >
              {item.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
