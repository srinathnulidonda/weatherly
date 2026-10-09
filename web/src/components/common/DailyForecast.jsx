// web/src/components/common/DailyForecast.jsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import Card from '../ui/Card';
import { SkeletonRow } from '../ui/Skeleton';
import { ErrorState } from '../ui/ErrorState';
import WeatherIcon from '../ui/WeatherIcon';
import { TempBar } from './TempBar';
import { AnimatedItem } from './PageTransition';
import { useForecast, useCurrentWeather } from '@/hooks/useWeather';
import { useStore } from '@/stores/store';
import { getConditionKey } from '@/lib/weatherCondition';
import { formatDay, formatPercent, getPrecipChance } from '@/utils/formatters';

function DailyForecast({ days = 7, compact = false, viewAllLink = false, className }) {
    const units = useStore((s) => s.units);
    const navigate = useNavigate();
    const { data, isLoading, error, refetch } = useForecast(days);
    const { data: current } = useCurrentWeather();

    const { dailyData, rangeMin, rangeMax } = useMemo(() => {
        if (!data?.days) return { dailyData: [], rangeMin: 0, rangeMax: 30 };
        const dd = data.days.slice(0, days);
        let rMin = Infinity, rMax = -Infinity;
        for (const d of dd) {
            if (d.temp_min_c != null && d.temp_min_c < rMin) rMin = d.temp_min_c;
            if (d.temp_max_c != null && d.temp_max_c > rMax) rMax = d.temp_max_c;
        }
        if (!isFinite(rMin)) rMin = 0;
        if (!isFinite(rMax)) rMax = 30;
        return { dailyData: dd, rangeMin: rMin, rangeMax: rMax };
    }, [data, days]);

    if (isLoading) {
        return (
            <div className={cn('space-y-1.5 sm:space-y-2', className)}>
                {Array.from({ length: compact ? 5 : 7 }).map((_, i) => (
                    <SkeletonRow key={i} />
                ))}
            </div>
        );
    }
    if (error) return <ErrorState error={error} onRetry={refetch} compact className={className} />;
    if (!dailyData.length) return null;

    return (
        <AnimatedItem>
            <Card variant="glass" padding={false} className={cn('overflow-hidden', className)}>

                <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4">
                    <Card.Title>{days}-Day Forecast</Card.Title>
                    {viewAllLink ? (
                        <button
                            onClick={() => navigate('/forecast')}
                            className="flex items-center gap-0.5 text-[11px] sm:text-xs font-semibold text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-150 focus-ring rounded-lg px-1"
                        >
                            Full forecast
                            <ArrowRight size={12} />
                        </button>
                    ) : (
                        !compact && (
                            <div className="flex items-center gap-3 text-[10px] font-medium text-stone-400 dark:text-stone-600 uppercase tracking-wide">
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                                    Rain
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-1 rounded-full bg-gradient-to-r from-blue-400 to-orange-400 inline-block" />
                                    Temp
                                </span>
                            </div>
                        )
                    )}
                </div>

                <div className="px-2 sm:px-3 pb-3 sm:pb-4 space-y-0.5">
                    {dailyData.map((day, i) => {
                        const conditionKey = getConditionKey(day.condition);
                        const isToday = i === 0;
                        const pop = getPrecipChance(day);

                        return (
                            <div
                                key={day.date || i}
                                className={cn(
                                    'group relative flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 rounded-2xl transition-all duration-200',
                                    'py-2 sm:py-2.5',
                                    isToday
                                        ? 'bg-gradient-to-r from-orange-500/10 via-orange-500/[0.06] to-transparent dark:from-orange-500/[0.12] dark:via-orange-500/[0.06] dark:to-transparent'
                                        : 'hover:bg-stone-900/[0.04] dark:hover:bg-white/[0.04] active:bg-stone-900/[0.06] dark:active:bg-white/[0.06]'
                                )}
                            >
                                {isToday && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-orange-500" />
                                )}

                                <div className="w-[62px] sm:w-[76px] shrink-0 pl-1 sm:pl-0.5">
                                    <span className={cn(
                                        'text-[13px] sm:text-sm font-semibold truncate block leading-tight',
                                        isToday
                                            ? 'text-orange-500 dark:text-orange-400'
                                            : 'text-stone-700 dark:text-stone-300'
                                    )}>
                                        {formatDay(day.date)}
                                    </span>
                                    {isToday && (
                                        <span className="text-[9px] font-semibold uppercase tracking-widest text-orange-400/70 dark:text-orange-500/60 leading-tight">
                                            Today
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-center w-7 sm:w-8 shrink-0">
                                    <WeatherIcon
                                        condition={conditionKey}
                                        size={compact ? 'sm' : 'md'}
                                        glow={isToday}
                                        animated={false}
                                    />
                                </div>

                                {!compact && (
                                    <div className="w-8 sm:w-9 shrink-0 flex items-center justify-center">
                                        {pop != null && pop > 0 ? (
                                            <span className={cn(
                                                'text-[11px] sm:text-xs font-bold tabular-nums',
                                                pop > 60
                                                    ? 'text-blue-500 dark:text-blue-400'
                                                    : pop > 30
                                                        ? 'text-blue-400/80 dark:text-blue-500/80'
                                                        : 'text-stone-300 dark:text-stone-600'
                                            )}>
                                                {formatPercent(pop)}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-stone-200 dark:text-stone-700 select-none">—</span>
                                        )}
                                    </div>
                                )}

                                <div className="flex-1 flex items-center justify-end min-w-0">
                                    <TempBar
                                        min={day.temp_min_c}
                                        max={day.temp_max_c}
                                        rangeMin={rangeMin}
                                        rangeMax={rangeMax}
                                        currentTemp={isToday ? current?.temperature_c : undefined}
                                        units={units}
                                        showLabels={true}
                                        temperatureFormat="combined"
                                        height="h-[5px] sm:h-1.5"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

            </Card>
        </AnimatedItem>
    );
}

export { DailyForecast };
export default DailyForecast;