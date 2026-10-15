// src/components/analytics/CompareCard.jsx
import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, MapPin, Flame, Snowflake, RotateCcw, Gauge, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { ErrorState } from '../ui/ErrorState';
import { SkeletonRow } from '../ui/Skeleton';
import { WeatherIcon } from '../ui/WeatherIcon';
import { LocationResultsList } from '../common/LocationResultsList';
import { useWeatherCompare } from '@/hooks/useAnalytics';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { useStore } from '@/stores/store';
import { getConditionKey } from '@/lib/weatherCondition';
import { formatTemp, formatWind, formatPercent } from '@/utils/formatters';
import { cn } from '@/lib/cn';

const QUICK_ADD = [
    { name: 'Mumbai', country_code: 'IN', latitude: 19.0760, longitude: 72.8777 },
    { name: 'New Delhi', country_code: 'IN', latitude: 28.6139, longitude: 77.2090 },
    { name: 'Bengaluru', country_code: 'IN', latitude: 12.9716, longitude: 77.5946 },
    { name: 'Goa', country_code: 'IN', latitude: 15.2993, longitude: 74.1240 },
];

const RANK_STYLES = [
    'bg-amber-400/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-400/30',
    'bg-stone-300/20 text-stone-500 dark:text-stone-400 ring-1 ring-stone-300/30',
    'bg-orange-700/10 text-orange-700/80 dark:text-orange-400/70 ring-1 ring-orange-700/20',
];

const listVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

function StatPill({ icon: Icon, label, value }) {
    return (
        <div className="flex flex-1 flex-col items-center gap-0.5 rounded-xl bg-stone-50 py-2.5 dark:bg-white/[0.03]">
            <Icon size={13} className="text-stone-400" />
            <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">{value}</span>
            <span className="text-[9.5px] font-medium uppercase tracking-wide text-stone-400">{label}</span>
        </div>
    );
}

function RangeTrack({ value, min, max, allValues }) {
    const pct = (v) => (max === min ? 50 : ((v - min) / (max - min)) * 100);
    return (
        <div className="relative mt-2.5 h-1.5 w-full rounded-full bg-gradient-to-r from-sky-400/60 via-amber-300/60 to-orange-500/60">
            {allValues.map((v, i) => (
                <span
                    key={i}
                    className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 dark:bg-stone-950/50"
                    style={{ left: `${pct(v)}%` }}
                />
            ))}
            <span
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-stone-900 shadow-sm dark:border-stone-950 dark:bg-white"
                style={{ left: `${pct(value)}%` }}
            />
        </div>
    );
}

