// web/src/components/home/WeatherDetails.jsx
import {
    Thermometer, Droplets, Gauge, Eye, Sun, CloudRain, Wind as WindIcon,
    ArrowDown, ArrowUp, Minus,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import Card from '../ui/Card';
import { WindCompass } from './WindCompass';
import { SkeletonCard } from '../ui/Skeleton';
import { ErrorState } from '../ui/ErrorState';
import { AnimatedItem } from '../common/PageTransition';
import { useCurrentWeather } from '@/hooks/useWeather';
import { useStore } from '@/stores/store';
import {
    formatTemp, formatPercent, formatPressure, formatVisibility,
    formatWind, formatPrecipitation, getUvInfo, getBeaufortLabel, getPrecipChance,
} from '@/utils/formatters';

function WeatherDetails({ className }) {
    const units = useStore((s) => s.units);
    const { data, isLoading, error, refetch } = useCurrentWeather();

    if (isLoading) {
        return (
            <div className={cn('grid grid-cols-2 lg:grid-cols-3 gap-3', className)}>
                {Array.from({ length: 6 }).map((_, i) => (<SkeletonCard key={i} />))}
            </div>
        );
    }
    if (error) return <ErrorState error={error} onRetry={refetch} compact className={className} />;
    if (!data) return null;

    const uvInfo = getUvInfo(data.uv_index);
    const pressureNormal = data.pressure_hpa != null
        ? data.pressure_hpa > 1020 ? 'Above normal' : data.pressure_hpa < 1005 ? 'Below normal' : 'Normal'
        : null;
    const PressureIcon = data.pressure_hpa != null
        ? data.pressure_hpa > 1020 ? ArrowUp : data.pressure_hpa < 1005 ? ArrowDown : Minus
        : null;

    const precipChance = getPrecipChance(data);
    const precipAmount = data.precipitation?.rain_1h_mm ?? data.precipitation?.snow_1h_mm ?? 0;

    const details = [
        {
            icon: Thermometer, label: 'Feels Like',
            value: formatTemp(data.feels_like_c, units),
            sub: data.dew_point_c != null ? `Dew point ${formatTemp(data.dew_point_c, units)}` : null,
        },
        {
            icon: Droplets, label: 'Humidity',
            value: formatPercent(data.humidity),
            sub: data.humidity_comfort?.replace(/_/g, ' '),
            gauge: data.humidity,
        },
        {
            icon: Gauge, label: 'Pressure',
            value: formatPressure(data.pressure_hpa, units),
            sub: pressureNormal,
            trendIcon: PressureIcon,
        },
        {
            icon: Eye, label: 'Visibility',
            value: formatVisibility(data.visibility_m, units),
            sub: data.visibility_category?.replace(/_/g, ' '),
        },
        {
            icon: Sun, label: 'UV Index',
            value: data.uv_index != null ? String(data.uv_index) : '--',
            sub: uvInfo.label,
            valueColorHex: data.uv_index != null ? uvInfo.color : undefined,
            badge: data.uv_index != null && data.uv_index >= 3 ? 'Protection needed' : null,
        },
        {
            icon: CloudRain, label: 'Precipitation',
            value: formatPrecipitation(precipAmount, units),
            sub: precipChance != null ? `${Math.round(precipChance)}% chance` : null,
        },
    ];

    return (
        <AnimatedItem>
            <div className={cn('stack-y', className)}>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {details.map((d) => {
                        const TrendIcon = d.trendIcon;
                        return (
                            <Card key={d.label} variant="metric" padding={false}>
                                <div className="p-3 md:p-4 flex flex-col justify-between h-full min-h-[100px]">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <d.icon className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0" />
                                            <span className="label truncate">{d.label}</span>
                                        </div>
                                        {TrendIcon && <TrendIcon className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0" />}
                                    </div>
                                    <div>
                                        <span className="metric-value" style={d.valueColorHex ? { color: d.valueColorHex } : undefined}>
                                            {d.value}
                                        </span>
                                        {d.sub && <p className="text-xs text-stone-500 dark:text-stone-500 mt-0.5 capitalize truncate">{d.sub}</p>}
                                        {d.badge && (
                                            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 font-medium">
                                                {d.badge}
                                            </span>
                                        )}
                                    </div>
                                    {d.gauge != null && (
                                        <div className="mt-2 w-full bg-stone-200 dark:bg-white/[0.06] rounded-full h-1">
                                            <div className="h-full rounded-full bg-blue-400 transition-all duration-500" style={{ width: `${Math.min(100, d.gauge)}%` }} />
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {data.wind && (
                    <Card variant="glass" className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                        <WindCompass direction={data.wind.direction_deg} speed={data.wind.speed_ms} gust={data.wind.gust_ms} units={units} size="lg" />
                        <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                            <InfoBlock label="Speed" value={formatWind(data.wind.speed_ms, units)} />
                            <InfoBlock label="Gusts" value={data.wind.gust_ms != null ? formatWind(data.wind.gust_ms, units) : '--'} />
                            <InfoBlock label="Direction" value={`${data.wind.direction_label || '--'} (${data.wind.direction_deg ?? '--'}°)`} />
                            <InfoBlock label="Beaufort" value={data.wind.beaufort != null ? `${data.wind.beaufort} — ${getBeaufortLabel(data.wind.beaufort)}` : '--'} />
                        </div>
                    </Card>
                )}
            </div>
        </AnimatedItem>
    );
}

function InfoBlock({ label, value }) {
    return (
        <div className="glass-metric p-2.5 min-w-0">
            <span className="label text-[10px]">{label}</span>
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 mt-0.5 truncate">{value}</p>
        </div>
    );
}

export { WeatherDetails };
export default WeatherDetails;