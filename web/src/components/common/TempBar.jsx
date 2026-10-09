// web/src/components/common/TempBar.jsx
import { cn } from '@/lib/cn';
import { Tooltip } from '../ui/Tooltip';
import { convertTemp, getTempUnitSymbol } from '@/utils/formatters';
import { TEMP_SCALE_TOKENS } from '@/lib/theme';

function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(rgb) {
    return `#${rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
}

function colorAtTemp(temp) {
    const stops = TEMP_SCALE_TOKENS;
    if (temp <= stops[0].temp) return stops[0].hex;
    if (temp >= stops[stops.length - 1].temp) return stops[stops.length - 1].hex;
    for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i];
        const b = stops[i + 1];
        if (temp >= a.temp && temp <= b.temp) {
            const ratio = (temp - a.temp) / (b.temp - a.temp);
            const rgbA = hexToRgb(a.hex);
            const rgbB = hexToRgb(b.hex);
            const mixed = rgbA.map((v, idx) => v + (rgbB[idx] - v) * ratio);
            return rgbToHex(mixed);
        }
    }
    return stops[stops.length - 1].hex;
}

function getBarGradient(min, max) {
    if (min == null || max == null || max <= min) return undefined;
    const steps = 4;
    const stops = Array.from({ length: steps + 1 }, (_, i) => {
        const t = min + ((max - min) * i) / steps;
        const pct = (i / steps) * 100;
        return `${colorAtTemp(t)} ${pct}%`;
    });
    return `linear-gradient(to right, ${stops.join(', ')})`;
}

function TempBar({
    min,
    max,
    rangeMin,
    rangeMax,
    dayMin,
    dayMax,
    currentTemp,
    units = 'metric',
    height = 'h-1.5',
    showLabels = true,
    temperatureFormat = 'separate',
    className
}) {
    if (min == null || max == null) return null;

    const effectiveMin = rangeMin ?? dayMin ?? min - 5;
    const effectiveMax = rangeMax ?? dayMax ?? max + 5;
    const totalRange = effectiveMax - effectiveMin;
    if (totalRange <= 0) return null;

    const leftPct = Math.max(0, Math.min(100, ((min - effectiveMin) / totalRange) * 100));
    const rightPct = Math.max(0, Math.min(100, ((max - effectiveMin) / totalRange) * 100));
    const widthPct = Math.max(4, rightPct - leftPct);
    const gradient = getBarGradient(min, max);

    let currentPct = null;
    if (currentTemp != null) {
        currentPct = Math.max(0, Math.min(100, ((currentTemp - effectiveMin) / totalRange) * 100));
    }

    const unitSymbol = getTempUnitSymbol(units);
    const displayMin = Math.round(convertTemp(min, units));
    const displayMax = Math.round(convertTemp(max, units));

    const tooltipContent = `${displayMin}/${displayMax}${unitSymbol}`;

    return (
        <Tooltip content={tooltipContent}>
            <div className={cn('flex items-center gap-2 min-w-0', temperatureFormat === 'combined' ? 'w-fit' : 'w-full', className)}>
                {showLabels && temperatureFormat === 'separate' && (
                    <span className="text-xs text-stone-500 dark:text-stone-500 w-7 text-right tabular-nums shrink-0">
                        {displayMin}°
                    </span>
                )}
                <div className={cn(temperatureFormat === 'combined' ? 'w-14 sm:w-20' : 'flex-1', 'relative rounded-full bg-stone-200 dark:bg-white/[0.06]', height)}>
                    <div
                        className={cn('absolute top-0 rounded-full', height)}
                        style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            background: gradient || colorAtTemp((min + max) / 2),
                        }}
                    />
                    {currentPct != null && (
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white dark:bg-stone-100 border-2 border-stone-700 dark:border-stone-300 shadow-sm z-10"
                            style={{ left: `${currentPct}%`, marginLeft: '-5px' }}
                        />
                    )}
                </div>
                {showLabels && temperatureFormat === 'separate' && (
                    <span className="text-xs font-medium text-stone-700 dark:text-stone-300 w-7 tabular-nums shrink-0">
                        {displayMax}°
                    </span>
                )}
                {showLabels && temperatureFormat === 'combined' && (
                    <span className="text-[12px] sm:text-sm font-semibold text-stone-700 dark:text-stone-300 tabular-nums whitespace-nowrap shrink-0">
                        {displayMin}/{displayMax}{unitSymbol}
                    </span>
                )}
            </div>
        </Tooltip>
    );
}

export { TempBar };
export default TempBar;