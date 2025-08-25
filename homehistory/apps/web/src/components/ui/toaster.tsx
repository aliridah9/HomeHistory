import * as React from "react"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { useToasts } from "@/stores/ui.store"
import { ToastState } from "@/types"

const toastVariants = {
  success: {
    icon: CheckCircle,
    className: "border-success-200 bg-success-50 text-success-800 dark:border-success-800 dark:bg-success-950 dark:text-success-200",
    iconClassName: "text-success-600 dark:text-success-400",
  },
  error: {
    icon: AlertCircle,
    className: "border-error-200 bg-error-50 text-error-800 dark:border-error-800 dark:bg-error-950 dark:text-error-200",
    iconClassName: "text-error-600 dark:text-error-400",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-warning-200 bg-warning-50 text-warning-800 dark:border-warning-800 dark:bg-warning-950 dark:text-warning-200",
    iconClassName: "text-warning-600 dark:text-warning-400",
  },
  info: {
    icon: Info,
    className: "border-homehistory-200 bg-homehistory-50 text-homehistory-800 dark:border-homehistory-800 dark:bg-homehistory-950 dark:text-homehistory-200",
    iconClassName: "text-homehistory-600 dark:text-homehistory-400",
  },
}

interface ToastProps {
  toast: ToastState
  onRemove: (id: string) => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ toast, onRemove }, ref) => {
    const variant = toastVariants[toast.type]
    const Icon = variant.icon

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50, scale: 0.3 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
        className={cn(
          "relative flex w-full items-start space-x-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm",
          variant.className
        )}
      >
        <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", variant.iconClassName)} />
        
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-semibold">{toast.title}</h4>
            <button
              onClick={() => onRemove(toast.id)}
              className="flex-shrink-0 ml-2 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {toast.message && (
            <p className="text-sm opacity-90">{toast.message}</p>
          )}
          
          {toast.actions && toast.actions.length > 0 && (
            <div className="flex space-x-2 mt-3">
              {toast.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded transition-colors",
                    action.variant === "destructive"
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : action.variant === "outline"
                      ? "border border-current opacity-70 hover:opacity-100"
                      : "bg-background/20 hover:bg-background/30"
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    )
  }
)
Toast.displayName = "Toast"

export const Toaster = () => {
  const toasts = useToasts()
  const { removeToast } = useUIStore()

  return (
    <div className="fixed top-0 right-0 z-50 w-full max-w-sm p-4 space-y-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              toast={toast}
              onRemove={removeToast}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Import useUIStore
import { useUIStore } from "@/stores/ui.store"