// web/src/components/analytics/CompareCard.jsx
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ErrorState } from '../ui/ErrorState';
import { WeatherIcon } from '../ui/WeatherIcon';
import { LocationResultsList } from '../common/LocationResultsList';
import { useWeatherCompare } from '@/hooks/useAnalytics';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { useStore } from '@/stores/store';
import { getConditionKey } from '@/lib/weatherCondition';
import { formatTemp, formatWind, formatPercent } from '@/utils/formatters';

function CompareCard({ className }) {
    const [locations, setLocations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { results: searchResults } = useLocationSearch(searchQuery, { limit: 5 });
    const units = useStore((s) => s.units);

    const { compare, data: compareData, isLoading, error, reset } = useWeatherCompare();

    const addLocation = useCallback((loc) => {
        if (locations.length >= 5) return;
        const exists = locations.some(
            (l) => Math.abs(l.latitude - loc.latitude) < 0.01 && Math.abs(l.longitude - loc.longitude) < 0.01
        );
        if (exists) return;
        setLocations((prev) => [...prev, {
            latitude: loc.latitude,
            longitude: loc.longitude,
            name: loc.name || loc.city || `${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)}`,
        }]);
        setSearchQuery('');
        reset();
    }, [locations, reset]);

    const removeLocation = useCallback((index) => {
        setLocations((prev) => prev.filter((_, i) => i !== index));
        reset();
    }, [reset]);

    const handleCompare = useCallback(() => {
        if (locations.length < 2) return;
        compare(locations);
    }, [locations, compare]);

    const hasComparisons = !!compareData?.comparisons?.length;
    const isEmptyResult = !!compareData && !hasComparisons;

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Compare Locations</CardTitle>
                <span className="text-xs text-stone-400">{locations.length}/5</span>
            </CardHeader>

            <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    {locations.map((loc, i) => (
                        <motion.div
                            key={`${loc.latitude}-${loc.longitude}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1.5 pl-2.5 pr-1.5 h-8 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-medium"
                        >
                            <span className="truncate max-w-[120px]">{loc.name}</span>
                            <button onClick={() => removeLocation(i)} className="min-touch !w-6 !h-6 flex items-center justify-center hover:text-red-500 transition-colors">
                                <X size={12} />
                            </button>
                        </motion.div>
                    ))}
                </div>

                {locations.length < 5 && (
                    <div className="relative">
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search city to add..."
                            icon={Plus}
                        />
                        <AnimatePresence>
                            {searchResults.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="absolute z-20 top-full mt-1 w-full border border-stone-200 dark:border-white/[0.08] rounded-xl overflow-hidden bg-white dark:bg-stone-900 shadow-xl"
                                >
                                    <LocationResultsList results={searchResults} onSelect={addLocation} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {locations.length >= 2 && !compareData && (
                    <Button
                        onClick={handleCompare}
                        loading={isLoading}
                        className="w-full"
                    >
                        <ArrowRight size={16} />
                        Compare {locations.length} Locations
                    </Button>
                )}

                {error && <ErrorState error={error} compact />}

                {isEmptyResult && (
                    <p className="text-xs text-stone-400 dark:text-stone-500 text-center py-4 border-t border-stone-100 dark:border-white/[0.04]">
                        No comparison data available for these locations.
                    </p>
                )}

                <AnimatePresence>
                    {hasComparisons && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2 pt-2 border-t border-stone-100 dark:border-white/[0.04]"
                        >
                            {compareData.comparisons.map((item, i) => {
                                const current = item.current;
                                const loc = item.location;
                                if (!current) return null;

                                return (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-white/[0.02]"
                                    >
                                        <WeatherIcon condition={getConditionKey(current.condition)} size={28} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                                                {loc?.city || `${loc?.latitude?.toFixed(1)}, ${loc?.longitude?.toFixed(1)}`}
                                            </p>
                                            <p className="text-xs text-stone-500 capitalize truncate">
                                                {current.condition?.description || current.condition?.main || ''}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                                                {formatTemp(current.temperature_c, units)}
                                            </p>
                                            <p className="text-[10px] text-stone-400">
                                                {formatPercent(current.humidity)} · {current.wind ? formatWind(current.wind.speed_ms, units) : '--'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Card>
    );
}

export { CompareCard };
export default CompareCard;