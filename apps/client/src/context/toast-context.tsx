'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
    id: string;
    type: ToastType;
    message: string;
};

type ToastContextType = {
    toast: (type: ToastType, message: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        setToasts((prev) => [...prev, { id, type, message }]);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const icons = {
        success: CheckCircle,
        error: AlertCircle,
        info: Info,
    };

    const styles = {
        success: {
            bg: 'bg-emerald-50 border-emerald-200',
            icon: 'text-emerald-500',
            text: 'text-emerald-800',
        },
        error: {
            bg: 'bg-red-50 border-red-200',
            icon: 'text-red-500',
            text: 'text-red-800',
        },
        info: {
            bg: 'bg-blue-50 border-blue-200',
            icon: 'text-blue-500',
            text: 'text-blue-800',
        },
    };

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}

            {/* Toast container */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map((t) => {
                    const Icon = icons[t.type];
                    const style = styles[t.type];
                    return (
                        <div
                            key={t.id}
                            className={`
                pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg
                animate-fade-in-up max-w-sm
                ${style.bg}
              `}
                        >
                            <Icon className={`w-4 h-4 shrink-0 ${style.icon}`} />
                            <p className={`text-sm font-medium flex-1 ${style.text}`}>{t.message}</p>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}