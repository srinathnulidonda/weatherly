// src/components/search/QuickLocationCard.jsx
import { Navigation, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';

function QuickLocationCard({ loading, confirmed, cityDisplay, onUse, className }) {
    return (
        <button
            onClick={onUse}
            disabled={loading}
            className={cn(
                'group flex w-full items-center gap-2.5 rounded-xl p-2.5 transition-all duration-200 sm:gap-3 sm:rounded-2xl sm:p-3',
                'border border-orange-500/15 bg-gradient-to-r from-orange-500/[0.08] via-orange-500/[0.04] to-transparent',
                'hover:border-orange-500/30 hover:shadow-soft active:scale-[0.99]',
                loading && 'pointer-events-none opacity-70',
                className
            )}
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/25 transition-transform duration-300 group-hover:scale-105 sm:h-9 sm:w-9 sm:rounded-xl">
                <Navigation size={12} className={cn('text-white', loading && 'animate-pulse')} />
            </div>
            <div className="min-w-0 flex-1 text-left">
                <p className="text-[12.5px] font-semibold text-stone-900 dark:text-stone-100 sm:text-sm">
                    {loading ? 'Detecting your location…' : 'Use my current location'}
                </p>
                {confirmed && cityDisplay && !loading && (
                    <p className="flex items-center gap-1 truncate text-[10px] text-stone-500 dark:text-stone-400 sm:text-xs">
                        <CheckCircle2 size={9} className="shrink-0 text-green-500" />
                        {cityDisplay}
                    </p>
                )}
            </div>
            <ChevronRight size={14} className="shrink-0 text-orange-400 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
    );
}

export { QuickLocationCard };
export default QuickLocationCard;