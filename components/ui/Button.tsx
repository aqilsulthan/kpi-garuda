import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
                    {
                        // Variants
                        'bg-primary-600 text-white shadow hover:bg-primary-700': variant === 'primary',
                        'bg-blue-50 text-primary-700 hover:bg-blue-100': variant === 'secondary',
                        'bg-white border border-gray-300 text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900': variant === 'outline',
                        'bg-red-600 text-white shadow-sm hover:bg-red-700': variant === 'danger',
                        'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700': variant === 'success',
                        'hover:bg-gray-100 hover:text-gray-900 text-gray-700': variant === 'ghost',

                        // Sizes
                        'h-8 px-3 text-xs': size === 'sm',
                        'h-10 px-4 py-2': size === 'md',
                        'h-12 px-6 text-base rounded-xl': size === 'lg',
                        'h-10 w-10': size === 'icon',
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