function CompareCard({ className }) {
    const [locations, setLocations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { results: searchResults } = useLocationSearch(searchQuery, { limit: 5 });
    const units = useStore((s) => s.units);

    const { compare, data: compareData, isLoading, error, reset } = useWeatherCompare();

    const addLocation = useCallback((loc) => {
        setLocations((prev) => {
            if (prev.length >= 5) return prev;
            const exists = prev.some(
                (l) => Math.abs(l.latitude - loc.latitude) < 0.01 && Math.abs(l.longitude - loc.longitude) < 0.01
            );
            if (exists) return prev;
            return [...prev, {
                latitude: loc.latitude,
                longitude: loc.longitude,
                name: loc.name || loc.city || `${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)}`,
            }];
        });
        setSearchQuery('');
        reset();
    }, [reset]);

    const removeLocation = useCallback((index) => {
        setLocations((prev) => prev.filter((_, i) => i !== index));
        reset();
    }, [reset]);

    const handleCompare = useCallback(() => {
        if (locations.length < 2) return;
        compare(locations);
    }, [locations, compare]);

    const handleReset = useCallback(() => {
        setLocations([]);
        setSearchQuery('');
        reset();
    }, [reset]);

    const hasComparisons = !!compareData?.comparisons?.length;
    const isEmptyResult = !!compareData && !hasComparisons;

    const ranked = useMemo(() => {
        if (!hasComparisons) return [];
        return [...compareData.comparisons]
            .filter((c) => c.current?.temperature_c != null)
            .sort((a, b) => b.current.temperature_c - a.current.temperature_c);
    }, [hasComparisons, compareData]);

    const stats = useMemo(() => {
        if (!ranked.length) return null;
        const temps = ranked.map((c) => c.current.temperature_c);
        const min = Math.min(...temps);
        const max = Math.max(...temps);
        const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
        return { min, max, avg, spread: max - min, temps };
    }, [ranked]);

    return (
        <Card className={className}>
            <CardHeader>
                <div>
                    <CardTitle>Compare Locations</CardTitle>
                    <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
                        {hasComparisons ? 'Ranked warmest to coolest' : 'See how current conditions stack up'}
                    </p>
                </div>
                <Badge variant={locations.length >= 5 ? 'warning' : 'default'} size="sm">
                    {locations.length}/5
                </Badge>
            </CardHeader>

            <div className="space-y-3">
                {locations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {locations.map((loc, i) => (
                            <motion.div
                                key={`${loc.latitude}-${loc.longitude}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex h-8 items-center gap-1.5 rounded-full bg-stone-100 pl-1 pr-1.5 text-xs font-medium text-stone-700 dark:bg-white/[0.06] dark:text-stone-300 sm:h-9"
                            >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400">
                                    <MapPin size={11} />
                                </span>
                                <span className="max-w-[110px] truncate sm:max-w-[140px]">{loc.name}</span>
                                <button
                                    onClick={() => removeLocation(i)}
                                    aria-label={`Remove ${loc.name}`}
                                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
                                >
                                    <X size={11} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}

                {!hasComparisons && locations.length < 5 && (
                    <div className="relative">
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search a city to add…"
                            icon={Search}
                            className="rounded-xl text-[13px] sm:text-sm"
                        />
                        <AnimatePresence>
                            {searchResults.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="glass-elevated absolute top-full z-20 mt-1.5 w-full overflow-hidden !rounded-xl sm:!rounded-2xl"
                                >
                                    <LocationResultsList results={searchResults} onSelect={addLocation} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {locations.length === 0 && !searchQuery && (
                            <div className="mt-3">
                                <p className="mb-1.5 px-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                                    Quick add
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {QUICK_ADD.map((city) => (
                                        <button
                                            key={city.name}
                                            onClick={() => addLocation(city)}
                                            className="flex items-center gap-1 rounded-full border border-stone-200 px-2.5 py-1.5 text-[11.5px] font-medium text-stone-600 transition-colors hover:border-orange-200 hover:bg-orange-500/5 hover:text-orange-600 dark:border-white/[0.08] dark:text-stone-400 dark:hover:border-orange-500/20 dark:hover:text-orange-400"
                                        >
                                            <MapPin size={10} />
                                            {city.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {locations.length >= 2 && !compareData && !isLoading && (
                    <button onClick={handleCompare} className="btn-primary flex w-full items-center justify-center gap-1.5">
                        Compare {locations.length} locations
                        <ArrowRight size={15} />
                    </button>
                )}

                {locations.length === 1 && !compareData && (
                    <p className="px-1 text-center text-[11px] text-stone-400 dark:text-stone-500">
                        Add at least one more location to compare.
                    </p>
                )}

                {isLoading && (
                    <div className="space-y-1.5 border-t border-stone-100 pt-3 dark:border-white/[0.06]">
                        {locations.map((_, i) => <SkeletonRow key={i} />)}
                    </div>
                )}

                {error && <ErrorState error={error} compact />}

                {isEmptyResult && (
                    <p className="border-t border-stone-100 py-4 text-center text-xs text-stone-400 dark:border-white/[0.04] dark:text-stone-500">
                        No comparison data available for these locations.
                    </p>
                )}

                <AnimatePresence>
                    {hasComparisons && stats && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 border-t border-stone-100 pt-3 dark:border-white/[0.06]"
                        >
                            {/* Stats summary strip */}
                            <div className="flex gap-2">
                                <StatPill icon={Gauge} label="Average" value={formatTemp(stats.avg, units)} />
                                <StatPill icon={TrendingUp} label="Highest" value={formatTemp(stats.max, units)} />
                                <StatPill icon={TrendingDown} label="Lowest" value={formatTemp(stats.min, units)} />
                            </div>

                            <div className="flex items-center justify-between px-0.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                                    Leaderboard
                                </p>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1 text-[11px] font-medium text-stone-400 transition-colors hover:text-orange-500"
                                >
                                    <RotateCcw size={10} />
                                    Edit selection
                                </button>
                            </div>

                            <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-2">
                                {ranked.map((item, i) => {
                                    const current = item.current;
                                    const loc = item.location;
                                    const isWarmest = i === 0 && ranked.length > 1;
                                    const isCoolest = i === ranked.length - 1 && ranked.length > 1;
                                    const rankStyle = RANK_STYLES[i] || 'bg-stone-100 text-stone-400 dark:bg-white/[0.05] dark:text-stone-500';

                                    return (
                                        <motion.div
                                            key={i}
                                            variants={itemVariants}
                                            className={cn(
                                                'rounded-xl border bg-stone-50 p-3 transition-colors dark:bg-white/[0.02]',
                                                isWarmest && 'border-orange-500/20 bg-orange-500/[0.04]',
                                                isCoolest && 'border-sky-500/20 bg-sky-500/[0.04]',
                                                !isWarmest && !isCoolest && 'border-transparent'
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 sm:gap-3">
                                                <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold', rankStyle)}>
                                                    {i + 1}
                                                </span>
                                                <WeatherIcon condition={getConditionKey(current.condition)} size={26} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <p className="truncate text-[13px] font-medium text-stone-900 dark:text-stone-100 sm:text-sm">
                                                            {loc?.city || `${loc?.latitude?.toFixed(1)}, ${loc?.longitude?.toFixed(1)}`}
                                                        </p>
                                                        {isWarmest && (
                                                            <Badge variant="brand" size="xs">
                                                                <Flame size={9} /> Warmest
                                                            </Badge>
                                                        )}
                                                        {isCoolest && (
                                                            <Badge variant="info" size="xs">
                                                                <Snowflake size={9} /> Coolest
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="truncate text-xs capitalize text-stone-500">
                                                        {current.condition?.description || current.condition?.main || ''}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                                                        {formatTemp(current.temperature_c, units)}
                                                    </p>
                                                    <p className="text-[10px] text-stone-400">
                                                        {formatPercent(current.humidity)} · {current.wind ? formatWind(current.wind.speed_ms, units) : '--'}
                                                    </p>
                                                </div>
                                            </div>
                                            <RangeTrack value={current.temperature_c} min={stats.min} max={stats.max} allValues={stats.temps} />
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Card>
    );
}

export { CompareCard };
export default CompareCard;