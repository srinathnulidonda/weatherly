// web/src/components/settings/CurrentLocationCard.jsx
import { MapPin, RefreshCw, Trash2, CheckCircle2, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

function CurrentLocationCard({ location, confirmed, loading, cityDisplay, onRefresh, onClear }) {
    return (
        <Card padding={false} className="overflow-hidden">
            <div className="relative bg-gradient-to-br from-orange-500/10 via-orange-500/[0.04] to-transparent p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                            <Navigation size={13} className={cn('text-white', loading && 'animate-pulse')} />
                        </div>
                        <p className="text-[13px] sm:text-sm font-semibold text-stone-800 dark:text-stone-200">Current Location</p>
                    </div>
                    {confirmed && !loading && (
                        <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] text-green-600 dark:text-green-400 font-semibold uppercase tracking-wider bg-green-500/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                            <CheckCircle2 size={9} /> Confirmed
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="py-3 sm:py-4 flex items-center gap-2 text-xs sm:text-sm text-stone-500">
                        <RefreshCw size={13} className="animate-spin" />
                        Detecting your location…
                    </div>
                ) : location ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5 sm:space-y-3">
                        <p className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 truncate">
                            {cityDisplay || 'Unknown location'}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <InfoChip label="Coordinates" value={`${location.latitude?.toFixed(2)}, ${location.longitude?.toFixed(2)}`} mono />
                            <InfoChip label="Source" value={location.detection_method?.replace(/_/g, ' ') || location.source || '--'} capitalize />
                            <InfoChip label="Timezone" value={location.timezone || '--'} />
                            <InfoChip
                                label="Precision"
                                value={location.is_precise ? 'Precise' : 'Approximate'}
                                valueClass={location.is_precise ? 'text-green-500' : 'text-amber-500'}
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                            <Button variant="outline" size="sm" onClick={onRefresh} className="flex-1">
                                <RefreshCw size={12} /> Re-detect
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClear}
                                className="flex-1 text-red-500 hover:text-red-400 border-red-200 dark:border-red-500/20 hover:bg-red-500/5"
                            >
                                <Trash2 size={12} /> Clear
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="py-3 sm:py-4 flex items-center gap-2 text-xs sm:text-sm text-stone-400">
                        <MapPin size={13} />
                        No location detected yet.
                    </div>
                )}
            </div>
        </Card>
    );
}

function InfoChip({ label, value, mono, capitalize, valueClass }) {
    return (
        <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/60 dark:bg-white/[0.03] border border-white/40 dark:border-white/[0.05] min-w-0">
            <p className="text-[8px] sm:text-[9px] font-semibold text-stone-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className={cn(
                'text-[11px] sm:text-xs font-semibold text-stone-700 dark:text-stone-300 truncate',
                mono && 'font-mono',
                capitalize && 'capitalize',
                valueClass
            )}>
                {value}
            </p>
        </div>
    );
}

export { CurrentLocationCard };
export default CurrentLocationCard;