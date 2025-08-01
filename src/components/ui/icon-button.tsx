import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "./button"

// IconButton variant that extends the base button
const iconButtonVariants = cva(
  "rounded-full aspect-square inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "hover:bg-muted hover:text-muted-foreground",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        muted: "text-muted-foreground hover:bg-muted hover:text-foreground",
      },
      size: {
        default: "h-9 w-9",
        sm: "h-8 w-8",
        lg: "h-10 w-10",
        xl: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  children: React.ReactNode
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(iconButtonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
IconButton.displayName = "IconButton"

// IconContainer - replacement for the existing IconContainer component
export interface IconContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  padding?: string
  hoverColor?: string
  iconColor?: string
}

export const IconContainer = React.forwardRef<HTMLDivElement, IconContainerProps>(
  ({ 
    className, 
    children, 
    padding = "4px",
    hoverColor,
    iconColor,
    style,
    ...props 
  }, ref) => {
    const customStyle = {
      padding,
      color: iconColor,
      ...style,
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center w-fit aspect-square rounded-full cursor-pointer transition-colors",
          "hover:bg-muted hover:text-muted-foreground",
          className
        )}
        style={customStyle}
        {...props}
      >
        {children}
      </div>
    )
  }
)
IconContainer.displayName = "IconContainer"