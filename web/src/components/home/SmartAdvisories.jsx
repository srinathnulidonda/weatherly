// web/src/components/home/SmartAdvisories.jsx
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Umbrella, Sun, Thermometer, Wind, ShieldAlert, Sparkles,
    CloudLightning, Snowflake, CloudFog, Flame, ThermometerSnowflake, ThermometerSun, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { CONDITION_CATEGORY, resolveConditionCategory } from '@/lib/weatherCondition';
import { useCurrentWeather, useHourlyForecast, useAirQuality } from '@/hooks/useWeather';
import { useStore } from '@/stores/store';
import { formatTemp, formatWind, getPrecipChance } from '@/utils/formatters';

const ICONS = {
    Umbrella, Sun, Thermometer, Wind, ShieldAlert, Sparkles,
    CloudLightning, Snowflake, CloudFog, Flame, ThermometerSnowflake, ThermometerSun,
};

const TONE_STYLES = {
    info: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    caution: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    warning: 'bg-red-500/10 text-red-600 dark:text-red-400',
    positive: 'bg-green-500/10 text-green-600 dark:text-green-400',
};

const TONE_ACCENT = {
    warning: 'bg-red-500',
    caution: 'bg-amber-500',
    info: 'bg-orange-500',
    positive: 'bg-green-500',
};

const VISIBLE_COUNT = 3;

const RAIN_CATEGORIES = [CONDITION_CATEGORY.RAIN, CONDITION_CATEGORY.HEAVY_RAIN, CONDITION_CATEGORY.DRIZZLE];

const RULES = [
    {
        id: 'severe-storm', icon: 'CloudLightning', tone: 'warning', priority: 0,
        test: ({ current }) => resolveConditionCategory(current?.condition) === CONDITION_CATEGORY.THUNDERSTORM,
        message: () => 'Thunderstorms nearby — move indoors and avoid open areas or tall isolated objects.',
    },
    {
        id: 'extreme-cold', icon: 'ThermometerSnowflake', tone: 'warning', priority: 1,
        test: ({ current }) => current?.temperature_c != null && current.temperature_c <= -10,
        message: ({ current, units }) => `Dangerously cold at ${formatTemp(current.temperature_c, units)} — limit time outdoors and cover exposed skin.`,
    },
    {
        id: 'heat-warning', icon: 'Flame', tone: 'warning', priority: 1,
        test: ({ current }) => current?.temperature_c != null && current.temperature_c >= 35,
        message: () => 'Extreme heat today — stay hydrated and avoid direct sun during peak hours.',
    },
    {
        id: 'poor-air-severe', icon: 'ShieldAlert', tone: 'warning', priority: 1,
        test: ({ air }) => air?.aqi != null && air.aqi > 150,
        message: ({ air }) => `Air quality is unhealthy (AQI ${air.aqi}) — avoid prolonged outdoor exertion.`,
    },
    {
        id: 'rain-active', icon: 'Umbrella', tone: 'caution', priority: 1,
        test: ({ current }) => RAIN_CATEGORIES.includes(resolveConditionCategory(current?.condition)),
        message: () => 'Rain is falling right now — grab an umbrella before heading out.',
    },
    {
        id: 'snow-alert', icon: 'Snowflake', tone: 'caution', priority: 1,
        test: ({ current }) => resolveConditionCategory(current?.condition) === CONDITION_CATEGORY.SNOW,
        message: () => 'Snow is falling — roads and walkways may be slippery, drive carefully.',
    },
    {
        id: 'rain-soon', icon: 'Umbrella', tone: 'caution', priority: 2,
        test: ({ current, hours }) => {
            if (RAIN_CATEGORIES.includes(resolveConditionCategory(current?.condition))) return false;
            return hours.slice(1, 6).some((h) => (getPrecipChance(h) ?? 0) >= 50);
        },
        message: ({ hours }) => {
            const idx = hours.slice(1, 6).findIndex((h) => (getPrecipChance(h) ?? 0) >= 50);
            const hoursAway = idx + 1;
            return `Rain likely within ${hoursAway} hour${hoursAway > 1 ? 's' : ''} — plan to bring an umbrella.`;
        },
    },
    {
        id: 'fog-alert', icon: 'CloudFog', tone: 'caution', priority: 2,
        test: ({ current }) => resolveConditionCategory(current?.condition) === CONDITION_CATEGORY.FOG,
        message: () => 'Foggy conditions are reducing visibility — allow extra time and following distance if driving.',
    },
    {
        id: 'strong-wind', icon: 'Wind', tone: 'caution', priority: 2,
        test: ({ current }) => (current?.wind?.speed_ms != null && current.wind.speed_ms >= 12) || resolveConditionCategory(current?.condition) === CONDITION_CATEGORY.WIND,
        message: ({ current, units }) => {
            const speed = current?.wind?.speed_ms;
            const gust = current?.wind?.gust_ms;
            if (speed != null && gust != null && gust - speed >= 8) {
                return `Gusty winds up to ${formatWind(gust, units)} expected — secure loose outdoor items.`;
            }
            return speed != null
                ? `Winds around ${formatWind(speed, units)} — secure loose objects outdoors.`
                : 'Windy conditions expected — secure loose objects outdoors.';
        },
    },
    {
        id: 'poor-air-moderate', icon: 'ShieldAlert', tone: 'caution', priority: 3,
        test: ({ air }) => air?.aqi != null && air.aqi > 100 && air.aqi <= 150,
        message: ({ air }) => `Air quality is unhealthy for sensitive groups (AQI ${air.aqi}) — limit exertion if you have asthma or heart conditions.`,
    },
    {
        id: 'high-uv', icon: 'Sun', tone: 'caution', priority: 3,
        test: ({ current }) => current?.uv_index != null && current.uv_index >= 6,
        message: ({ current }) => current.uv_index >= 8
            ? `UV index is ${current.uv_index} (very high) — sunburn can occur in minutes, seek shade and wear SPF 30+.`
            : `UV index is ${current.uv_index} — wear sunscreen and sunglasses if you're out for long.`,
    },
    {
        id: 'cold-snap', icon: 'Thermometer', tone: 'caution', priority: 3,
        test: ({ current }) => current?.temperature_c != null && current.temperature_c <= 2 && current.temperature_c > -10,
        message: ({ current, units }) => `It's ${formatTemp(current.temperature_c, units)} out — bundle up before heading outside.`,
    },
    {
        id: 'feels-different', icon: 'ThermometerSun', tone: 'info', priority: 4,
        test: ({ current }) => current?.feels_like_c != null && current?.temperature_c != null && Math.abs(current.feels_like_c - current.temperature_c) >= 5,
        message: ({ current, units }) => current.feels_like_c < current.temperature_c
            ? `Feels like ${formatTemp(current.feels_like_c, units)} — noticeably colder than actual due to wind.`
            : `Feels like ${formatTemp(current.feels_like_c, units)} — warmer than actual due to humidity.`,
    },
    {
        id: 'clear-good-day', icon: 'Sparkles', tone: 'info', priority: 5,
        test: ({ current, hours }) => {
            const category = resolveConditionCategory(current?.condition);
            const noRain = hours.slice(0, 8).every((h) => (getPrecipChance(h) ?? 0) < 20);
            return category === CONDITION_CATEGORY.CLEAR && noRain && current?.temperature_c >= 15 && current?.temperature_c <= 28;
        },
        message: () => 'Great day to be outside — clear skies and comfortable temperatures.',
    },
];

