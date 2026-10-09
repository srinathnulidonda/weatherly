// web/src/components/home/AirQuality.jsx
import { useMemo } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import Card from '../ui/Card';
import { SkeletonCard } from '../ui/Skeleton';
import { ErrorState } from '../ui/ErrorState';
import { Tooltip } from '../ui/Tooltip';
import { AnimatedItem } from '../common/PageTransition';
import { useAirQuality } from '@/hooks/useWeather';
import { getAqiInfo } from '@/utils/formatters';
import { POLLUTANT_TOKENS } from '@/lib/theme';

const AQI_SCALE = [
    { max: 50, varName: '--color-aqi-good', label: 'Good' },
    { max: 100, varName: '--color-aqi-moderate', label: 'Moderate' },
    { max: 150, varName: '--color-aqi-sensitive', label: 'Sensitive' },
    { max: 200, varName: '--color-aqi-unhealthy', label: 'Unhealthy' },
    { max: 300, varName: '--color-aqi-very-unhealthy', label: 'V.Unhealthy' },
    { max: Infinity, varName: '--color-aqi-hazardous', label: 'Hazardous' },
];

function getScaleEntry(aqi) {
    if (aqi == null) return AQI_SCALE[0];
    return AQI_SCALE.find((s) => aqi <= s.max) || AQI_SCALE[AQI_SCALE.length - 1];
}

function resolveRecommendationText(recs) {
    if (!recs) return null;
    if (typeof recs === 'string') return recs;
    if (typeof recs === 'object') {
        if (recs.general) return recs.general;
        const values = Object.values(recs).filter((v) => typeof v === 'string' && v.trim().length > 0);
        if (values.length === 0) return null;
        return values.join(' ');
    }
    return null;
}

