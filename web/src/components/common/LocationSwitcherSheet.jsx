// web/src/components/common/LocationSwitcherSheet.jsx
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Navigation, X, MapPin, Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useStore } from '@/stores/store';
import { useLocation } from '@/hooks/useLocation';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { LocationResultsList } from '@/components/common/LocationResultsList';

function LocationSwitcherSheet() {
    const open = useStore((s) => s.locationPanelOpen);
    const setOpen = useStore((s) => s.setLocationPanelOpen);
    const savedLocations = useStore((s) => s.savedLocations);
    const activeLocationId = useStore((s) => s.activeLocationId);
    const setActiveLocationId = useStore((s) => s.setActiveLocationId);
    const addSavedLocation = useStore((s) => s.addSavedLocation);
    const { location, locationLoading, refreshLocation, cityDisplay } = useLocation();

    const [query, setQuery] = useState('');
    const { results, loading, error } = useLocationSearch(query, { limit: 8 });
    const inputRef = useRef(null);

    useEffect(() => {
        if (!open) {
            setQuery('');
            return;
        }
        const t = setTimeout(() => inputRef.current?.focus(), 180);
        return () => clearTimeout(t);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        function onKey(e) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, setOpen]);

    useEffect(() => {
        if (!open) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = original; };
    }, [open]);

    const handleUseCurrent = () => {
        setActiveLocationId('current');
        if (!location) refreshLocation();
        setOpen(false);
    };

    const handleSelectSaved = (id) => {
        setActiveLocationId(id);
        setOpen(false);
    };

    const handleSelectResult = (result) => {
        const id = addSavedLocation(result);
        setActiveLocationId(id);
        setOpen(false);
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-panel bg-stone-900/40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setOpen(false)}
                    />

                    {/* Floating panel — always centered, viewport-safe */}
                    <div className="fixed inset-0 z-panel flex items-start justify-center pointer-events-none px-4"
                        style={{
                            paddingTop: 'calc(var(--topbar-h, 56px) + env(safe-area-inset-top, 0px) + 0.625rem)',
                        }}
                    >
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-label="Switch location"
                            initial={{ opacity: 0, scale: 0.95, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -8 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 400 }}
                            className={cn(
                                'pointer-events-auto w-full max-w-md flex flex-col glass-elevated overflow-hidden',
                                'rounded-2xl sm:rounded-3xl',
                            )}
                            style={{
                                maxHeight: 'min(72vh, 72dvh, 520px)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Search bar */}
                            <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-stone-200/60 dark:border-white/[0.06] shrink-0">
                                <Search size={14} className="text-stone-400 shrink-0" />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search for a city..."
                                    className="flex-1 min-w-0 bg-transparent text-[13px] sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none"
                                />
                                {loading && (
                                    <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-stone-400/30 border-t-stone-400 rounded-full animate-spin shrink-0" />
                                )}
                                <button
                                    onClick={() => setOpen(false)}
                                    className="min-touch shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-stone-900/5 dark:hover:bg-white/[0.06] transition-colors"
                                    aria-label="Close"
                                >
                                    <X size={13} className="text-stone-400" />
                                </button>
                            </div>

                            {/* Scrollable content */}
                            <div className="overflow-y-auto overscroll-contain scrollbar-thin flex-1 min-h-0">
                                {/* Use current location */}
                                <button
                                    onClick={handleUseCurrent}
                                    disabled={locationLoading}
                                    className="min-touch w-full flex items-center gap-2.5 px-3 sm:px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-white/[0.03] active:bg-stone-100 dark:active:bg-white/[0.05] transition-colors border-b border-stone-100 dark:border-white/[0.04]"
                                >
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                                        <Navigation
                                            size={13}
                                            className={cn('text-orange-500', locationLoading && 'animate-pulse')}
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[13px] sm:text-sm font-medium text-orange-600 dark:text-orange-400 block">
                                            {locationLoading ? 'Detecting your location…' : 'Use current location'}
                                        </span>
                                        {activeLocationId === 'current' && location && (
                                            <span className="text-[11px] sm:text-xs text-stone-400 truncate block mt-0.5">
                                                {cityDisplay}
                                            </span>
                                        )}
                                    </div>
                                    {activeLocationId === 'current' && (
                                        <Star size={12} className="text-orange-500 fill-orange-500 shrink-0" />
                                    )}
                                </button>

                                {/* Saved locations */}
                                {!query && savedLocations.length > 0 && (
                                    <div>
                                        <p className="px-3 sm:px-4 pt-2.5 pb-1 text-[9px] sm:text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                                            Saved
                                        </p>
                                        {savedLocations.map((loc) => (
                                            <button
                                                key={loc.id}
                                                onClick={() => handleSelectSaved(loc.id)}
                                                className="w-full flex items-center gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-stone-50 dark:hover:bg-white/[0.03] active:bg-stone-100 dark:active:bg-white/[0.05] transition-colors min-h-[44px]"
                                            >
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-stone-100 dark:bg-white/[0.05] flex items-center justify-center shrink-0">
                                                    <MapPin size={12} className="text-stone-400" />
                                                </div>
                                                <span className="text-[13px] sm:text-sm font-medium text-stone-800 dark:text-stone-200 truncate flex-1">
                                                    {loc.city || loc.name}
                                                </span>
                                                {activeLocationId === loc.id && (
                                                    <Star size={12} className="text-orange-500 fill-orange-500 shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Search results */}
                                {query.length >= 2 && (
                                    <div>
                                        {results.length > 0 ? (
                                            <>
                                                <p className="px-3 sm:px-4 pt-2.5 pb-1 text-[9px] sm:text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                                                    {results.length} Result{results.length !== 1 ? 's' : ''}
                                                </p>
                                                <LocationResultsList
                                                    results={results}
                                                    onSelect={handleSelectResult}
                                                    showAddress
                                                />
                                            </>
                                        ) : error ? (
                                            <p className="px-4 py-5 text-center text-[13px] sm:text-sm text-red-500">
                                                Search failed. Please try again.
                                            </p>
                                        ) : !loading ? (
                                            <p className="px-4 py-5 text-center text-[13px] sm:text-sm text-stone-400">
                                                No results for "{query}"
                                            </p>
                                        ) : null}
                                    </div>
                                )}

                                <div className="h-1" />
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}

export { LocationSwitcherSheet };
export default LocationSwitcherSheet;