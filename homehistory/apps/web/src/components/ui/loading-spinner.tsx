import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
      variant: {
        default: "text-primary",
        secondary: "text-secondary-foreground",
        muted: "text-muted-foreground",
        destructive: "text-destructive",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  text?: string
  center?: boolean
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, variant, text, center, ...props }, ref) => {
    const content = (
      <>
        <Loader2 className={cn(spinnerVariants({ size, variant }))} />
        {text && (
          <span className="ml-2 text-sm text-muted-foreground">
            {text}
          </span>
        )}
      </>
    )

    if (center) {
      return (
        <div
          ref={ref}
          className={cn("flex items-center justify-center", className)}
          {...props}
        >
          {content}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center", className)}
        {...props}
      >
        {content}
      </div>
    )
  }
)
LoadingSpinner.displayName = "LoadingSpinner"

// Full page loading component
export const PageLoader = ({ text = "Loading..." }: { text?: string }) => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="xl" text={text} />
  </div>
)

// Inline loading component
export const InlineLoader = ({ text }: { text?: string }) => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner size="lg" text={text} />
  </div>
)

// Button loading state
export const ButtonLoader = () => (
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
)

export { LoadingSpinner, spinnerVariants }