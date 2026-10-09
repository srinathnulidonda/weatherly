// web/src/components/search/QuickLocationCard.jsx
import { Navigation, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';

function QuickLocationCard({ loading, confirmed, cityDisplay, onUse, className }) {
    return (
        <button
            onClick={onUse}
            disabled={loading}
            className={cn(
                'w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 group',
                'bg-gradient-to-r from-orange-500/[0.08] via-orange-500/[0.04] to-transparent',
                'border border-orange-500/15 hover:border-orange-500/30',
                'active:scale-[0.99]',
                loading && 'opacity-70 pointer-events-none',
                className
            )}
        >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/25">
                <Navigation size={13} className={cn('text-white', loading && 'animate-pulse')} />
            </div>
            <div className="min-w-0 flex-1 text-left">
                <p className="text-[13px] sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {loading ? 'Detecting your location…' : 'Use my current location'}
                </p>
                {confirmed && cityDisplay && !loading && (
                    <p className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 truncate flex items-center gap-1">
                        <CheckCircle2 size={9} className="text-green-500 shrink-0" />
                        {cityDisplay}
                    </p>
                )}
            </div>
            <ChevronRight size={14} className="text-orange-400 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
    );
}

export { QuickLocationCard };
export default QuickLocationCard;