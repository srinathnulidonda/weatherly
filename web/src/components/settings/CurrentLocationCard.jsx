// web/src/components/settings/CurrentLocationCard.jsx
import { useState } from 'react';
import { RefreshCw, Trash2, CheckCircle2, Navigation, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

function InfoChip({ label, value, mono, capitalize, valueClass }) {
    return (
        <div className="min-w-0">
            <p className="text-[9px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-0.5">
                {label}
            </p>
            <p
                className={cn(
                    'text-[11.5px] font-semibold text-stone-700 dark:text-stone-300 truncate',
                    mono && 'font-mono',
                    capitalize && 'capitalize',
                    valueClass
                )}
            >
                {value}
            </p>
        </div>
    );
}

function CurrentLocationCard({ location, confirmed, loading, cityDisplay, onRefresh, onClear }) {
    const [expanded, setExpanded] = useState(false);
    const hasLocation = !!location;

    return (
        <div>
            <div className="flex items-center gap-2 p-3 sm:p-3.5">
                <button
                    type="button"
                    onClick={() => hasLocation && setExpanded((v) => !v)}
                    disabled={!hasLocation}
                    className={cn(
                        'flex items-center gap-3 flex-1 min-w-0 text-left rounded-xl py-1 -my-1 transition-colors',
                        hasLocation
                            ? 'hover:bg-stone-50 dark:hover:bg-white/[0.03] active:bg-stone-100 dark:active:bg-white/[0.05]'
                            : 'cursor-default'
                    )}
                >
                    <div className="relative shrink-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_4px_12px_-2px_rgba(249,115,22,0.45)]">
                            <Navigation size={15} className={cn('text-white', loading && 'animate-pulse')} aria-hidden="true" />
                        </div>
                        {confirmed && !loading && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-stone-950 flex items-center justify-center">
                                <CheckCircle2 size={8} className="text-white" aria-hidden="true" />
                            </span>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
                            Current Location
                        </p>
                        <p className="text-[11.5px] sm:text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                            {loading ? 'Detecting…' : hasLocation ? cityDisplay || 'Unknown location' : 'Not detected yet'}
                        </p>
                    </div>

                    {hasLocation && (
                        <ChevronDown
                            size={14}
                            className={cn(
                                'shrink-0 text-stone-300 dark:text-stone-600 transition-transform duration-200',
                                expanded && 'rotate-180'
                            )}
                            aria-hidden="true"
                        />
                    )}
                </button>

                <button
                    type="button"
                    onClick={onRefresh}
                    aria-label="Re-detect location"
                    className="btn-icon !w-8 !h-8 sm:!w-9 sm:!h-9 shrink-0"
                >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
                </button>
            </div>

            <AnimatePresence initial={false}>
                {expanded && hasLocation && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 border-t border-stone-100 dark:border-white/[0.06]">
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-3 pb-3">
                                <InfoChip
                                    label="Coordinates"
                                    value={`${location.latitude?.toFixed(2)}, ${location.longitude?.toFixed(2)}`}
                                    mono
                                />
                                <InfoChip
                                    label="Source"
                                    value={location.detection_method?.replace(/_/g, ' ') || location.source || '--'}
                                    capitalize
                                />
                                <InfoChip label="Timezone" value={location.timezone || '--'} />
                                <InfoChip
                                    label="Precision"
                                    value={location.is_precise ? 'Precise' : 'Approximate'}
                                    valueClass={location.is_precise ? 'text-green-500' : 'text-amber-500'}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={onClear}
                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-red-500 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={12} aria-hidden="true" />
                                Clear location
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export { CurrentLocationCard };
export default CurrentLocationCard;