// web/src/components/search/PopularDestinations.jsx
import { motion } from 'framer-motion';
import { Building2, Landmark, Cpu, Castle, Palmtree, BookOpen, Gem, MapPin } from 'lucide-react';
import { cn } from '@/lib/cn';

const POPULAR_DESTINATIONS = [
    { name: 'Mumbai', country_code: 'IN', latitude: 19.0760, longitude: 72.8777, icon: Building2, color: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { name: 'New Delhi', country_code: 'IN', latitude: 28.6139, longitude: 77.2090, icon: Landmark, color: 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' },
    { name: 'Bengaluru', country_code: 'IN', latitude: 12.9716, longitude: 77.5946, icon: Cpu, color: 'bg-teal-100 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400' },
    { name: 'Hyderabad', country_code: 'IN', latitude: 17.3850, longitude: 78.4867, icon: Gem, color: 'bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
    { name: 'Jaipur', country_code: 'IN', latitude: 26.9124, longitude: 75.7873, icon: Castle, color: 'bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400' },
    { name: 'Goa', country_code: 'IN', latitude: 15.2993, longitude: 74.1240, icon: Palmtree, color: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { name: 'Kolkata', country_code: 'IN', latitude: 22.5726, longitude: 88.3639, icon: BookOpen, color: 'bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400' },
];

function PopularDestinations({ onSelect, className, compact = false, hideLabel = false }) {
    return (
        <div className={className}>
            {!hideLabel && (
                <h2 className="text-[10px] sm:text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-1 mb-1.5 sm:mb-2 flex items-center gap-1 sm:gap-1.5">
                    <MapPin size={11} aria-hidden="true" /> Popular Destinations
                </h2>
            )}
            <div className={cn('grid gap-2 sm:gap-2.5', compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}>
                {POPULAR_DESTINATIONS.map((dest, i) => {
                    const Icon = dest.icon;
                    return (
                        <motion.button
                            key={dest.name}
                            type="button"
                            aria-label={`${dest.name}, ${dest.country_code}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.3 }}
                            onClick={() => onSelect(dest)}
                            className="flex flex-col items-start gap-2 sm:gap-2.5 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white dark:bg-white/[0.03] border border-stone-100 dark:border-white/[0.06] hover:border-orange-200 dark:hover:border-orange-500/20 hover:-translate-y-0.5 hover:shadow-soft transition-all duration-200 text-left focus-ring"
                        >
                            <div className={cn('w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0', dest.color)} aria-hidden="true">
                                <Icon size={15} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[13px] sm:text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                                    {dest.name}
                                </p>
                                <p className="text-[9px] sm:text-[10px] text-stone-400 uppercase tracking-wide">{dest.country_code}</p>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

export { PopularDestinations };
export default PopularDestinations;