// web/src/components/ui/WeatherIcon.jsx
import { cn } from '@/lib/cn';
import {
    Sun, Moon, CloudSun, CloudMoon, Cloud, CloudFog, CloudDrizzle,
    CloudRain, CloudRainWind, CloudSnow, CloudLightning, Wind, Haze,
} from 'lucide-react';
import { CONDITION_CATEGORY, resolveConditionCategory, isNightCondition, normalizeConditionKey } from '@/lib/weatherCondition';

const SIZE_PX = { xs: 16, sm: 20, md: 28, lg: 40, xl: 56, '2xl': 72, '3xl': 88, hero: 112 };

const ICON_MAP = {
    [CONDITION_CATEGORY.CLEAR]: { day: Sun, night: Moon, color: '#FDA929', nightColor: '#C9CEDB' },
    [CONDITION_CATEGORY.PARTLY_CLOUDY]: { day: CloudSun, night: CloudMoon, color: '#FDA929', nightColor: '#C9CEDB' },
    [CONDITION_CATEGORY.CLOUDY]: { day: Cloud, night: Cloud, color: '#9AA5B1', nightColor: '#6B7280' },
    [CONDITION_CATEGORY.FOG]: { day: CloudFog, night: CloudFog, color: '#B7C1CA', nightColor: '#7C8894' },
    [CONDITION_CATEGORY.DRIZZLE]: { day: CloudDrizzle, night: CloudDrizzle, color: '#5B9BD5', nightColor: '#4A7FAE' },
    [CONDITION_CATEGORY.RAIN]: { day: CloudRain, night: CloudRain, color: '#4E80B0', nightColor: '#3D6690' },
    [CONDITION_CATEGORY.HEAVY_RAIN]: { day: CloudRainWind, night: CloudRainWind, color: '#3A6494', nightColor: '#2C4F76' },
    [CONDITION_CATEGORY.SNOW]: { day: CloudSnow, night: CloudSnow, color: '#9BB3C8', nightColor: '#7E93A6' },
    [CONDITION_CATEGORY.THUNDERSTORM]: { day: CloudLightning, night: CloudLightning, color: '#F4C542', nightColor: '#E0B430' },
    [CONDITION_CATEGORY.WIND]: { day: Wind, night: Wind, color: '#4FB0BE', nightColor: '#3D8E9A' },
    [CONDITION_CATEGORY.HAZE]: { day: Haze, night: Haze, color: '#C3B389', nightColor: '#A0906A' },
};

const CATEGORY_LABEL = {
    [CONDITION_CATEGORY.CLEAR]: 'Clear sky', [CONDITION_CATEGORY.PARTLY_CLOUDY]: 'Partly cloudy',
    [CONDITION_CATEGORY.CLOUDY]: 'Cloudy', [CONDITION_CATEGORY.FOG]: 'Foggy',
    [CONDITION_CATEGORY.DRIZZLE]: 'Light drizzle', [CONDITION_CATEGORY.THUNDERSTORM]: 'Thunderstorm',
    [CONDITION_CATEGORY.HEAVY_RAIN]: 'Heavy rain', [CONDITION_CATEGORY.RAIN]: 'Rain',
    [CONDITION_CATEGORY.SNOW]: 'Snow', [CONDITION_CATEGORY.WIND]: 'Windy', [CONDITION_CATEGORY.HAZE]: 'Hazy',
};

function WeatherIcon({ condition, size = 'md', animated = false, glow = false, className }) {
    const category = resolveConditionCategory(condition);
    const isDay = !isNightCondition(condition);
    const entry = ICON_MAP[category] || ICON_MAP[CONDITION_CATEGORY.CLOUDY];
    const Icon = isDay ? entry.day : entry.night;
    const color = isDay ? entry.color : entry.nightColor;
    const label = CATEGORY_LABEL[category] || normalizeConditionKey(condition).replace(/_/g, ' ');
    const px = typeof size === 'number' ? size : (SIZE_PX[size] || SIZE_PX.md);

    return (
        <div
            role="img"
            aria-label={label}
            className={cn(
                'inline-flex items-center justify-center shrink-0',
                animated && 'animate-icon-float',
                className
            )}
            style={{
                width: px,
                height: px,
                ...(glow ? { filter: `drop-shadow(0 0 14px ${color}59)` } : {}),
            }}
        >
            <Icon size={px} color={color} strokeWidth={1.75} />
        </div>
    );
}

export { WeatherIcon };
export default WeatherIcon;