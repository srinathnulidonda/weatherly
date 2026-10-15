// src/components/ui/Card.jsx
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const variantClasses = {
    base: 'glass',
    elevated: 'glass-elevated',
    brand: 'bg-gradient-to-br from-orange-500/[0.08] to-orange-600/[0.04] border border-orange-500/20 backdrop-blur-xl rounded-[var(--radius-card)]',
    active: 'bg-orange-500/[0.06] border border-orange-500/30 backdrop-blur-xl rounded-[var(--radius-card)]',
    metric: 'glass-metric',
    ghost: 'bg-transparent border-0 shadow-none rounded-xl',
};

const Card = forwardRef(({ className, variant = 'base', padding = true, hoverable = false, onClick, children, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                'transition-all duration-200 ease-in-out',
                variantClasses[variant] || variantClasses.base,
                padding === true && 'p-3 sm:p-4 md:p-5',
                padding === 'sm' && 'p-2.5 sm:p-3',
                padding === 'lg' && 'p-4 sm:p-5 md:p-6',
                padding === false && '',
                hoverable && 'cursor-pointer hover:border-stone-200/20 dark:hover:border-stone-700/20 hover:-translate-y-[1px]',
                onClick && 'cursor-pointer',
                className
            )}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } } : undefined}
            {...props}
        >
            {children}
        </div>
    );
});

Card.displayName = 'Card';

function CardHeader({ className, children, ...props }) {
    return (
        <div className={cn('flex items-center justify-between mb-3 sm:mb-4', className)} {...props}>
            {children}
        </div>
    );
}

function CardTitle({ className, children, ...props }) {
    return (
        <h3 className={cn('text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-100', className)} {...props}>
            {children}
        </h3>
    );
}

Card.Header = CardHeader;
Card.Title = CardTitle;

export { Card, CardHeader, CardTitle };
export default Card;