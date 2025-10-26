import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-2xl border px-4 py-4 text-base transition-all duration-500 placeholder:text-muted-foreground/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input bg-card shadow-soft focus:border-input-focus focus:ring-2 focus:ring-input-focus/20 focus:shadow-card",
        premium: "glass-input text-foreground placeholder:text-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 hover:shadow-glass",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const FormInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
FormInput.displayName = "FormInput"

export { FormInput, inputVariants }