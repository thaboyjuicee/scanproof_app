import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type ToastVariant = 'success' | 'info' | 'error';

interface ToastPayload {
  title: string;
  message?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastState {
  id: number;
  title: string;
  message?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (payload: ToastPayload) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((payload: ToastPayload) => {
    const durationMs = payload.durationMs ?? 2200;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({
      id: Date.now(),
      title: payload.title,
      message: payload.message,
      variant: payload.variant ?? 'info',
    });

    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const contextValue = useMemo<ToastContextValue>(() => ({
    showToast,
  }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={styles.viewport}>
          <View style={[styles.toast, toast.variant === 'success' ? styles.toastSuccess : toast.variant === 'error' ? styles.toastError : styles.toastInfo]}>
            <Text style={styles.toastTitle}>{toast.title}</Text>
            {toast.message ? <Text style={styles.toastMessage}>{toast.message}</Text> : null}
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }

  return context;
};

const styles = StyleSheet.create({
  viewport: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  toast: {
    width: '100%',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  toastSuccess: {
    backgroundColor: '#ecfdf5',
    borderColor: '#86efac',
  },
  toastInfo: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  toastError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  toastTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  toastMessage: {
    marginTop: 2,
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },
});
