// src/components/ui/Button.jsx
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const variantClasses = {
    primary: 'bg-stone-900 text-stone-50 hover:bg-stone-800/90 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200/90 shadow-sm',
    secondary: 'bg-stone-200 text-stone-900 hover:bg-stone-300/90 dark:bg-stone-800 dark:text-stone-50 dark:hover:bg-stone-700/90',
    ghost: 'hover:bg-stone-200/50 dark:hover:bg-stone-700/50',
    outline: 'border border-stone-300 hover:border-stone-400 dark:border-stone-600 dark:hover:border-stone-500',
    danger: 'bg-red-600 text-stone-50 hover:bg-red-500/90 dark:bg-red-400 dark:text-stone-900 dark:hover:bg-red-300/90 shadow-sm',
    icon: 'min-touch inline-flex items-center justify-center rounded-full text-stone-500 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50',
};

const sizeClasses = {
    xs: 'text-[10.5px] px-2.5 py-1 min-h-[32px] gap-1',
    sm: 'text-[11px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 min-h-[34px] sm:min-h-[38px] gap-1.5',
    md: 'text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 min-h-[38px] sm:min-h-[44px]',
    lg: 'text-sm sm:text-base px-5 sm:px-6 py-2.5 sm:py-3 min-h-[42px] sm:min-h-[48px]',
};

const Button = forwardRef(({ className, variant = 'primary', size = 'md', disabled = false, loading = false, children, ...props }, ref) => {
    const isIcon = variant === 'icon';
    return (
        <button
            ref={ref}
            className={cn(
                'inline-flex items-center justify-center gap-1.5 sm:gap-2 font-medium select-none rounded-full whitespace-nowrap',
                'transition-all duration-200 active:scale-[0.97]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 dark:focus-visible:ring-offset-stone-950',
                variantClasses[variant],
                !isIcon && sizeClasses[size],
                isIcon && 'w-9 h-9 sm:w-11 sm:h-11',
                disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                loading && 'opacity-70 cursor-wait',
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {children}
        </button>
    );
});

Button.displayName = 'Button';
export { Button };
export default Button;