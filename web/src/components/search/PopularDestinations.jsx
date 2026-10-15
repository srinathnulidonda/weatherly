// src/components/search/PopularDestinations.jsx
import { motion } from 'framer-motion';
import { Building2, Landmark, Cpu, Castle, Palmtree, BookOpen, Gem } from 'lucide-react';
import { cn } from '@/lib/cn';

const POPULAR_DESTINATIONS = [
    { name: 'Mumbai', country_code: 'IN', latitude: 19.0760, longitude: 72.8777, icon: Building2, color: 'from-blue-400/20 to-blue-500/5 text-blue-600 dark:text-blue-400' },
    { name: 'New Delhi', country_code: 'IN', latitude: 28.6139, longitude: 77.2090, icon: Landmark, color: 'from-orange-400/20 to-orange-500/5 text-orange-600 dark:text-orange-400' },
    { name: 'Bengaluru', country_code: 'IN', latitude: 12.9716, longitude: 77.5946, icon: Cpu, color: 'from-teal-400/20 to-teal-500/5 text-teal-600 dark:text-teal-400' },
    { name: 'Hyderabad', country_code: 'IN', latitude: 17.3850, longitude: 78.4867, icon: Gem, color: 'from-cyan-400/20 to-cyan-500/5 text-cyan-600 dark:text-cyan-400' },
    { name: 'Jaipur', country_code: 'IN', latitude: 26.9124, longitude: 75.7873, icon: Castle, color: 'from-pink-400/20 to-pink-500/5 text-pink-600 dark:text-pink-400' },
    { name: 'Goa', country_code: 'IN', latitude: 15.2993, longitude: 74.1240, icon: Palmtree, color: 'from-emerald-400/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400' },
    { name: 'Kolkata', country_code: 'IN', latitude: 22.5726, longitude: 88.3639, icon: BookOpen, color: 'from-violet-400/20 to-violet-500/5 text-violet-600 dark:text-violet-400' },
];

const listVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

function PopularDestinations({ onSelect, className, compact = false, hideLabel = false }) {
    return (
        <div className={className}>
            {!hideLabel && (
                <h2 className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 sm:mb-2 sm:text-xs">
                    Popular destinations
                </h2>
            )}
            <motion.div
                variants={listVariants}
                initial="hidden"
                animate="show"
                className={cn('grid gap-1.5 sm:gap-2.5', compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}
            >
                {POPULAR_DESTINATIONS.map((dest) => {
                    const Icon = dest.icon;
                    return (
                        <motion.button
                            key={dest.name}
                            type="button"
                            variants={itemVariants}
                            aria-label={`${dest.name}, ${dest.country_code}`}
                            onClick={() => onSelect(dest)}
                            className="group focus-ring relative flex flex-col items-start gap-2 overflow-hidden rounded-xl border border-stone-100 bg-white p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-soft dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-orange-500/20 sm:gap-2.5 sm:rounded-2xl sm:p-3.5"
                        >
                            <div
                                className={cn(
                                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br transition-transform duration-300 group-hover:scale-110 sm:h-9 sm:w-9 sm:rounded-xl',
                                    dest.color
                                )}
                                aria-hidden="true"
                            >
                                <Icon size={13} className="sm:hidden" />
                                <Icon size={15} className="hidden sm:block" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-[12.5px] font-semibold text-stone-900 dark:text-stone-100 sm:text-sm">
                                    {dest.name}
                                </p>
                                <p className="text-[9px] uppercase tracking-wide text-stone-400 sm:text-[10px]">{dest.country_code}</p>
                            </div>
                        </motion.button>
                    );
                })}
            </motion.div>
        </div>
    );
}

export { PopularDestinations };
export default PopularDestinations;