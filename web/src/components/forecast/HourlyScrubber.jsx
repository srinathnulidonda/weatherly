// web/src/components/forecast/HourlyScrubber.jsx
import { useMemo, useRef, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { WeatherIcon } from '../ui/WeatherIcon';
import { useHourlyForecast } from '@/hooks/useWeather';
import { useStore } from '@/stores/store';
import { getConditionKey } from '@/lib/weatherCondition';
import { formatTemp, formatHour } from '@/utils/formatters';

const CHART_CHART_WIDTH = 640;
const CHART_HEIGHT = 120;
const CHART_PADDING = 16;

function buildPath(points) {
    if (points.length < 2) return '';
    return points.reduce((acc, p, i) => `${acc}${i === 0 ? 'M' : 'L'}${p.x},${p.y} `, '').trim();
}

function HourlyScrubber({ hours: externalHours, className }) {
    const units = useStore((s) => s.units);
    const hasExternal = Array.isArray(externalHours) && externalHours.length > 0;
    const { data, isLoading } = useHourlyForecast(2, { enabled: !hasExternal });
    const hours = useMemo(() => {
        if (hasExternal) return externalHours.slice(0, 24);
        return (data?._flatHours || []).slice(0, 24);
    }, [data, externalHours, hasExternal]);

    const trackRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const { points, path } = useMemo(() => {
        if (!hours.length) return { points: [], path: '' };
        const temps = hours.map((h) => h.temperature_c);
        const lo = Math.min(...temps);
        const hi = Math.max(...temps);
        const range = hi - lo || 1;
        const step = (CHART_CHART_WIDTH - CHART_PADDING * 2) / (hours.length - 1);
        const pts = temps.map((t, i) => ({
            x: CHART_PADDING + i * step,
            y: CHART_PADDING + (1 - (t - lo) / range) * (CHART_HEIGHT - CHART_PADDING * 2),
        }));
        return { points: pts, path: buildPath(pts) };
    }, [hours]);

    const updateFromClientX = useCallback((clientX) => {
        const el = trackRef.current;
        if (!el || points.length === 0) return;
        const rect = el.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        setActiveIndex(Math.round(ratio * (points.length - 1)));
    }, [points]);

    const handlePointerDown = useCallback((e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        updateFromClientX(e.clientX);
    }, [updateFromClientX]);

    const handlePointerMove = useCallback((e) => {
        if (e.buttons !== 1 && e.pointerType !== 'touch') return;
        updateFromClientX(e.clientX);
    }, [updateFromClientX]);

    if ((!hasExternal && isLoading) || !hours.length) return null;

    const safeIndex = Math.min(activeIndex, hours.length - 1);
    const active = hours[safeIndex];
    const activePoint = points[safeIndex];
    const conditionKey = getConditionKey(active?.condition);

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Temperature Timeline</CardTitle>
                <span className="text-xs text-stone-400 hidden xs:inline">Drag to explore</span>
            </CardHeader>

            <div className="flex items-center gap-3 mb-4">
                <WeatherIcon condition={conditionKey} size="lg" animated={false} />
                <div>
                    <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                        {formatTemp(active?.temperature_c, units)}
                    </p>
                    <p className="text-xs text-stone-500">
                        {safeIndex === 0 ? 'Right now' : formatHour(active?.datetime_utc)}
                    </p>
                </div>
            </div>

            <div
                ref={trackRef}
                className="relative w-full touch-none select-none cursor-grab active:cursor-grabbing"
                style={{ aspectRatio: `${CHART_CHART_WIDTH} / ${CHART_HEIGHT}` }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
            >
                <svg viewBox={`0 0 ${CHART_CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-full overflow-visible" aria-hidden="true">
                    <defs>
                        <linearGradient id="scrubberFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F97316" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {path && <path d={`${path} L${points[points.length - 1].x},${CHART_HEIGHT} L${points[0].x},${CHART_HEIGHT} Z`} fill="url(#scrubberFill)" />}
                    {path && <path d={path} fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                    {activePoint && (
                        <line x1={activePoint.x} y1={CHART_PADDING - 4} x2={activePoint.x} y2={CHART_HEIGHT - CHART_PADDING + 4} stroke="currentColor" className="text-stone-300 dark:text-white/10" strokeWidth="1" strokeDasharray="3 3" />
                    )}
                    {activePoint && <circle cx={activePoint.x} cy={activePoint.y} r="5" fill="#F97316" stroke="white" strokeWidth="2" />}
                </svg>
            </div>

            <div className="flex justify-between mt-2 text-[10px] text-stone-400 font-medium">
                <span>Now</span>
                <span>{formatHour(hours[hours.length - 1]?.datetime_utc)}</span>
            </div>
        </Card>
    );
}

export { HourlyScrubber };
export default HourlyScrubber;