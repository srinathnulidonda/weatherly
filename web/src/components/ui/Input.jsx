// web/src/components/ui/Input.jsx
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const Input = forwardRef(({ className, label, icon: Icon, iconRight: IconRight, wrapperClass, ...props }, ref) => {
    return (
        <div className={cn('w-full', wrapperClass)}>
            {label && (
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 pointer-events-none">
                        <Icon size={16} />
                    </div>
                )}
                <input
                    ref={ref}
                    className={cn(
                        'w-full rounded-2xl border bg-white dark:bg-white/[0.03] text-stone-900 dark:text-stone-100 text-sm',
                        'border-stone-300 dark:border-white/[0.10]',
                        'placeholder:text-stone-400 dark:placeholder:text-stone-600',
                        'focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50',
                        'transition-all duration-200',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        Icon ? 'pl-9' : 'pl-3.5',
                        IconRight ? 'pr-9' : 'pr-3.5',
                        'py-2.5',
                        className
                    )}
                    {...props}
                />
                {IconRight && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500">
                        <IconRight size={16} />
                    </div>
                )}
            </div>
        </div>
    );
});

Input.displayName = 'Input';
export { Input };
export default Input;