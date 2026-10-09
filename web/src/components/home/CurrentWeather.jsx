// web/src/components/home/CurrentWeather.jsx
import { motion } from 'framer-motion';
import { Droplets, Wind, Eye, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import { DynamicSky } from '../background/DynamicSky';
import { WeatherIcon } from '../ui/WeatherIcon';
import { SkeletonHero } from '../ui/Skeleton';
import { useCurrentWeather } from '@/hooks/useWeather';
import { useStore } from '@/stores/store';
import { resolveIsDay, getConditionKey } from '@/lib/weatherCondition';
import { formatTemp, formatCondition, formatRelative, formatVisibility, formatWind, formatPercent } from '@/utils/formatters';

const HERO_PILL = 'bg-white/10 border border-white/15 backdrop-blur-xl rounded-full';

function HeroError({ error, onRetry, className }) {
    return (
        <div className={cn('relative rounded-5xl overflow-hidden min-h-[380px] flex flex-col items-center justify-center gap-3 bg-stone-900 text-center px-6', className)}>
            <p className="text-white/80 text-sm">{error?.message || 'Unable to load weather right now.'}</p>
            {onRetry && (
                <button onClick={onRetry} className="btn-outline text-white border-white/30">
                    Try again
                </button>
            )}
        </div>
    );
}

function MetricPill({ icon: Icon, label, value }) {
    return (
        <div className={cn(HERO_PILL, 'flex items-center gap-2 px-3.5 py-2.5 shrink-0')}>
            <Icon size={15} className="text-white/70 shrink-0" />
            <div className="flex flex-col leading-tight min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-white/50 font-semibold">{label}</span>
                <span className="text-sm font-semibold text-white truncate">{value}</span>
            </div>
        </div>
    );
}

function CurrentWeather({ className }) {
    const { data, isLoading, error, refetch } = useCurrentWeather();
    const units = useStore((s) => s.units);

    if (isLoading) return <SkeletonHero className={className} />;
    if (error) return <HeroError error={error} onRetry={refetch} className={className} />;
    if (!data) return null;

    const isDay = resolveIsDay(data);
    const conditionKey = getConditionKey(data.condition);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={cn('relative rounded-5xl overflow-hidden min-h-[400px] sm:min-h-[440px] shadow-elevated', className)}
        >
            <DynamicSky
                condition={conditionKey}
                isDay={isDay}
                sunrise={data.astronomy?.sunrise}
                sunset={data.astronomy?.sunset}
                moonPhase={data.astronomy?.moon_phase_name}
            />

            <div className="relative z-10 flex flex-col justify-between h-full min-h-[400px] sm:min-h-[440px] p-5 sm:p-8">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-white/70 tracking-wide truncate [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">
                        Updated {formatRelative(data.observed_at)}
                    </span>
                    {data.uv_index != null && data.uv_index >= 3 && (
                        <div className={cn(HERO_PILL, 'flex items-center gap-1.5 px-3 py-1.5 shrink-0')}>
                            <Sun size={12} className="text-amber-300" />
                            <span className="text-[11px] font-semibold text-white">UV {data.uv_index}</span>
                        </div>
                    )}
                </div>

                <div className="mt-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="text-hero font-thin tracking-tighter text-white tabular-nums [text-shadow:0_2px_16px_rgba(0,0,0,0.35)]">
                            {formatTemp(data.temperature_c, units)}
                        </div>
                        <WeatherIcon condition={conditionKey} size="md" animated className="shrink-0 mb-2" />
                    </div>
                    <p className="text-base sm:text-xl font-medium text-white/90 capitalize -mt-1 sm:-mt-2 truncate">
                        {formatCondition(data.condition)}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-white/70 flex-wrap">
                        {data.feels_like_c != null && <span>Feels {formatTemp(data.feels_like_c, units)}</span>}
                        {(data.temp_max_c != null || data.temp_min_c != null) && (
                            <span>H:{formatTemp(data.temp_max_c, units)} L:{formatTemp(data.temp_min_c, units)}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-6 overflow-x-auto scrollbar-hide -mx-1 px-1">
                    <MetricPill icon={Droplets} label="Humidity" value={data.humidity != null ? formatPercent(data.humidity) : '--'} />
                    <MetricPill icon={Wind} label="Wind" value={data.wind?.speed_ms != null ? formatWind(data.wind.speed_ms, units) : '--'} />
                    <MetricPill icon={Eye} label="Visibility" value={formatVisibility(data.visibility_m, units)} />
                </div>
            </div>
        </motion.div>
    );
}

export { CurrentWeather };
export default CurrentWeather;