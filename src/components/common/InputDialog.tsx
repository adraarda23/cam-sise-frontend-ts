import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export interface InputField {
  name: string;
  label: string;
  type?: 'text' | 'number';
  defaultValue?: string | number;
  placeholder?: string;
  min?: number;
  max?: number;
  helperText?: string;
}

export interface InputDialogOptions {
  title: string;
  description?: string;
  fields: InputField[];
  confirmLabel?: string;
  cancelLabel?: string;
}

export type InputDialogResult = Record<string, string> | null;

type ResolveFn = (value: InputDialogResult) => void;

interface DialogState extends InputDialogOptions {
  resolve: ResolveFn;
}

const InputDialogContext = createContext<((opts: InputDialogOptions) => Promise<InputDialogResult>) | null>(null);

/**
 * Promise-based input dialog. Replaces native window.prompt() which is
 * inconsistent with the rest of the UI and only supports one field.
 *
 * Usage:
 *   const askInput = useInputDialog();
 *   const values = await askInput({
 *     title: 'Toplamayı tamamla',
 *     fields: [
 *       { name: 'pallets', label: 'Toplanan palet', type: 'number' },
 *       { name: 'separators', label: 'Toplanan ayırıcı', type: 'number' },
 *     ],
 *   });
 *   if (values) { ... }
 */
export const InputDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DialogState | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  const askInput = useCallback((opts: InputDialogOptions): Promise<InputDialogResult> => {
    return new Promise<InputDialogResult>((resolve) => {
      const initial: Record<string, string> = {};
      opts.fields.forEach((f) => {
        initial[f.name] = f.defaultValue != null ? String(f.defaultValue) : '';
      });
      setValues(initial);
      setState({ ...opts, resolve });
      setTimeout(() => firstInputRef.current?.focus(), 50);
    });
  }, []);

  const handleCancel = () => {
    if (state) state.resolve(null);
    setState(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (state) state.resolve(values);
    setState(null);
  };

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <InputDialogContext.Provider value={askInput}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={handleCancel}
          role="dialog"
          aria-modal="true"
        >
          <form
            className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{state.title}</h3>
                {state.description && (
                  <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">{state.description}</p>
                )}
              </div>
              {state.fields.map((field, idx) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <input
                    ref={idx === 0 ? firstInputRef : undefined}
                    type={field.type ?? 'text'}
                    value={values[field.name] ?? ''}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.name]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    min={field.min}
                    max={field.max}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {field.helperText && (
                    <p className="text-xs text-gray-500 mt-1">{field.helperText}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {state.cancelLabel ?? 'İptal'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                {state.confirmLabel ?? 'Tamam'}
              </button>
            </div>
          </form>
        </div>
      )}
    </InputDialogContext.Provider>
  );
};

export function useInputDialog() {
  const ctx = useContext(InputDialogContext);
  if (!ctx) throw new Error('useInputDialog must be used inside <InputDialogProvider>');
  return ctx;
}
