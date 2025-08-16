import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Text component - replacement for Chakra UI Text
const textVariants = cva(
  "", // base styles
  {
    variants: {
      variant: {
        default: "",
        muted: "text-muted-foreground",
        accent: "text-accent-foreground",
        destructive: "text-destructive",
        success: "text-green-600",
        warning: "text-yellow-600",
      },
      size: {
        xs: "text-xs",
        sm: "text-sm",
        base: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
      },
      align: {
        left: "text-left",
        center: "text-center",
        right: "text-right",
        justify: "text-justify",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "base",
      weight: "normal",
      align: "left",
    },
  }
)

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  as?: React.ElementType
  truncate?: boolean
  noOfLines?: number
}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ 
    className, 
    variant, 
    size, 
    weight, 
    align, 
    as: Component = "p",
    truncate = false,
    noOfLines,
    style,
    ...props 
  }, ref) => {
    const truncateStyles = truncate || noOfLines ? {
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: noOfLines && noOfLines > 1 ? "-webkit-box" : "block",
      WebkitLineClamp: noOfLines,
      WebkitBoxOrient: "vertical" as const,
      whiteSpace: !noOfLines || noOfLines === 1 ? "nowrap" : "normal",
      ...style,
    } : style

    return (
      <Component
        ref={ref}
        className={cn(
          textVariants({ variant, size, weight, align }),
          truncate && "truncate",
          className
        )}
        style={truncateStyles}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"

// Heading component - replacement for Chakra UI Heading  
const headingVariants = cva(
  "font-semibold tracking-tight",
  {
    variants: {
      variant: {
        default: "",
        destructive: "text-destructive",
        muted: "text-muted-foreground",
        accent: "text-accent-foreground",
      },
      size: {
        xs: "text-xs",
        sm: "text-sm",
        base: "text-base",
        lg: "text-lg font-semibold",
        xl: "text-xl font-semibold",
        "2xl": "text-2xl font-bold",
        "3xl": "text-3xl font-bold",
        "4xl": "text-4xl font-bold",
        "5xl": "text-5xl font-bold",
        "6xl": "text-6xl font-bold",
      },
      as: {
        h1: "",
        h2: "",
        h3: "",
        h4: "",
        h5: "",
        h6: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "xl",
      as: "h2",
    },
  }
)

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  truncate?: boolean
  noOfLines?: number
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ 
    className, 
    variant, 
    size, 
    as: Component = "h2",
    truncate = false,
    noOfLines,
    style,
    ...props 
  }, ref) => {
    // Auto-size based on heading level if no size is specified
    const autoSize = !size ? {
      h1: "4xl",
      h2: "3xl",
      h3: "2xl", 
      h4: "xl",
      h5: "lg",
      h6: "base",
    }[Component] as any : size

    const truncateStyles = truncate || noOfLines ? {
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: noOfLines && noOfLines > 1 ? "-webkit-box" : "block",
      WebkitLineClamp: noOfLines,
      WebkitBoxOrient: "vertical" as const,
      whiteSpace: !noOfLines || noOfLines === 1 ? "nowrap" : "normal",
      ...style,
    } : style

    return (
      <Component
        ref={ref}
        className={cn(
          headingVariants({ variant, size: autoSize, as: Component }),
          truncate && "truncate",
          className
        )}
        style={truncateStyles}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"

// Link component - enhanced link with consistent styling
const linkVariants = cva(
  "inline-flex items-center gap-1 transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "text-primary hover:text-primary/80 underline-offset-4 hover:underline",
        ghost: "text-foreground hover:text-primary",
        muted: "text-muted-foreground hover:text-foreground",
        destructive: "text-destructive hover:text-destructive/80",
      },
      size: {
        sm: "text-sm",
        base: "text-base", 
        lg: "text-lg",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "base",
      weight: "normal",
    },
  }
)

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof linkVariants> {
  as?: React.ElementType
  external?: boolean
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ 
    className, 
    variant, 
    size, 
    weight,
    as: Component = "a",
    external = false,
    children,
    ...props 
  }, ref) => {
    const externalProps = external ? {
      target: "_blank",
      rel: "noopener noreferrer"
    } : {}

    return (
      <Component
        ref={ref}
        className={cn(linkVariants({ variant, size, weight }), className)}
        {...externalProps}
        {...props}
      >
        {children}
        {external && (
          <svg
            className="w-3 h-3 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        )}
      </Component>
    )
  }
)
Link.displayName = "Link"

// Divider component - replacement for Chakra UI Divider
export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical"
  variant?: "solid" | "dashed"
}

export const Divider = React.forwardRef<HTMLHRElement, DividerProps>(
  ({ 
    className, 
    orientation = "horizontal",
    variant = "solid",
    ...props 
  }, ref) => {
    const orientationClass = orientation === "vertical" 
      ? "h-full w-px border-l"
      : "w-full h-px border-t"
    
    const variantClass = variant === "dashed" ? "border-dashed" : "border-solid"

    return (
      <hr
        ref={ref}
        className={cn(
          "border-border",
          orientationClass,
          variantClass,
          className
        )}
        {...props}
      />
    )
  }
)
Divider.displayName = "Divider"