"use client";

import { createContext, useContext, useState } from "react";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

type Toast = {
    id: number;
    message: string;
    type: "success" | "error" | "info";
};

const ToastContext = createContext<any>(null);

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    function showToast(
        message: string,
        type: "success" | "error" | "info" = "success"
    ) {
        const id = Date.now();

        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast UI */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 space-y-3 z-50 flex flex-col items-center animate-in fade-in slide-in-from-top-2 duration-300">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`relative overflow-hidden flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-in
      ${toast.type === "success" ? "bg-emerald-500 text-black" : ""}
      ${toast.type === "error" ? "bg-rose-500 text-white" : ""}
      ${toast.type === "info" ? "bg-violet-600 text-white" : ""}
    `}
                    >
                        {toast.type === "success" && <CheckCircle size={18} />}
                        {toast.type === "error" && <AlertCircle size={18} />}
                        {toast.type === "info" && <Info size={18} />}
                        {toast.message}

                        {/* progress bar */}
                        <div className="absolute bottom-0 left-0 h-[3px] w-full bg-black/20">
                            <div className="h-full bg-black/60 animate-toast-progress" />
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}