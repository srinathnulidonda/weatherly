// web/src/utils/formatters.js
import { format, parseISO, isValid, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import { getAqiToken, getUvToken, getSeverityToken } from '@/lib/theme';

function safeParse(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return isValid(dateStr) ? dateStr : null;
    try {
        if (typeof dateStr === 'string') {
            const iso = parseISO(dateStr);
            if (isValid(iso)) return iso;
            const bare = dateStr.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
            if (bare) {
                const now = new Date();
                let h = parseInt(bare[1], 10);
                const m = parseInt(bare[2], 10);
                if (/pm/i.test(bare[3] || '') && h !== 12) h += 12;
                if (/am/i.test(bare[3] || '') && h === 12) h = 0;
                now.setHours(h, m, 0, 0);
                return isValid(now) ? now : null;
            }
            return null;
        }
        const d = new Date(dateStr);
        return isValid(d) ? d : null;
    } catch {
        return null;
    }
}

function getZonedDateKey(date, timezone) {
    if (!date) return null;
    try {
        if (timezone) {
            return new Intl.DateTimeFormat('en-CA', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).format(date);
        }
        return format(date, 'yyyy-MM-dd');
    } catch {
        return format(date, 'yyyy-MM-dd');
    }
}

export function convertTemp(tempC, units = 'metric') {
    if (tempC == null) return null;
    if (units === 'imperial') return (tempC * 9) / 5 + 32;
    if (units === 'standard') return tempC + 273.15;
    return tempC;
}

export function formatTemp(tempC, units = 'metric', showUnit = true) {
    if (tempC == null) return '--';
    const value = convertTemp(tempC, units);
    const rounded = Math.round(value);
    return showUnit ? `${rounded}°` : String(rounded);
}

export function getTempUnitSymbol(units = 'metric') {
    if (units === 'imperial') return '°F';
    if (units === 'standard') return 'K';
    return '°C';
}

export function formatWind(speedMs, units = 'metric') {
    if (speedMs == null) return '--';
    if (units === 'imperial') return `${(speedMs * 2.237).toFixed(1)} mph`;
    return `${speedMs.toFixed(1)} m/s`;
}

export function formatPressure(hpa, units = 'metric') {
    if (hpa == null) return '--';
    if (units === 'imperial') return `${(hpa * 0.02953).toFixed(2)} inHg`;
    return `${Math.round(hpa)} hPa`;
}

export function formatVisibility(meters, units = 'metric') {
    if (meters == null) return '--';
    if (units === 'imperial') {
        const miles = meters / 1609.34;
        return miles >= 0.1 ? `${miles.toFixed(1)} mi` : `${Math.round(meters * 3.28084)} ft`;
    }
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
}

export function formatPercent(value) {
    if (value == null) return '--';
    return `${Math.round(value)}%`;
}

export function normalizePrecipProbability(value) {
    if (value == null) return null;
    const n = Number(value);
    if (Number.isNaN(n)) return null;
    const pct = n <= 1 ? n * 100 : n;
    return Math.max(0, Math.min(100, pct));
}

export function getPrecipChance(entry) {
    if (!entry) return null;
    if (entry.pop != null) return normalizePrecipProbability(entry.pop);
    if (entry.precipitation?.probability != null) return normalizePrecipProbability(entry.precipitation.probability);
    return null;
}

export function formatPrecipitation(mm, units = 'metric') {
    if (mm == null) return units === 'imperial' ? '0 in' : '0 mm';
    if (units === 'imperial') {
        const inches = mm / 25.4;
        return inches < 0.01 ? '<0.01 in' : `${inches.toFixed(2)} in`;
    }
    if (mm === 0) return '0 mm';
    if (mm < 0.1) return '<0.1 mm';
    return `${mm.toFixed(1)} mm`;
}

export function formatDate(dateStr, fmt = 'MMM d') {
    const d = safeParse(dateStr);
    return d ? format(d, fmt) : '--';
}

export function formatTime(dateStr, fmt = 'h:mm a', timezone = null) {
    const d = safeParse(dateStr);
    if (!d) return '--';
    if (timezone) {
        try {
            return new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: timezone,
            }).format(d);
        } catch {
            return format(d, fmt);
        }
    }
    return format(d, fmt);
}

export function formatHour(dateStr, timezone = null) {
    const d = safeParse(dateStr);
    if (!d) return '--';
    if (timezone) {
        try {
            const parts = new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                hour12: true,
                timeZone: timezone,
            }).formatToParts(d);
            const hourPart = parts.find((p) => p.type === 'hour')?.value || '';
            const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value || '';
            return `${hourPart}${dayPeriod}`.toLowerCase();
        } catch {
            return format(d, 'ha').toLowerCase();
        }
    }
    return format(d, 'ha').toLowerCase();
}

export function formatDay(dateStr, timezone = null) {
    const d = safeParse(dateStr);
    if (!d) return '--';
    if (timezone) {
        const dayKey = getZonedDateKey(d, timezone);
        const todayKey = getZonedDateKey(new Date(), timezone);
        const tomorrowKey = getZonedDateKey(new Date(Date.now() + 24 * 60 * 60 * 1000), timezone);
        if (dayKey === todayKey) return 'Today';
        if (dayKey === tomorrowKey) return 'Tomorrow';
        try {
            return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: timezone }).format(d);
        } catch {
            return format(d, 'EEE');
        }
    }
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEE');
}

export function formatDateTime(dateStr) {
    return formatDate(dateStr, 'MMM d, h:mm a');
}

export function formatRelative(dateStr) {
    const d = safeParse(dateStr);
    if (!d) return '--';
    return formatDistanceToNow(d, { addSuffix: true });
}

export function getAqiInfo(aqi) {
    const token = getAqiToken(aqi);
    return { label: token.label, color: token.hex, textClass: token.textClass || 'text-stone-400' };
}

export function getUvInfo(uv) {
    const token = getUvToken(uv);
    return { label: token.label, color: token.hex, category: token.category };
}

export function getWindLabel(deg) {
    if (deg == null) return '--';
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
}

const BEAUFORT_LABELS = [
    'Calm', 'Light Air', 'Light Breeze', 'Gentle Breeze',
    'Moderate Breeze', 'Fresh Breeze', 'Strong Breeze',
    'Near Gale', 'Gale', 'Strong Gale', 'Storm',
    'Violent Storm', 'Hurricane',
];

const BEAUFORT_THRESHOLDS = [0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7];

export function getBeaufortLabel(bf) {
    return BEAUFORT_LABELS[bf] || 'Unknown';
}

export function getBeaufortFromSpeed(speedMs) {
    if (speedMs == null) return { scale: 0, label: BEAUFORT_LABELS[0] };
    for (let i = 0; i < BEAUFORT_THRESHOLDS.length; i++) {
        if (speedMs < BEAUFORT_THRESHOLDS[i]) return { scale: i, label: BEAUFORT_LABELS[i] };
    }
    return { scale: 12, label: BEAUFORT_LABELS[12] };
}

export function getSeverityConfig(severity) {
    const token = getSeverityToken(severity);
    return { bg: token.bg, text: token.text, dot: token.dot, hex: token.hex, label: token.label };
}

export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatCondition(condition) {
    if (!condition) return 'Unknown';
    return capitalize(condition.description || condition.main || 'Unknown');
}

export { getZonedDateKey };