// web/src/components/common/LocationConfirmToast.jsx
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Check, Pencil } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { useStore } from '@/stores/store';

function LocationConfirmToast() {
    const { location, showLocationWarning, confirmCurrentLocation } = useLocation();
    const setLocationPanelOpen = useStore((s) => s.setLocationPanelOpen);

    return (
        <AnimatePresence>
            {showLocationWarning && location && (
                <motion.div
                    role="status"
                    aria-live="polite"
                    initial={{ y: -24, opacity: 0, scale: 0.96 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -24, opacity: 0, scale: 0.96 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 360 }}
                    className="glass-elevated flex items-center gap-3 px-4 py-3 rounded-3xl shadow-elevated"
                >
                    <div className="w-9 h-9 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0" aria-hidden="true">
                        <MapPin size={16} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                            Weather for <span className="font-semibold">{location.city || 'your area'}</span>?
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">Detected from your IP address</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={confirmCurrentLocation}
                            className="w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors"
                            aria-label="Confirm location"
                        >
                            <Check size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setLocationPanelOpen(true)}
                            className="w-9 h-9 rounded-full bg-stone-900/5 dark:bg-white/[0.08] hover:bg-stone-900/10 dark:hover:bg-white/[0.14] text-stone-600 dark:text-stone-300 flex items-center justify-center transition-colors"
                            aria-label="Change location"
                        >
                            <Pencil size={13} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export { LocationConfirmToast };
export default LocationConfirmToast;