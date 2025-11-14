
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
}

let toastId = 0;
const toasts: ToastMessage[] = [];
let listeners: React.Dispatch<React.SetStateAction<ToastMessage[]>>[] = [];

const toast = (message: string, type: ToastType) => {
    const newToast = { id: toastId++, message, type };
    toasts.push(newToast);
    listeners.forEach(listener => listener([...toasts]));

    setTimeout(() => {
        const index = toasts.findIndex(t => t.id === newToast.id);
        if (index > -1) {
            toasts.splice(index, 1);
            listeners.forEach(listener => listener([...toasts]));
        }
    }, 5000);
};

toast.success = (message: string) => toast(message, 'success');
toast.error = (message: string) => toast(message, 'error');
toast.info = (message: string) => toast(message, 'info');
toast.warning = (message: string) => toast(message, 'warning');

const Toast: React.FC<{ toast: ToastMessage, onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
    const icons = {
        success: <CheckCircle className="text-green-400" />,
        error: <XCircle className="text-red-400" />,
        info: <Info className="text-blue-400" />,
        warning: <AlertTriangle className="text-yellow-400" />,
    };

    const bgColors = {
        success: 'bg-green-500/10 border-green-500/30',
        error: 'bg-red-500/10 border-red-500/30',
        info: 'bg-blue-500/10 border-blue-500/30',
        warning: 'bg-yellow-500/10 border-yellow-500/30',
    };

    return (
        <div className={`flex items-center w-full max-w-xs p-4 space-x-4 rtl:space-x-reverse text-gray-300 bg-gray-800 rounded-lg shadow-lg border ${bgColors[toast.type]}`} role="alert">
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">
                {icons[toast.type]}
            </div>
            <div className="ms-3 text-sm font-normal flex-1">{toast.message}</div>
            <button type="button" className="ms-auto -mx-1.5 -my-1.5 bg-gray-800 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 inline-flex items-center justify-center h-8 w-8" onClick={() => onDismiss(toast.id)}>
                <span className="sr-only">Close</span>
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                </svg>
            </button>
        </div>
    );
};


export const Toaster: React.FC = () => {
    const [currentToasts, setCurrentToasts] = useState<ToastMessage[]>(toasts);

    const handleDismiss = useCallback((id: number) => {
        const index = toasts.findIndex(t => t.id === id);
        if (index > -1) {
            toasts.splice(index, 1);
            setCurrentToasts([...toasts]);
        }
    }, []);
    
    useEffect(() => {
        listeners.push(setCurrentToasts);
        return () => {
            listeners = listeners.filter(l => l !== setCurrentToasts);
        };
    }, []);

    return (
        <div className="fixed top-5 right-5 z-50 space-y-2">
            {currentToasts.map(toast => (
                <Toast key={toast.id} toast={toast} onDismiss={handleDismiss} />
            ))}
        </div>
    );
};

export { toast };