function generateAdvisories({ current, hours = [], air = null, units }) {
    if (!current) return [];
    const context = { current, hours, air, units };

    const matches = RULES
        .filter((rule) => {
            try { return rule.test(context); } catch { return false; }
        })
        .map((rule) => ({
            id: rule.id,
            icon: rule.icon,
            tone: typeof rule.tone === 'function' ? rule.tone(context) : rule.tone,
            priority: rule.priority,
            message: rule.message(context),
        }))
        .sort((a, b) => a.priority - b.priority);

    if (matches.length === 0) {
        return [{
            id: 'all-clear',
            icon: 'Sparkles',
            tone: 'positive',
            priority: 99,
            message: 'No major weather concerns right now — enjoy your day.',
        }];
    }

    return matches;
}

function AdvisoryRow({ a, i }) {
    const Icon = ICONS[a.icon] || Sparkles;

    return (
        <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="relative flex items-start sm:items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl sm:rounded-3xl glass overflow-hidden"
        >
            <span className={cn(
                'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full',
                a.tone === 'warning' ? 'h-8 sm:h-7' : 'h-5 sm:h-5',
                TONE_ACCENT[a.tone] || 'bg-orange-500'
            )} />

            <div className={cn(
                'w-7 h-7 sm:w-8 sm:h-8 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0',
                TONE_STYLES[a.tone]
            )}>
                <Icon size={13} className="sm:w-[15px] sm:h-[15px]" />
            </div>

            <p className="text-[12px] sm:text-sm font-medium text-stone-700 dark:text-stone-300 leading-snug min-w-0 flex-1">
                {a.message}
            </p>
        </motion.div>
    );
}

function SmartAdvisories({ className }) {
    const units = useStore((s) => s.units);
    const { data: current } = useCurrentWeather();
    const { data: hourly } = useHourlyForecast(2);
    const { data: air } = useAirQuality();
    const [expanded, setExpanded] = useState(false);

    const advisories = useMemo(() => {
        return generateAdvisories({ current, hours: hourly?._flatHours || [], air, units });
    }, [current, hourly, air, units]);

    if (advisories.length === 0) return null;

    const visible = expanded ? advisories : advisories.slice(0, VISIBLE_COUNT);
    const hiddenCount = advisories.length - VISIBLE_COUNT;

    return (
        <div className={cn('flex flex-col gap-1.5 sm:gap-2', className)}>
            <AnimatePresence initial={false}>
                {visible.map((a, i) => (
                    <AdvisoryRow key={a.id} a={a} i={i} />
                ))}
            </AnimatePresence>

            {advisories.length > VISIBLE_COUNT && (
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="flex items-center justify-center gap-1 py-2 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-stone-900/5 dark:hover:bg-white/[0.04] transition-all duration-200 active:scale-[0.98] min-touch focus-ring"
                >
                    {expanded ? 'Show less' : `Show ${hiddenCount} more`}
                    <ChevronDown size={12} className={cn('transition-transform duration-200', expanded && 'rotate-180')} />
                </button>
            )}
        </div>
    );
}

export { SmartAdvisories };
export default SmartAdvisories;