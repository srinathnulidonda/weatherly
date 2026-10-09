// web/src/pages/Search.jsx
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Clock, X, MapPinOff, Sparkles } from 'lucide-react';
import { PageTransition } from '@/components/common/PageTransition';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { LocationResultsList } from '@/components/common/LocationResultsList';
import { PopularDestinations } from '@/components/search/PopularDestinations';
import { QuickLocationCard } from '@/components/search/QuickLocationCard';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { useLocation } from '@/hooks/useLocation';
import { useStore } from '@/stores/store';
import { STORAGE_KEYS } from '@/utils/constants';
import { getFlagEmoji } from '@/utils/flags';

function loadRecent() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES) || '[]');
    } catch {
        return [];
    }
}

function Search() {
    const addSavedLocation = useStore((s) => s.addSavedLocation);
    const setActiveLocationId = useStore((s) => s.setActiveLocationId);
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
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
        <PageTransition className="page-shell">
            <div className="stack-y max-w-2xl mx-auto !gap-3 sm:!gap-4">
                <div className="flex justify-center xs:justify-start">
                    <span className="inline-flex items-center px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-stone-100 dark:bg-white/[0.06] text-[10px] sm:text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                        Search Location
                    </span>
                </div>

                <div className="sticky top-[calc(var(--topbar-h)+env(safe-area-inset-top,0px))] md:top-0 z-10 -mx-1 px-1 pt-1 pb-2 sm:pb-3 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-xl">
                    <Input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search for a city, town, or place..."
                        icon={SearchIcon}
                        label="Search location"
                        className="h-11 sm:h-12 text-sm sm:text-base rounded-2xl sm:rounded-3xl border-stone-200 dark:border-white/[0.10] shadow-sm"
                        iconRight={query ? () => (
                            <button
                                type="button"
                                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                                aria-label="Clear search"
                                className="min-touch !w-9 !h-9 sm:!w-11 sm:!h-11 flex items-center justify-center -mr-2.5 sm:-mr-3 rounded-full hover:bg-stone-900/5 dark:hover:bg-white/[0.06] transition-colors"
                            >
                                <X size={13} className="text-stone-400 hover:text-stone-600 transition-colors" aria-hidden="true" />
                            </button>
                        ) : undefined}
                        autoFocus
                    />

                    {!trimmed && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 sm:mt-2.5"
                        >
                            <QuickLocationCard
                                loading={locationLoading}
                                confirmed={locationConfirmed}
                                cityDisplay={cityDisplay}
                                onUse={handleUseCurrentLocation}
                            />
                        </motion.div>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {showLoading && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-1.5 sm:space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (<SkeletonRow key={i} />))}
                        </motion.div>
                    )}

                    {showResults && (
                        <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                            <div className="flex items-center justify-between px-1 mb-1.5 sm:mb-2">
                                <p className="text-[10px] sm:text-xs font-semibold text-stone-400 uppercase tracking-wider">
                                    {results.length} Result{results.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <Card padding={false}>
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
                        <motion.div key="recent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="stack-y !gap-2 sm:!gap-3">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-[10px] sm:text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-1 sm:gap-1.5">
                                    <Clock size={11} aria-hidden="true" /> Recent
                                </h2>
                                <button
                                    type="button"
                                    onClick={clearRecent}
                                    className="text-[10px] sm:text-xs font-medium text-stone-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg"
                                >
                                    Clear all
                                </button>
                            </div>

                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-1.5 sm:gap-2">
                                {recentSearches.map((r, idx) => {
                                    const flag = getFlagEmoji(r.country_code);
                                    return (
                                        <motion.div
                                            key={`${r.latitude}-${r.longitude}-${idx}`}
                                            role="button"
                                            tabIndex={0}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.03 }}
                                            onClick={() => selectLocation(r)}
                                            onKeyDown={(e) => handleRecentKeyDown(e, r)}
                                            className="group relative flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-white/[0.03] border border-stone-100 dark:border-white/[0.06] hover:border-orange-200 dark:hover:border-orange-500/20 hover:bg-orange-50/50 dark:hover:bg-orange-500/[0.04] transition-all duration-200 text-left min-h-[52px] sm:min-h-[60px] focus-ring cursor-pointer"
                                        >
                                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-stone-100 dark:bg-white/[0.05] flex items-center justify-center shrink-0 text-sm sm:text-base" aria-hidden="true">
                                                {flag || <Clock size={13} className="text-stone-400" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] sm:text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                                                    {r.name || r.city}
                                                </p>
                                                {r.country_code && (
                                                    <p className="text-[9px] sm:text-[10px] text-stone-400 uppercase tracking-wide">{r.country_code}</p>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => removeRecent(idx, e)}
                                                aria-label={`Remove ${r.name || r.city} from recent searches`}
                                                className="opacity-0 group-hover:opacity-100 min-touch !w-7 !h-7 sm:!w-8 sm:!h-8 flex items-center justify-center rounded-full text-stone-300 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
                                            >
                                                <X size={12} aria-hidden="true" />
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {showFirstRun && (
                        <motion.div key="first-run" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="stack-y !gap-3 sm:!gap-4">
                            <div className="flex flex-col items-center text-center py-4 sm:py-6">
                                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-orange-400/20 to-orange-600/10 flex items-center justify-center mb-2.5 sm:mb-3" aria-hidden="true">
                                    <Sparkles size={20} className="text-orange-500 sm:w-6 sm:h-6" />
                                </div>
                                <h3 className="text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-200">Discover the weather anywhere</h3>
                                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-xs">
                                    Search for a city or explore popular destinations below.
                                </p>
                            </div>
                            <PopularDestinations onSelect={selectLocation} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
}

export default Search;