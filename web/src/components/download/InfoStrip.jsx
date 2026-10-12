// web/src/components/download/InfoStrip.jsx
import { cn } from '@/lib/cn';

function InfoStrip({ items = [], className }) {
    return (
        <div
            className={cn(
                'flex items-stretch rounded-2xl border border-stone-200/70 dark:border-white/[0.08] bg-stone-50/60 dark:bg-white/[0.02] divide-x divide-stone-200/70 dark:divide-white/[0.07] overflow-hidden',
                className
            )}
        >
            {items.map((item, i) => (
                <div
                    key={item.label || i}
                    className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1 px-2 py-3 sm:py-3.5 text-center"
                >
                    {item.icon && (
                        <item.icon size={14} className="text-stone-400 dark:text-stone-500 mb-0.5" aria-hidden="true" />
                    )}
                    <span className="text-[12.5px] sm:text-sm font-bold text-stone-900 dark:text-stone-50 truncate max-w-full tabular-nums">
                        {item.value}
                    </span>
                    <span className="text-[8.5px] sm:text-[9.5px] uppercase tracking-wider text-stone-400 dark:text-stone-500 font-semibold">
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    );
}

export { InfoStrip };
export default InfoStrip;