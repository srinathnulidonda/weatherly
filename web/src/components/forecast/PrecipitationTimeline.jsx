// web/src/components/forecast/PrecipitationTimeline.jsx
import { useMemo } from 'react';
import { CloudRain, Umbrella } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { useHourlyForecast } from '@/hooks/useWeather';
import { formatHour, getPrecipChance } from '@/utils/formatters';

function buildHeadline(hours) {
    if (!hours.length) return null;
    const idx = hours.findIndex((h) => (getPrecipChance(h) ?? 0) >= 40);
    if (idx === -1) return { text: 'No significant precipitation expected for the next 12 hours', icon: Umbrella, tone: 'text-emerald-500' };
    if (idx === 0) return { text: 'Precipitation is likely right now', icon: CloudRain, tone: 'text-blue-500' };
    return { text: `Precipitation likely around ${formatHour(hours[idx].datetime_utc)}`, icon: CloudRain, tone: 'text-blue-500' };
}

function PrecipitationTimeline({ hours: externalHours, className }) {
    const hasExternal = Array.isArray(externalHours) && externalHours.length > 0;
    const { data } = useHourlyForecast(2, { enabled: !hasExternal });
    const hours = useMemo(() => {
        if (hasExternal) return externalHours.slice(0, 12);
        return (data?._flatHours || []).slice(0, 12);
    }, [data, externalHours, hasExternal]);
    const headline = useMemo(() => buildHeadline(hours), [hours]);

    if (!hours.length) return null;

    const max = Math.max(10, ...hours.map((h) => getPrecipChance(h) ?? 0));
    const HeadlineIcon = headline?.icon;

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Precipitation</CardTitle>
            </CardHeader>

            {headline && HeadlineIcon && (
                <div className="flex items-center gap-2 mb-4">
                    <HeadlineIcon size={15} className={cn(headline.tone, 'shrink-0')} aria-hidden="true" />
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{headline.text}</p>
                </div>
            )}

            <div className="flex items-end gap-1.5 h-16" aria-hidden="true">
                {hours.map((h, i) => {
                    const pop = getPrecipChance(h) ?? 0;
                    const heightPct = Math.max(6, (pop / max) * 100);
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full min-w-0">
                            <div
                                className={cn('w-full rounded-full transition-all duration-500', pop > 5 ? 'bg-blue-400' : 'bg-stone-200 dark:bg-white/[0.08]')}
                                style={{ height: `${heightPct}%` }}
                            />
                            <span className="text-[9px] text-stone-400 font-medium truncate">{i === 0 ? 'Now' : formatHour(h.datetime_utc)}</span>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

export { PrecipitationTimeline };
export default PrecipitationTimeline;