// web/src/components/analytics/TempChart.jsx
import { useId, useMemo } from 'react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip, ReferenceLine,
} from 'recharts';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/cn';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { useTheme } from '@/hooks/useTheme';
import { convertTemp, formatTemp } from '@/utils/formatters';
import { CHART_TOKENS } from '@/lib/theme';

function TempChart({ dataPoints, periodHours, units = 'metric', className }) {
    const { isDark } = useTheme();
    const rawId = useId();
    const gradientId = `tempGrad-${rawId.replace(/[:]/g, '')}`;

    const chartData = useMemo(() => {
        if (!dataPoints || dataPoints.length === 0) return [];
        return dataPoints.map((p) => {
            let label = '';
            try {
                const d = typeof p.datetime_utc === 'string' ? parseISO(p.datetime_utc) : new Date(p.datetime_utc);
                if (isValid(d)) {
                    label = periodHours <= 24 ? format(d, 'ha') : format(d, 'MMM d ha');
                }
            } catch {
                label = '';
            }
            return {
                time: label,
                temp: p.temperature_c != null ? convertTemp(p.temperature_c, units) : null,
                humidity: p.humidity,
                pressure: p.pressure_hpa,
                wind: p.wind_speed_ms,
            };
        });
    }, [dataPoints, periodHours, units]);

    if (chartData.length === 0) return null;

    const temps = chartData.map((d) => d.temp).filter((t) => t != null);
    const avgTemp = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null;

    const gridColor = isDark ? CHART_TOKENS.gridDark : CHART_TOKENS.gridLight;
    const textColor = isDark ? '#78716C' : '#A8A29E';

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Temperature Trend — {periodHours}h</CardTitle>
                {avgTemp != null && (
                    <span className="text-xs text-stone-400">
                        Avg: {Math.round(avgTemp)}°
                    </span>
                )}
            </CardHeader>

            <div className="h-52 sm:h-64 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={CHART_TOKENS.line} stopOpacity={0.3} />
                                <stop offset="100%" stopColor={CHART_TOKENS.line} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: textColor, fontSize: 10 }}
                            interval="preserveStartEnd"
                            minTickGap={40}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: textColor, fontSize: 10 }}
                            tickFormatter={(v) => `${Math.round(v)}°`}
                            domain={['auto', 'auto']}
                            width={35}
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        {avgTemp != null && (
                            <ReferenceLine
                                y={avgTemp}
                                stroke={isDark ? 'rgba(249,115,22,0.25)' : 'rgba(249,115,22,0.3)'}
                                strokeDasharray="4 4"
                            />
                        )}
                        <Area
                            type="monotone"
                            dataKey="temp"
                            stroke={CHART_TOKENS.line}
                            strokeWidth={2}
                            fill={`url(#${gradientId})`}
                            dot={false}
                            activeDot={{ r: 4, fill: CHART_TOKENS.line, stroke: '#fff', strokeWidth: 2 }}
                            animationDuration={800}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;

    return (
        <div className="glass-elevated rounded-xl px-3 py-2 text-xs shadow-xl">
            <p className="font-medium text-stone-700 dark:text-stone-200 mb-1">{label}</p>
            {data.temp != null && (
                <p className="text-orange-500 font-semibold">{Math.round(data.temp)}°</p>
            )}
            {data.humidity != null && (
                <p className="text-stone-500">Humidity: {Math.round(data.humidity)}%</p>
            )}
            {data.wind != null && (
                <p className="text-stone-500">Wind: {data.wind.toFixed(1)} m/s</p>
            )}
        </div>
    );
}

export { TempChart };
export default TempChart;