function AirQuality({ className }) {
    const { data, isLoading, error, refetch } = useAirQuality();

    const level = useMemo(() => {
        if (!data) return { label: 'Unknown', color: '#A8A29E', textClass: 'text-stone-400' };
        return getAqiInfo(data.aqi);
    }, [data]);

    const scaleEntry = useMemo(() => getScaleEntry(data?.aqi), [data]);

    const gaugeAngle = useMemo(() => {
        if (!data?.aqi) return 0;
        return Math.min((data.aqi / 300) * 180, 180);
    }, [data]);

    if (isLoading) return <SkeletonCard className={className} />;
    if (error) return <ErrorState error={error} onRetry={refetch} compact className={className} />;
    if (!data) return null;

    const pollutants = Object.entries(POLLUTANT_TOKENS)
        .filter(([key]) => data[key] != null)
        .map(([key, info]) => ({ key, ...info, value: data[key], isOver: data[key] > info.safe }));

    const recommendationText = resolveRecommendationText(data.health_recommendations);

    return (
        <AnimatedItem>
            <Card variant="glass" className={cn(className)}>
                <Card.Title className="mb-3 sm:mb-4">Air Quality</Card.Title>

                <div className="flex items-start gap-3 sm:gap-5">
                    <div className="relative w-16 h-10 sm:w-24 sm:h-14 shrink-0">
                        <svg viewBox="0 0 120 66" className="w-full h-full" aria-hidden="true">
                            <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" className="stroke-stone-200 dark:stroke-white/[0.08]" strokeWidth="8" strokeLinecap="round" />
                            <defs>
                                <linearGradient id="aqiGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="var(--color-aqi-good)" />
                                    <stop offset="16.6%" stopColor="var(--color-aqi-good)" />
                                    <stop offset="33.3%" stopColor="var(--color-aqi-moderate)" />
                                    <stop offset="50%" stopColor="var(--color-aqi-sensitive)" />
                                    <stop offset="66.6%" stopColor="var(--color-aqi-unhealthy)" />
                                    <stop offset="100%" stopColor="var(--color-aqi-very-unhealthy)" />
                                </linearGradient>
                            </defs>
                            <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="url(#aqiGaugeGrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(gaugeAngle / 180) * 157} 157`} />
                            <text x="6" y="66" fontSize="6" className="fill-stone-400 dark:fill-stone-600">0</text>
                            <text x="114" y="66" textAnchor="end" fontSize="6" className="fill-stone-400 dark:fill-stone-600">300+</text>
                            <g transform={`rotate(${gaugeAngle - 90}, 60, 60)`}>
                                <circle cx="60" cy="10" r="7" style={{ fill: `var(${scaleEntry.varName})` }} opacity="0.28" />
                                <circle cx="60" cy="10" r="4" className="fill-white dark:fill-stone-900 stroke-stone-300 dark:stroke-stone-600" strokeWidth="1.5" />
                            </g>
                        </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn('text-2xl sm:text-3xl font-extrabold tabular-nums', level.textClass)}>{data.aqi}</span>
                            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-current/10', level.textClass)}>
                                {level.label}
                            </span>
                        </div>
                        {data.dominant_pollutant && (
                            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-1 truncate">
                                Dominant: <span className="font-medium text-stone-600 dark:text-stone-300">{POLLUTANT_TOKENS[data.dominant_pollutant]?.label || data.dominant_pollutant}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1" aria-hidden="true">
                    {AQI_SCALE.map((s) => (
                        <span
                            key={s.label}
                            className={cn(
                                'inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-medium transition-opacity',
                                s.varName === scaleEntry.varName
                                    ? 'text-stone-700 dark:text-stone-300 font-bold'
                                    : 'text-stone-400 dark:text-stone-600'
                            )}
                        >
                            <span
                                className={cn(
                                    'w-1.5 h-1.5 rounded-full shrink-0',
                                    s.varName === scaleEntry.varName && 'ring-2 ring-offset-1 ring-offset-white dark:ring-offset-stone-950'
                                )}
                                style={{
                                    backgroundColor: `var(${s.varName})`,
                                    ...(s.varName === scaleEntry.varName ? { '--tw-ring-color': `var(${s.varName})` } : {}),
                                }}
                            />
                            {s.label}
                        </span>
                    ))}
                </div>

                {pollutants.length > 0 && (
                    <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
                        {pollutants.map((p) => (
                            <Tooltip key={p.key} content={`${p.label}: ${p.value.toFixed(1)} ${p.unit} (safe: <${p.safe})`}>
                                <div className={cn(
                                    'w-full rounded-lg p-1.5 sm:p-2 text-center transition-colors',
                                    p.isOver
                                        ? 'bg-red-50 dark:bg-red-500/[0.06] border border-red-200 dark:border-red-500/10'
                                        : 'bg-stone-50 dark:bg-white/[0.02] border border-stone-100 dark:border-white/[0.04]'
                                )}>
                                    <span className="text-[9px] sm:text-[10px] font-medium text-stone-500 dark:text-stone-400 flex items-center justify-center gap-0.5">
                                        {p.label}
                                        {p.isOver && <AlertTriangle size={9} className="text-red-500 shrink-0" aria-hidden="true" />}
                                    </span>
                                    <span className={cn(
                                        'text-[12px] sm:text-sm font-semibold block mt-0.5',
                                        p.isOver ? 'text-red-600 dark:text-red-400' : 'text-stone-800 dark:text-stone-200'
                                    )}>
                                        {p.value.toFixed(1)}
                                    </span>
                                    <div className="mt-1.5 h-1 w-full rounded-full bg-stone-200/70 dark:bg-white/[0.08] overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, (p.value / p.safe) * 100)}%`,
                                                backgroundColor: p.isOver ? 'var(--color-severity-severe)' : 'var(--color-aqi-good)',
                                            }}
                                        />
                                    </div>
                                </div>
                            </Tooltip>
                        ))}
                    </div>
                )}

                {recommendationText && (
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-3.5 border-t border-stone-100 dark:border-white/[0.04]">
                        <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-stone-50/80 dark:bg-white/[0.03] border border-stone-100 dark:border-white/[0.05]">
                            <div className={cn(
                                'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0',
                                data.aqi <= 100 ? 'bg-green-100 dark:bg-green-500/10' : 'bg-amber-100 dark:bg-amber-500/10'
                            )} aria-hidden="true">
                                {data.aqi <= 100
                                    ? <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                                    : <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                                }
                            </div>
                            <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                                {recommendationText}
                            </p>
                        </div>
                    </div>
                )}
            </Card>
        </AnimatedItem>
    );
}

export { AirQuality };
export default AirQuality;