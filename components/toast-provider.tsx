"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { Toast, ToastContainer } from "@/components/ui/toast"

interface ToastContextType {
  addToast: (message: string, type: "success" | "error" | "info", duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: "success" | "error" | "info", duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      id,
      message,
      type,
      duration
    }
    
    setToasts(prev => [...prev, newToast])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
