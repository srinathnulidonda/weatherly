// web/src/components/home/LocationPager.jsx
import { useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, MapPin, Star, Trash2, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useStore } from '@/stores/store';
import { useWeatherAt } from '@/hooks/useWeather';
import { formatTemp } from '@/utils/formatters';

const MAX_LIVE_TEMP_CHIPS = 8;

function LocationChip({ id, label, lat, lon, active, isCurrent, fetchEnabled, units, onSelect, onContextMenu }) {
    const { data } = useWeatherAt(lat, lon, { enabled: fetchEnabled && lat != null && lon != null });
    const chipRef = useRef(null);
    const timerRef = useRef(null);
    const triggeredRef = useRef(false);

    const handleLongPress = useCallback(() => {
        const rect = chipRef.current?.getBoundingClientRect();
        if (!rect) return;
        onContextMenu({ id, isCurrent, x: Math.min(rect.left, window.innerWidth - 208), y: rect.bottom + 8 });
    }, [id, isCurrent, onContextMenu]);

    const startPress = useCallback(() => {
        triggeredRef.current = false;
        timerRef.current = setTimeout(() => {
            triggeredRef.current = true;
            handleLongPress();
        }, 480);
    }, [handleLongPress]);

    const clearPress = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    const handleClick = useCallback(() => {
        if (!triggeredRef.current) onSelect(id);
    }, [id, onSelect]);

    return (
        <button
            ref={chipRef}
            onClick={handleClick}
            onPointerDown={startPress}
            onPointerUp={clearPress}
            onPointerLeave={clearPress}
            className={cn(
                'flex items-center gap-1 sm:gap-2 pl-2 pr-2.5 sm:pl-3 sm:pr-4 h-7 sm:h-9 rounded-full shrink-0 snap-start transition-all duration-200 border select-none touch-none active:scale-[0.97] focus-ring sm:min-touch',
                active
                    ? 'bg-orange-500 text-white border-transparent shadow-soft'
                    : 'bg-white dark:bg-white/[0.04] text-stone-600 dark:text-stone-300 border-stone-200 dark:border-white/[0.08] hover:border-stone-300 dark:hover:border-white/[0.14]'
            )}
        >
            <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap">{label}</span>
            {data?.temperature_c != null && (
                <span className="text-[10px] sm:text-xs font-bold tabular-nums opacity-90">{formatTemp(data.temperature_c, units)}</span>
            )}
        </button>
    );
}

function LocationContextMenu({ target, onClose }) {
    const setActiveLocationId = useStore((s) => s.setActiveLocationId);
    const removeSavedLocation = useStore((s) => s.removeSavedLocation);

    if (typeof document === 'undefined' || !target) return null;

    const items = [
        {
            icon: Star,
            label: 'Set as default',
            onClick: () => { setActiveLocationId(target.id); onClose(); },
            hidden: target.isCurrent,
        },
        {
            icon: Navigation,
            label: 'View weather',
            onClick: () => { setActiveLocationId(target.id); onClose(); },
        },
        {
            icon: Trash2,
            label: 'Remove',
            danger: true,
            onClick: () => { removeSavedLocation(target.id); onClose(); },
            hidden: target.isCurrent,
        },
    ].filter((i) => !i.hidden);

    return createPortal(
        <AnimatePresence>
            <motion.div className="fixed inset-0 z-modal bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 8 }}
                transition={{ type: 'spring', damping: 26, stiffness: 420 }}
                style={{ position: 'fixed', top: target.y, left: target.x }}
                className="z-menu w-48 rounded-3xl glass-elevated overflow-hidden py-1.5"
            >
                {items.map((item) => (
                    <button
                        key={item.label}
                        onClick={item.onClick}
                        className={cn(
                            'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-left transition-colors min-touch focus-ring',
                            item.danger ? 'text-red-500 hover:bg-red-500/10' : 'text-stone-700 dark:text-stone-300 hover:bg-stone-900/5 dark:hover:bg-white/[0.05]'
                        )}
                    >
                        <item.icon size={15} />
                        {item.label}
                    </button>
                ))}
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}

function LocationPager({ className }) {
    const units = useStore((s) => s.units);
    const location = useStore((s) => s.location);
    const locationConfirmed = useStore((s) => s.locationConfirmed);
    const savedLocations = useStore((s) => s.savedLocations);
    const activeLocationId = useStore((s) => s.activeLocationId);
    const setActiveLocationId = useStore((s) => s.setActiveLocationId);
    const navigate = useNavigate();
    const [menuTarget, setMenuTarget] = useState(null);

    const handleSelect = useCallback((id) => setActiveLocationId(id), [setActiveLocationId]);

    if (!locationConfirmed || !location) {
        return (
            <div className={cn('flex items-center', className)}>
                <button
                    onClick={() => navigate('/search')}
                    className="flex items-center gap-1 h-7 sm:h-9 px-2.5 sm:px-4 rounded-full border border-dashed border-stone-300 dark:border-white/[0.15] text-[10px] sm:text-xs font-semibold text-stone-400 hover:text-orange-500 hover:border-orange-500/40 transition-all duration-200 active:scale-[0.97] sm:min-touch focus-ring"
                >
                    <Plus size={11} /> Add a location
                </button>
            </div>
        );
    }

    return (
        <>
            <div className={cn('flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory', className)}>
                <LocationChip
                    id="current"
                    label={location.city || 'Current'}
                    lat={location.latitude}
                    lon={location.longitude}
                    active={activeLocationId === 'current'}
                    isCurrent
                    fetchEnabled={0 < MAX_LIVE_TEMP_CHIPS}
                    units={units}
                    onSelect={handleSelect}
                    onContextMenu={setMenuTarget}
                />
                {savedLocations.map((loc, i) => (
                    <LocationChip
                        key={loc.id}
                        id={loc.id}
                        label={loc.city || loc.name}
                        lat={loc.latitude}
                        lon={loc.longitude}
                        active={activeLocationId === loc.id}
                        fetchEnabled={i + 1 < MAX_LIVE_TEMP_CHIPS}
                        units={units}
                        onSelect={handleSelect}
                        onContextMenu={setMenuTarget}
                    />
                ))}
                <button
                    onClick={() => navigate('/search')}
                    className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-dashed border-stone-300 dark:border-white/[0.15] text-stone-400 hover:text-orange-500 hover:border-orange-500/40 transition-all duration-200 active:scale-[0.97] shrink-0 sm:min-touch focus-ring"
                    aria-label="Add location"
                >
                    <Plus size={12} />
                </button>
            </div>

            {menuTarget && <LocationContextMenu target={menuTarget} onClose={() => setMenuTarget(null)} />}
        </>
    );
}

export { LocationPager };
export default LocationPager;