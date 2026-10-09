// web/src/components/ui/Badge.jsx
import { cn } from '@/lib/cn';

const variantClasses = {
    default: 'bg-stone-100 text-stone-700 dark:bg-white/[0.06] dark:text-stone-300',
    brand: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
    info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
};

function Badge({ children, variant = 'default', size = 'sm', dot = false, className, ...props }) {
    const sizeClasses = {
        xs: 'text-[10px] px-1.5 py-0.5',
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap',
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
            {...props}
        >
            {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dot === true ? 'bg-current' : dot)} />}
            {children}
        </span>
    );
}

export { Badge };
export default Badge;