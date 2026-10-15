// src/pages/Search.jsx
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Clock, X, MapPinOff, Sparkles, MapPin, Navigation, ChevronRight, CheckCircle2 } from 'lucide-react';
import { PageTransition } from '@/components/common/PageTransition';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { LocationResultsList } from '@/components/common/LocationResultsList';
import { PopularDestinations } from '@/components/search/PopularDestinations';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { useLocation } from '@/hooks/useLocation';
import { useStore } from '@/stores/store';
import { STORAGE_KEYS } from '@/utils/constants';
import { getFlagEmoji } from '@/utils/flags';
import { cn } from '@/lib/cn';

function loadRecent() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES) || '[]');
    } catch {
        return [];
    }
}

const listVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.035 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
};

function SectionLabel({ children, icon: Icon, action }) {
    return (
        <div className="flex items-center justify-between px-1">
            <h2 className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 sm:gap-1.5 sm:text-xs">
                {Icon ? <Icon size={11} aria-hidden="true" /> : null}
                {children}
            </h2>
            {action}
        </div>
    );
}

function Search() {
    const addSavedLocation = useStore((s) => s.addSavedLocation);
    const setActiveLocationId = useStore((s) => s.setActiveLocationId);
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);
    const { results, loading, error } = useLocationSearch(query, { limit: 8 });
    const [recentSearches, setRecentSearches] = useState(loadRecent);
    const inputRef = useRef(null);

    const { location, locationLoading, locationConfirmed, refreshLocation, cityDisplay } = useLocation();

    const trimmed = query.trim();
    const showRecent = !trimmed && recentSearches.length > 0;
    const showFirstRun = !trimmed && recentSearches.length === 0;
    const showLoading = trimmed.length >= 2 && loading;
    const showResults = trimmed.length >= 2 && !loading && !error && results.length > 0;
    const showNoResults = trimmed.length >= 2 && !loading && !error && results.length === 0;
    const showError = trimmed.length >= 2 && !loading && !!error;

    const selectLocation = useCallback((loc) => {
        const id = addSavedLocation(loc);
        setActiveLocationId(id);

        const entry = { name: loc.name || loc.city, latitude: loc.latitude, longitude: loc.longitude, country_code: loc.country_code };
        const updated = [entry, ...recentSearches.filter((r) => !(Math.abs(r.latitude - loc.latitude) < 0.01 && Math.abs(r.longitude - loc.longitude) < 0.01))].slice(0, 8);
        setRecentSearches(updated);
        localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
        setQuery('');
        navigate('/');
    }, [addSavedLocation, setActiveLocationId, recentSearches, navigate]);

    const handleUseCurrentLocation = useCallback(() => {
        setActiveLocationId('current');
        if (!location) refreshLocation();
        navigate('/');
    }, [location, refreshLocation, setActiveLocationId, navigate]);

    const clearRecent = useCallback(() => {
        setRecentSearches([]);
        localStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
    }, []);

    const removeRecent = useCallback((idx, e) => {
        e?.stopPropagation();
        setRecentSearches((prev) => {
            const next = prev.filter((_, i) => i !== idx);
            localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(next));
            return next;
        });
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && results.length === 1) {
            selectLocation(results[0]);
        }
        if (e.key === 'Escape') {
            setQuery('');
            inputRef.current?.blur();
        }
    }, [results, selectLocation]);

    const handleRecentKeyDown = useCallback((e, item) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectLocation(item);
        }
    }, [selectLocation]);

    return (
        <PageTransition className="page-shell stack-y">
            <header className="space-y-0.5 text-center sm:space-y-1 sm:text-left">
                <h1 className="page-heading">Search</h1>
                <p className="text-[12.5px] text-stone-500 dark:text-stone-400 sm:text-sm">
                    Find real-time weather for any city, town, or place worldwide.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
                <div className="min-w-0 space-y-4 sm:space-y-6">
                    {/* Unified search + quick-location card */}
                    <div className="sticky top-[calc(var(--topbar-h)+env(safe-area-inset-top,0px))] md:top-0 z-10 -mx-1 bg-stone-50/90 px-1 pb-2 pt-1 backdrop-blur-xl dark:bg-stone-950/90 sm:pb-3">
                        <div
                            className={cn(
                                'glass-elevated overflow-hidden rounded-2xl !p-0 transition-shadow duration-300 sm:rounded-3xl',
                                focused && 'ring-2 ring-orange-500/30'
                            )}
                        >
                            <div className="flex items-center gap-2 px-2 py-2 sm:gap-2.5 sm:px-2.5 sm:py-2.5">
                                <div
                                    className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-md shadow-orange-500/25 transition-transform duration-300 sm:h-10 sm:w-10 sm:rounded-2xl',
                                        focused && 'scale-105'
                                    )}
                                >
                                    <SearchIcon size={14} className="text-white sm:h-4 sm:w-4" />
                                </div>
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => setFocused(false)}
                                    placeholder="Search for a city, town, or place…"
                                    aria-label="Search location"
                                    autoFocus
                                    className="min-w-0 flex-1 bg-transparent text-[13.5px] text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-600 sm:text-[15px]"
                                />
                                <AnimatePresence>
                                    {query && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            type="button"
                                            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                                            aria-label="Clear search"
                                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-900/5 hover:text-stone-600 dark:hover:bg-white/[0.08] dark:hover:text-stone-300 sm:h-8 sm:w-8"
                                        >
                                            <X size={13} aria-hidden="true" />
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>

                            {!trimmed && (
                                <>
                                    <div className="h-px bg-stone-200/70 dark:bg-white/[0.07]" />
                                    <button
                                        onClick={handleUseCurrentLocation}
                                        disabled={locationLoading}
                                        className={cn(
                                            'group flex w-full items-center gap-2.5 px-2.5 py-2.5 text-left transition-colors duration-150 sm:gap-3 sm:px-3 sm:py-3',
                                            'hover:bg-orange-500/[0.05] dark:hover:bg-orange-500/[0.06]',
                                            locationLoading && 'pointer-events-none opacity-70'
                                        )}
                                    >
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 sm:h-8 sm:w-8 sm:rounded-xl">
                                            <Navigation size={13} className={cn('text-orange-500', locationLoading && 'animate-pulse')} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[12.5px] font-semibold text-stone-900 dark:text-stone-100 sm:text-sm">
                                                {locationLoading ? 'Detecting your location…' : 'Use my current location'}
                                            </p>
                                            {locationConfirmed && cityDisplay && !locationLoading && (
                                                <p className="flex items-center gap-1 truncate text-[10px] text-stone-500 dark:text-stone-400 sm:text-xs">
                                                    <CheckCircle2 size={9} className="shrink-0 text-green-500" />
                                                    {cityDisplay}
                                                </p>
                                            )}
                                        </div>
                                        <ChevronRight size={14} className="shrink-0 text-stone-300 transition-transform duration-200 group-hover:translate-x-0.5 dark:text-stone-600" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {showLoading && (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-1.5 sm:space-y-2">
                                {Array.from({ length: 5 }).map((_, i) => (<SkeletonRow key={i} />))}
                            </motion.div>
                        )}

                        {showResults && (
                            <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-1.5 sm:space-y-2">
                                <SectionLabel>
                                    {results.length} Result{results.length !== 1 ? 's' : ''}
                                </SectionLabel>
                                <Card padding={false} className="overflow-hidden">
                                    <LocationResultsList results={results} showAddress showFlag onSelect={selectLocation} />
                                </Card>
                            </motion.div>
                        )}

                        {showError && (
                            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <ErrorState error={error} compact />
                            </motion.div>
                        )}

                        {showNoResults && (
                            <motion.div key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <EmptyState
                                    icon={MapPinOff}
                                    title="No locations found"
                                    description={`No results for "${trimmed}". Try a different spelling or a nearby city.`}
                                />
                            </motion.div>
                        )}

                        {showRecent && (
                            <motion.div key="recent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2 sm:space-y-3">
                                <SectionLabel
                                    icon={Clock}
                                    action={
                                        <button
                                            type="button"
                                            onClick={clearRecent}
                                            className="rounded-lg px-2 py-1 text-[10px] font-semibold text-stone-400 transition-colors hover:text-red-500 sm:text-xs"
                                        >
                                            Clear all
                                        </button>
                                    }
                                >
                                    Recent
                                </SectionLabel>

                                <motion.div
                                    variants={listVariants}
                                    initial="hidden"
                                    animate="show"
                                    className="xs:grid-cols-2 grid grid-cols-1 gap-1.5 sm:gap-2"
                                >
                                    {recentSearches.map((r, idx) => {
                                        const flag = getFlagEmoji(r.country_code);
                                        return (
                                            <motion.div
                                                key={`${r.latitude}-${r.longitude}-${idx}`}
                                                variants={itemVariants}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => selectLocation(r)}
                                                onKeyDown={(e) => handleRecentKeyDown(e, r)}
                                                className="group focus-ring relative flex min-h-[48px] cursor-pointer items-center gap-2.5 rounded-xl border border-stone-100 bg-white p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-soft dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-orange-500/20 sm:min-h-[56px] sm:gap-3 sm:rounded-2xl sm:p-3"
                                            >
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-stone-100 to-stone-200/60 text-[13px] dark:from-white/[0.06] dark:to-white/[0.02] sm:h-9 sm:w-9 sm:rounded-xl sm:text-base">
                                                    {flag || <Clock size={12} className="text-stone-400" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-[12.5px] font-semibold text-stone-900 dark:text-stone-100 sm:text-sm">
                                                        {r.name || r.city}
                                                    </p>
                                                    {r.country_code && (
                                                        <p className="text-[9px] uppercase tracking-wide text-stone-400 sm:text-[10px]">{r.country_code}</p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => removeRecent(idx, e)}
                                                    aria-label={`Remove ${r.name || r.city} from recent searches`}
                                                    className="min-touch flex !h-6 !w-6 shrink-0 items-center justify-center rounded-full text-stone-300 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100 sm:!h-7 sm:!w-7"
                                                >
                                                    <X size={11} aria-hidden="true" />
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            </motion.div>
                        )}

                        {showFirstRun && (
                            <motion.div key="first-run" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-5">
                                <div className="relative flex flex-col items-center overflow-hidden rounded-3xl py-7 text-center sm:py-10">
                                    <div
                                        className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/15 blur-3xl sm:h-56 sm:w-56"
                                        aria-hidden="true"
                                    />
                                    <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/25 animate-icon-float sm:mb-4 sm:h-16 sm:w-16">
                                        <Sparkles size={24} className="text-white sm:h-7 sm:w-7" />
                                    </div>
                                    <h3 className="relative text-[14px] font-semibold text-stone-900 dark:text-stone-100 sm:text-lg">
                                        Discover the weather anywhere
                                    </h3>
                                    <p className="relative mt-1 max-w-xs text-[11.5px] text-stone-500 dark:text-stone-400 sm:text-sm">
                                        Search for a city or explore popular destinations below.
                                    </p>
                                </div>
                                <div className="lg:hidden">
                                    <PopularDestinations onSelect={selectLocation} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <aside className="hidden space-y-4 lg:block lg:sticky lg:top-6 lg:self-start">
                    <Card padding="lg" className="relative overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600" aria-hidden="true" />
                        <h2 className="flex items-center gap-1.5 text-[13px] font-semibold text-stone-900 dark:text-stone-100 sm:text-sm">
                            <MapPin size={14} className="text-orange-500" aria-hidden="true" />
                            Popular destinations
                        </h2>
                        <div className="mt-2.5 sm:mt-3">
                            <PopularDestinations onSelect={selectLocation} compact hideLabel />
                        </div>
                        <p className="mt-3 border-t border-stone-100 px-0.5 pt-3 text-[10.5px] leading-relaxed text-stone-400 dark:border-white/[0.06] dark:text-stone-500">
                            Tap a city to add it instantly and jump to its current conditions.
                        </p>
                    </Card>
                </aside>
            </div>
        </PageTransition>
    );
}

export default Search;