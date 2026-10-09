// web/src/components/search/PopularDestinations.jsx
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

const POPULAR_DESTINATIONS = [
    { name: 'New York', country_code: 'US', latitude: 40.7128, longitude: -74.0060, emoji: '🗽' },
    { name: 'London', country_code: 'GB', latitude: 51.5074, longitude: -0.1278, emoji: '🎡' },
    { name: 'Tokyo', country_code: 'JP', latitude: 35.6762, longitude: 139.6503, emoji: '🗼' },
    { name: 'Paris', country_code: 'FR', latitude: 48.8566, longitude: 2.3522, emoji: '🥐' },
    { name: 'Dubai', country_code: 'AE', latitude: 25.2048, longitude: 55.2708, emoji: '🏙️' },
    { name: 'Sydney', country_code: 'AU', latitude: -33.8688, longitude: 151.2093, emoji: '🌊' },
];

function PopularDestinations({ onSelect, className }) {
    return (
        <div className={className}>
            <h2 className="text-[10px] sm:text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-1 mb-1.5 sm:mb-2 flex items-center gap-1 sm:gap-1.5">
                <MapPin size={11} aria-hidden="true" /> Popular Destinations
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {POPULAR_DESTINATIONS.map((dest, i) => (
                    <motion.button
                        key={dest.name}
                        type="button"
                        aria-label={`${dest.name}, ${dest.country_code}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        onClick={() => onSelect(dest)}
                        className="relative flex flex-col items-start gap-1.5 sm:gap-2 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white dark:bg-white/[0.03] border border-stone-100 dark:border-white/[0.06] hover:border-orange-200 dark:hover:border-orange-500/20 hover:-translate-y-0.5 hover:shadow-soft transition-all duration-200 text-left overflow-hidden group focus-ring"
                    >
                        <div className="absolute -right-2 -top-2 text-3xl sm:text-4xl opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-300" aria-hidden="true">
                            {dest.emoji}
                        </div>
                        <span className="text-base sm:text-xl relative z-10" aria-hidden="true">{dest.emoji}</span>
                        <div className="relative z-10 min-w-0">
                            <p className="text-[13px] sm:text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                                {dest.name}
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-stone-400 uppercase tracking-wide">{dest.country_code}</p>
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

export { PopularDestinations };
export default PopularDestinations;