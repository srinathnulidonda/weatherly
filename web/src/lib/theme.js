// web/src/lib/theme.js
export const SEVERITY_TOKENS = {
    extreme: { hex: '#DC2626', bg: 'bg-red-600', text: 'text-white', dot: 'bg-red-400', label: 'Extreme' },
    severe: { hex: '#F97316', bg: 'bg-orange-500', text: 'text-white', dot: 'bg-orange-300', label: 'Severe' },
    moderate: { hex: '#FBBF24', bg: 'bg-amber-400', text: 'text-amber-950', dot: 'bg-amber-600', label: 'Moderate' },
    minor: { hex: '#A8A29E', bg: 'bg-stone-200 dark:bg-stone-800', text: 'text-stone-800 dark:text-stone-200', dot: 'bg-stone-500', label: 'Minor' },
    unknown: { hex: '#F59E0B', bg: 'bg-amber-500', text: 'text-white', dot: 'bg-amber-300', label: 'Unknown' },
};

export const AQI_TOKENS = [
    { max: 50, hex: '#22C55E', label: 'Good', textClass: 'text-green-500' },
    { max: 100, hex: '#F59E0B', label: 'Moderate', textClass: 'text-amber-500' },
    { max: 150, hex: '#F97316', label: 'Unhealthy for Sensitive Groups', textClass: 'text-orange-500' },
    { max: 200, hex: '#EF4444', label: 'Unhealthy', textClass: 'text-red-500' },
    { max: 300, hex: '#A855F7', label: 'Very Unhealthy', textClass: 'text-purple-500' },
    { max: Infinity, hex: '#881337', label: 'Hazardous', textClass: 'text-rose-900' },
];

export const UV_TOKENS = [
    { max: 2, hex: '#22C55E', label: 'Low', category: 'low' },
    { max: 5, hex: '#F59E0B', label: 'Moderate', category: 'moderate' },
    { max: 7, hex: '#F97316', label: 'High', category: 'high' },
    { max: 10, hex: '#EF4444', label: 'Very High', category: 'very_high' },
    { max: Infinity, hex: '#A855F7', label: 'Extreme', category: 'extreme' },
];

export const GAUGE_TOKENS = [
    { min: 80, hex: '#22C55E', label: 'Excellent' },
    { min: 60, hex: '#84CC16', label: 'Good' },
    { min: 40, hex: '#F59E0B', label: 'Fair' },
    { min: 20, hex: '#F97316', label: 'Poor' },
    { min: -Infinity, hex: '#EF4444', label: 'Bad' },
];

export const CHART_TOKENS = {
    line: '#F97316',
    fillFrom: 'rgba(249,115,22,0.3)',
    fillTo: 'rgba(249,115,22,0)',
    gridLight: 'rgba(0,0,0,0.06)',
    gridDark: 'rgba(255,255,255,0.04)',
};

export const TEMP_SCALE_TOKENS = [
    { temp: -10, hex: '#1D4ED8' },
    { temp: 0, hex: '#3B82F6' },
    { temp: 10, hex: '#06B6D4' },
    { temp: 20, hex: '#10B981' },
    { temp: 30, hex: '#F59E0B' },
    { temp: 40, hex: '#F97316' },
    { temp: 50, hex: '#EF4444' },
];

export const POLLUTANT_TOKENS = {
    pm2_5: { label: 'PM2.5', unit: 'μg/m³', safe: 12 },
    pm10: { label: 'PM10', unit: 'μg/m³', safe: 54 },
    o3: { label: 'O₃', unit: 'ppb', safe: 54 },
    no2: { label: 'NO₂', unit: 'ppb', safe: 53 },
    so2: { label: 'SO₂', unit: 'ppb', safe: 35 },
    co: { label: 'CO', unit: 'ppm', safe: 4.4 },
};

export function getGaugeToken(value) {
    if (value == null) return { hex: '#78716C', label: 'N/A' };
    return GAUGE_TOKENS.find((t) => value >= t.min);
}

export function getAqiToken(aqi) {
    if (aqi == null) return { hex: '#A8A29E', label: 'Unknown', textClass: 'text-stone-400' };
    return AQI_TOKENS.find((t) => aqi <= t.max);
}

export function getUvToken(uv) {
    if (uv == null) return { hex: '#A8A29E', label: 'Unknown', category: 'unknown' };
    return UV_TOKENS.find((t) => uv <= t.max);
}

export function getSeverityToken(severity) {
    const key = (severity || '').toLowerCase();
    return SEVERITY_TOKENS[key] || SEVERITY_TOKENS.unknown;
}