import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export type ConfirmVariant = 'primary' | 'danger' | 'warning';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

type ResolveFn = (value: boolean) => void;

interface ConfirmState extends ConfirmOptions {
  resolve: ResolveFn;
}

const ConfirmContext = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

/**
 * Modern, Promise-based confirm modal.
 *
 * Usage:
 *   const confirm = useConfirm();
 *   const ok = await confirm({ title: '...', variant: 'danger' });
 *   if (ok) doIt();
 *
 * Replaces native `window.confirm()` which produced ugly browser dialogs
 * inconsistent with the rest of the UI.
 */
export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ConfirmState | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve });
      // Focus the confirm button shortly after mount for keyboard usability
      setTimeout(() => confirmButtonRef.current?.focus(), 50);
    });
  }, []);

  const handleResolve = (value: boolean) => {
    if (state) state.resolve(value);
    setState(null);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleResolve(false);
    if (e.key === 'Enter') handleResolve(true);
  };

  const variant: ConfirmVariant = state?.variant ?? 'primary';
  const variantClasses: Record<ConfirmVariant, { btn: string; ring: string; icon: string }> = {
    primary: {
      btn: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
      ring: 'ring-indigo-100',
      icon: 'text-indigo-600 bg-indigo-100',
    },
    danger: {
      btn: 'bg-anomaly-600 hover:bg-anomaly-700 focus:ring-anomaly-500',
      ring: 'ring-anomaly-100',
      icon: 'text-anomaly-600 bg-anomaly-100',
    },
    warning: {
      btn: 'bg-estimated-600 hover:bg-estimated-700 focus:ring-estimated-500',
      ring: 'ring-estimated-100',
      icon: 'text-estimated-700 bg-estimated-100',
    },
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => handleResolve(false)}
          onKeyDown={onKeyDown}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${variantClasses[variant].icon}`}
                >
                  {variant === 'danger' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : variant === 'warning' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 id="confirm-title" className="text-lg font-semibold text-gray-900">
                    {state.title}
                  </h3>
                  {state.description && (
                    <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                      {state.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-end gap-2 border-t border-gray-100">
              <button
                onClick={() => handleResolve(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 transition"
              >
                {state.cancelLabel ?? 'İptal'}
              </button>
              <button
                ref={confirmButtonRef}
                onClick={() => handleResolve(true)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition ${variantClasses[variant].btn}`}
              >
                {state.confirmLabel ?? 'Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export function useConfirm(): (opts: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used inside <ConfirmDialogProvider>');
  }
  return ctx;
}
