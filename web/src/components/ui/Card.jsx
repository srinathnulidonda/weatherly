// web/src/components/ui/Card.jsx
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const variantClasses = {
    base: 'glass',
    glass: 'glass',
    elevated: 'glass-elevated',
    brand: 'glass-brand',
    active: 'glass-active',
    metric: 'glass-metric',
    ghost: 'bg-transparent border-0 shadow-none rounded-2xl',
};

const Card = forwardRef(({ className, variant = 'base', padding = true, hoverable = false, onClick, children, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                'transition-all duration-300 ease-out',
                variantClasses[variant] || variantClasses.base,
                padding === true && 'p-4 md:p-5',
                padding === 'sm' && 'p-3',
                padding === 'lg' && 'p-5 md:p-6',
                padding === false && '',
                hoverable && 'cursor-pointer hover:border-white/[0.10] hover:-translate-y-[1px]',
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
        <div className={cn('flex items-center justify-between mb-3', className)} {...props}>
            {children}
        </div>
    );
}

function CardTitle({ className, children, ...props }) {
    return (
        <h3 className={cn('card-heading', className)} {...props}>
            {children}
        </h3>
    );
}

Card.Header = CardHeader;
Card.Title = CardTitle;

export { Card, CardHeader, CardTitle };
export default Card;