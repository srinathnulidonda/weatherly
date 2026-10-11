// web/src/components/ui/Button.jsx
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const variantClasses = {
    primary: 'bg-stone-900 text-stone-50 hover:bg-stone-800/90 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200/90',
    secondary: 'bg-stone-200 text-stone-900 hover:bg-stone-300/90 dark:bg-stone-800 dark:text-stone-50 dark:hover:bg-stone-700/90',
    ghost: 'hover:bg-stone-200/50 dark:hover:bg-stone-700/50',
    outline: 'border border-stone-300 hover:border-stone-400 dark:border-stone-600 dark:hover:border-stone-500',
    danger: 'bg-red-600 text-stone-50 hover:bg-red-500/90 dark:bg-red-400 dark:text-stone-900 dark:hover:bg-red-300/90',
    icon: 'min-touch inline-flex items-center justify-center rounded-full text-stone-500 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50',
};

const sizeClasses = {
    sm: 'text-xs px-3 py-2 min-h-[40px]',
    md: 'text-sm px-4 py-2.5 min-h-[44px]',
    lg: 'text-base px-5 py-3 min-h-[48px]',
};

const Button = forwardRef(({ className, variant = 'primary', size = 'md', disabled = false, loading = false, children, ...props }, ref) => {
    return (
        <button
            ref={ref}
            className={cn(
                'inline-flex items-center justify-center gap-2 font-medium select-none transition-all duration-200',
                variantClasses[variant],
                sizeClasses[size],
                disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                loading && 'opacity-70 cursor-wait',
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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