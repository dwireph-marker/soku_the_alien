import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

export interface ToastProps {
  message?: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
  toasts?: ToastMessage[];
  onDismiss?: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
  toasts,
  onDismiss
}) => {
  useEffect(() => {
    if (message && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  const items: ToastMessage[] = (toasts && toasts.length > 0)
    ? toasts
    : (message ? [{ id: 'single-toast', type, text: message }] : []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[1000] flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-xl border backdrop-blur-md ${
              item.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                : item.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
                : 'bg-stone-900/90 border-stone-700/50 text-stone-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : item.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-stone-400 shrink-0" />
              )}
              <span className="text-sm font-medium">{item.text}</span>
            </div>
            <button
              onClick={() => {
                if (onDismiss) onDismiss(item.id);
                if (onClose) onClose();
              }}
              className="p-1 rounded-lg hover:bg-white/10 text-stone-400 hover:text-stone-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
