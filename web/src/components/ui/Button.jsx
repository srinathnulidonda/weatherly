// web/src/components/ui/Button.jsx
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const variantClasses = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
    outline: 'btn-outline',
    danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 active:scale-[0.97] transition-all duration-300 ease-out rounded-full px-4 py-2.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 dark:focus-visible:ring-offset-stone-950',
    icon: 'min-touch inline-flex items-center justify-center rounded-full text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-900/5 dark:hover:bg-white/[0.06] active:scale-[0.95] transition-all duration-200',
};

const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 min-h-[44px]',
    md: '',
};

const Button = forwardRef(({ className, variant = 'primary', size = 'md', disabled = false, loading = false, children, ...props }, ref) => {
    return (
        <button
            ref={ref}
            className={cn(
                'inline-flex items-center justify-center gap-2 font-medium select-none',
                variantClasses[variant],
                variant !== 'icon' && sizeClasses[size],
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