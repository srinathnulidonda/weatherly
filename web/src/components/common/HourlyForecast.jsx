// web/src/components/common/HourlyForecast.jsx
import { useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import Card from '../ui/Card';
import { SkeletonCard } from '../ui/Skeleton';
import { ErrorState } from '../ui/ErrorState';
import { EmptyState } from '../ui/EmptyState';
import WeatherIcon from '../ui/WeatherIcon';
import { Tooltip } from '../ui/Tooltip';
import { AnimatedItem } from './PageTransition';
import { useHourlyForecast } from '@/hooks/useWeather';
import { useStore } from '@/stores/store';
import { getConditionKey } from '@/lib/weatherCondition';
import { formatTemp, formatHour, formatDay, formatPercent, getPrecipChance, getZonedDateKey } from '@/utils/formatters';

function HourlyForecast({ hours: externalHours, limit = null, viewAllLink = false, className }) {
    const units = useStore((s) => s.units);
    const navigate = useNavigate();
    const hasExternal = Array.isArray(externalHours) && externalHours.length > 0;
    const { data, isLoading, error, refetch } = useHourlyForecast(2, { enabled: !hasExternal });
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const timezone = !hasExternal ? (data?.timezone || data?.location?.timezone || null) : null;

    const hourlyData = useMemo(() => {
        const cap = limit || 48;
        if (hasExternal) return externalHours.slice(0, cap);
        if (data?._flatHours?.length) return data._flatHours.slice(0, cap);
        return [];
    }, [data, externalHours, hasExternal, limit]);

    const dayBreaks = useMemo(() => {
        const marks = new Map();
        let prevKey = null;
        hourlyData.forEach((h, i) => {
            const d = new Date(h.datetime_utc);
            if (isNaN(d.getTime())) return;
            const key = getZonedDateKey(d, timezone);
            if (prevKey && key !== prevKey) marks.set(i, h.datetime_utc);
            prevKey = key;
        });
        return marks;
    }, [hourlyData, timezone]);

    const peakIndex = useMemo(() => {
        if (!hourlyData.length) return -1;
        let idx = -1;
        let maxT = -Infinity;
        hourlyData.slice(0, 24).forEach((h, i) => {
            if (h.temperature_c != null && h.temperature_c > maxT) {
                maxT = h.temperature_c;
                idx = i;
            }
        });
        return idx;
    }, [hourlyData]);

    const trendSummary = useMemo(() => {
        if (hourlyData.length < 3) return null;
        const current = hourlyData[0]?.temperature_c;
        if (current == null) return null;
        const window = hourlyData.slice(1, 9);
        let peak = null;
        let trough = null;
        window.forEach((h) => {
            if (h.temperature_c == null) return;
            if (!peak || h.temperature_c > peak.temperature_c) peak = h;
            if (!trough || h.temperature_c < trough.temperature_c) trough = h;
        });
        if (peak && peak.temperature_c - current >= 2) {
            return `Warming to ${formatTemp(peak.temperature_c, units)} by ${formatHour(peak.datetime_utc, timezone)}`;
        }
        if (trough && current - trough.temperature_c >= 2) {
            return `Cooling to ${formatTemp(trough.temperature_c, units)} by ${formatHour(trough.datetime_utc, timezone)}`;
        }
        return 'Steady conditions ahead';
    }, [hourlyData, units, timezone]);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };

    const scroll = (dir) => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({
            left: dir === 'left' ? -el.clientWidth * 0.7 : el.clientWidth * 0.7,
            behavior: 'smooth',
        });
    };

    if (!hasExternal) {
        if (isLoading) return <SkeletonCard className={cn('h-40', className)} />;
        if (error) return <ErrorState error={error} onRetry={refetch} compact className={className} />;
    }

    if (!hourlyData.length) {
        return (
            <Card variant="glass" className={className}>
                <EmptyState
                    icon={Clock}
                    title="No hourly data"
                    description="Hourly forecast data is not available right now."
                />
            </Card>
        );
    }

    return (
        <AnimatedItem>
            <Card variant="glass" padding={false} className={cn('relative overflow-visible', className)}>
                <div className="flex items-start justify-between gap-2 px-3 sm:px-5 pt-3 sm:pt-4 pb-2 sm:pb-3">
                    <div className="min-w-0">
                        <Card.Title>Hourly Forecast</Card.Title>
                        {trendSummary && (
                            <p className="text-[11px] sm:text-xs text-stone-400 dark:text-stone-500 mt-0.5 truncate">
                                {trendSummary}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {viewAllLink && (
                            <button
                                onClick={() => navigate('/forecast')}
                                className="flex items-center gap-0.5 text-[11px] sm:text-xs font-semibold text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-150 focus-ring rounded-lg px-1"
                            >
                                Full forecast
                                <ArrowRight size={12} />
                            </button>
                        )}
                        <div className="hidden md:flex items-center gap-1">
                            <button
                                onClick={() => scroll('left')}
                                disabled={!canScrollLeft}
                                aria-label="Scroll hourly forecast left"
                                className={cn(
                                    'btn-icon !w-9 !h-9',
                                    !canScrollLeft && 'opacity-30 cursor-not-allowed'
                                )}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => scroll('right')}
                                disabled={!canScrollRight}
                                aria-label="Scroll hourly forecast right"
                                className={cn(
                                    'btn-icon !w-9 !h-9',
                                    !canScrollRight && 'opacity-30 cursor-not-allowed'
                                )}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div
                        className={cn(
                            'pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-10 z-20 bg-gradient-to-r from-white/90 dark:from-stone-950/80 to-transparent transition-opacity duration-300',
                            canScrollLeft ? 'opacity-100' : 'opacity-0'
                        )}
                    />
                    <div
                        className={cn(
                            'pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-10 z-20 bg-gradient-to-l from-white/90 dark:from-stone-950/80 to-transparent transition-opacity duration-300',
                            canScrollRight ? 'opacity-100' : 'opacity-0'
                        )}
                    />

                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="flex gap-0.5 sm:gap-1 overflow-x-auto overflow-y-visible snap-x snap-mandatory scrollbar-hide px-2 sm:px-4 pb-3 sm:pb-4"
                    >
                        {hourlyData.map((hour, i) => {
                            const isNow = i === 0;
                            const isPeak = i === peakIndex && !isNow;
                            const conditionKey = getConditionKey(hour.condition);
                            const pop = getPrecipChance(hour);
                            const dayBreakLabel = dayBreaks.get(i);

                            return (
                                <div key={`hour-${i}-${hour.datetime_utc}`} className="flex items-stretch shrink-0">
                                    {dayBreakLabel && (
                                        <div className="flex flex-col items-center justify-center px-1.5 sm:px-2 shrink-0 snap-start">
                                            <span className="w-px flex-1 bg-gradient-to-b from-transparent via-stone-200 dark:via-white/[0.08] to-transparent" />
                                            <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-600 py-1 whitespace-nowrap">
                                                {formatDay(dayBreakLabel, timezone)}
                                            </span>
                                            <span className="w-px flex-1 bg-gradient-to-b from-transparent via-stone-200 dark:via-white/[0.08] to-transparent" />
                                        </div>
                                    )}
                                    <Tooltip
                                        content={`${formatTemp(hour.temperature_c, units)} — ${hour.condition?.description || hour.condition?.main || ''}`}
                                    >
                                        <div
                                            className={cn(
                                                'relative flex flex-col items-center gap-1 sm:gap-1.5 px-2 py-2.5 sm:px-2.5 sm:py-3 rounded-xl min-w-[52px] sm:min-w-[62px] transition-all duration-200 snap-center shrink-0 z-10',
                                                isNow
                                                    ? 'bg-orange-50 dark:bg-orange-500/[0.08] border border-orange-200 dark:border-orange-500/20'
                                                    : 'hover:bg-stone-50 dark:hover:bg-white/[0.02]'
                                            )}
                                        >
                                            {isPeak && (
                                                <span className="absolute top-1 right-1 text-amber-500" title="Warmest hour ahead">
                                                    <TrendingUp size={9} strokeWidth={2.5} />
                                                </span>
                                            )}

                                            <span
                                                className={cn(
                                                    'flex items-center gap-1 text-[11px] sm:text-xs font-medium whitespace-nowrap',
                                                    isNow
                                                        ? 'text-orange-600 dark:text-orange-400'
                                                        : 'text-stone-500 dark:text-stone-500'
                                                )}
                                            >
                                                {isNow && <span className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />}
                                                {isNow ? 'Now' : formatHour(hour.datetime_utc, timezone)}
                                            </span>

                                            <WeatherIcon condition={conditionKey} size="md" animated={false} />

                                            <span className={cn(
                                                'text-[13px] sm:text-sm tabular-nums',
                                                isPeak ? 'font-bold text-stone-900 dark:text-stone-100' : 'font-semibold text-stone-800 dark:text-stone-200'
                                            )}>
                                                {formatTemp(hour.temperature_c, units)}
                                            </span>

                                            <span className={cn(
                                                'text-[9px] sm:text-[10px] font-medium tabular-nums',
                                                pop != null && pop > 50
                                                    ? 'text-blue-500 dark:text-blue-400'
                                                    : pop != null && pop > 0
                                                        ? 'text-blue-400/70 dark:text-blue-500/70'
                                                        : 'text-transparent select-none'
                                            )}>
                                                {pop != null && pop > 0 ? formatPercent(pop) : '0%'}
                                            </span>
                                        </div>
                                    </Tooltip>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>
        </AnimatedItem>
    );
}

export { HourlyForecast };
export default HourlyForecast;