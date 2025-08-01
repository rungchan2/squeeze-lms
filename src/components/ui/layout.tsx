import * as React from "react"
import { cn } from "@/lib/utils"

// Box component - direct replacement for Chakra UI Box
export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
}

export const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ className, as: Component = "div", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(className)}
        {...props}
      />
    )
  }
)
Box.displayName = "Box"

// Flex component - replacement for Chakra UI Flex
export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "column" | "row-reverse" | "column-reverse"
  wrap?: "wrap" | "nowrap" | "wrap-reverse"
  align?: "start" | "end" | "center" | "baseline" | "stretch"
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly"
  gap?: number | string
  as?: React.ElementType
}

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ 
    className, 
    direction = "row", 
    wrap = "nowrap",
    align = "start",
    justify = "start",
    gap,
    as: Component = "div",
    style,
    ...props 
  }, ref) => {
    const flexDirection = {
      row: "flex-row",
      column: "flex-col",
      "row-reverse": "flex-row-reverse",
      "column-reverse": "flex-col-reverse"
    }[direction]

    const flexWrap = {
      wrap: "flex-wrap",
      nowrap: "flex-nowrap",
      "wrap-reverse": "flex-wrap-reverse"
    }[wrap]

    const alignItems = {
      start: "items-start",
      end: "items-end",
      center: "items-center",
      baseline: "items-baseline",
      stretch: "items-stretch"
    }[align]

    const justifyContent = {
      start: "justify-start",
      end: "justify-end",
      center: "justify-center",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly"
    }[justify]

    const gapClass = typeof gap === "number" ? `gap-${gap}` : gap ? `gap-[${gap}]` : undefined

    return (
      <Component
        ref={ref}
        className={cn(
          "flex",
          flexDirection,
          flexWrap,
          alignItems,
          justifyContent,
          gapClass,
          className
        )}
        style={style}
        {...props}
      />
    )
  }
)
Flex.displayName = "Flex"

// Grid component - replacement for Chakra UI Grid
export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  templateColumns?: string
  templateRows?: string
  gap?: number | string
  rowGap?: number | string
  columnGap?: number | string
  as?: React.ElementType
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ 
    className, 
    templateColumns,
    templateRows,
    gap,
    rowGap,
    columnGap,
    as: Component = "div",
    style,
    ...props 
  }, ref) => {
    const gridStyle = {
      ...style,
      ...(templateColumns && { gridTemplateColumns: templateColumns }),
      ...(templateRows && { gridTemplateRows: templateRows }),
    }

    const gapClass = typeof gap === "number" ? `gap-${gap}` : gap ? `gap-[${gap}]` : undefined
    const rowGapClass = typeof rowGap === "number" ? `gap-y-${rowGap}` : rowGap ? `gap-y-[${rowGap}]` : undefined
    const columnGapClass = typeof columnGap === "number" ? `gap-x-${columnGap}` : columnGap ? `gap-x-[${columnGap}]` : undefined

    return (
      <Component
        ref={ref}
        className={cn(
          "grid",
          gapClass,
          rowGapClass,
          columnGapClass,
          className
        )}
        style={gridStyle}
        {...props}
      />
    )
  }
)
Grid.displayName = "Grid"

// GridItem component - replacement for Chakra UI GridItem
export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  colSpan?: number
  rowSpan?: number
  colStart?: number
  colEnd?: number
  rowStart?: number
  rowEnd?: number
  as?: React.ElementType
}

export const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ 
    className, 
    colSpan,
    rowSpan,
    colStart,
    colEnd,
    rowStart,
    rowEnd,
    as: Component = "div",
    ...props 
  }, ref) => {
    const colSpanClass = colSpan ? `col-span-${colSpan}` : undefined
    const rowSpanClass = rowSpan ? `row-span-${rowSpan}` : undefined
    const colStartClass = colStart ? `col-start-${colStart}` : undefined
    const colEndClass = colEnd ? `col-end-${colEnd}` : undefined
    const rowStartClass = rowStart ? `row-start-${rowStart}` : undefined
    const rowEndClass = rowEnd ? `row-end-${rowEnd}` : undefined

    return (
      <Component
        ref={ref}
        className={cn(
          colSpanClass,
          rowSpanClass,
          colStartClass,
          colEndClass,
          rowStartClass,
          rowEndClass,
          className
        )}
        {...props}
      />
    )
  }
)
GridItem.displayName = "GridItem"

// Stack component - replacement for Chakra UI Stack/VStack/HStack
export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "column"
  spacing?: number | string
  align?: "start" | "end" | "center" | "baseline" | "stretch"
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly"
  divider?: React.ReactNode
  as?: React.ElementType
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ 
    className, 
    direction = "column", 
    spacing = 4,
    align = "start",
    justify = "start",
    divider,
    children,
    as: Component = "div",
    ...props 
  }, ref) => {
    const isRow = direction === "row"
    const flexDirection = isRow ? "flex-row" : "flex-col"
    
    const alignItems = {
      start: "items-start",
      end: "items-end", 
      center: "items-center",
      baseline: "items-baseline",
      stretch: "items-stretch"
    }[align]

    const justifyContent = {
      start: "justify-start",
      end: "justify-end",
      center: "justify-center",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly"
    }[justify]

    const spacingClass = typeof spacing === "number" ? `gap-${spacing}` : `gap-[${spacing}]`

    // If divider is provided, we need to manually insert dividers between children
    let content = children
    if (divider && React.Children.count(children) > 1) {
      const childrenArray = React.Children.toArray(children)
      content = childrenArray.reduce((acc: React.ReactNode[], child, index) => {
        acc.push(child)
        if (index < childrenArray.length - 1) {
          acc.push(React.cloneElement(divider as React.ReactElement, { key: `divider-${index}` }))
        }
        return acc
      }, [])
    }

    return (
      <Component
        ref={ref}
        className={cn(
          "flex",
          flexDirection,
          alignItems,
          justifyContent,
          !divider && spacingClass, // Only apply gap if no divider
          className
        )}
        {...props}
      >
        {content}
      </Component>
    )
  }
)
Stack.displayName = "Stack"

// VStack - vertical stack shorthand
export const VStack = React.forwardRef<HTMLDivElement, Omit<StackProps, "direction">>(
  (props, ref) => <Stack ref={ref} direction="column" {...props} />
)
VStack.displayName = "VStack"

// HStack - horizontal stack shorthand
export const HStack = React.forwardRef<HTMLDivElement, Omit<StackProps, "direction">>(
  (props, ref) => <Stack ref={ref} direction="row" {...props} />
)
HStack.displayName = "HStack"

// Container component - replacement for Chakra UI Container
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxW?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full" | string
  centerContent?: boolean
  as?: React.ElementType
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ 
    className, 
    maxW = "7xl",
    centerContent = false,
    as: Component = "div",
    ...props 
  }, ref) => {
    const maxWidthClass = {
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
    }[maxW] || `max-w-[${maxW}]`

    return (
      <Component
        ref={ref}
        className={cn(
          "container mx-auto px-4",
          maxWidthClass,
          centerContent && "flex items-center justify-center",
          className
        )}
        {...props}
      />
    )
  }
)
Container.displayName = "Container"