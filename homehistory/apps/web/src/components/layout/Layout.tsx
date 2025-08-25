import * as React from "react"
import { cn } from "@/lib/utils"

interface LayoutProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full"
  padding?: boolean
}

export function Layout({ 
  children, 
  className,
  maxWidth = "7xl",
  padding = true 
}: LayoutProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full"
  }

  return (
    <div className={cn(
      "mx-auto w-full",
      maxWidthClasses[maxWidth],
      padding && "px-4 sm:px-6 lg:px-8",
      className
    )}>
      {children}
    </div>
  )
}

// Container component for consistent layout
interface ContainerProps {
  children: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
  center?: boolean
}

export function Container({ 
  children, 
  className,
  size = "xl",
  center = true 
}: ContainerProps) {
  const sizeClasses = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-6xl", 
    xl: "max-w-7xl",
    full: "max-w-full"
  }

  return (
    <div className={cn(
      "w-full px-4 sm:px-6 lg:px-8",
      center && "mx-auto",
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  )
}

// Section component for consistent spacing
interface SectionProps {
  children: React.ReactNode
  className?: string
  spacing?: "sm" | "md" | "lg" | "xl"
  background?: "default" | "muted" | "accent"
}

export function Section({ 
  children, 
  className,
  spacing = "lg",
  background = "default"
}: SectionProps) {
  const spacingClasses = {
    sm: "py-8",
    md: "py-12", 
    lg: "py-16",
    xl: "py-20"
  }

  const backgroundClasses = {
    default: "",
    muted: "bg-muted/50",
    accent: "bg-accent/5"
  }

  return (
    <section className={cn(
      spacingClasses[spacing],
      backgroundClasses[background],
      className
    )}>
      {children}
    </section>
  )
}

export default Layout