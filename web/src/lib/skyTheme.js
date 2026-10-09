// web/src/lib/skyTheme.js
import { CONDITION_CATEGORY } from './weatherCondition';

function clamp01(v) {
    return Math.max(0, Math.min(1, v));
}

function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(rgb) {
    return `#${rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
}

function mixHex(a, b, t) {
    const ra = hexToRgb(a);
    const rb = hexToRgb(b);
    return rgbToHex(ra.map((v, i) => v + (rb[i] - v) * t));
}

function mixStops(stopsA, stopsB, t) {
    const len = Math.max(stopsA.length, stopsB.length);
    const out = [];
    for (let i = 0; i < len; i++) {
        const a = stopsA[Math.min(i, stopsA.length - 1)];
        const b = stopsB[Math.min(i, stopsB.length - 1)];
        out.push(mixHex(a, b, t));
    }
    return out;
}

function toGradientCss(stops) {
    const step = 100 / (stops.length - 1);
    const parts = stops.map((color, i) => `${color} ${Math.round(i * step)}%`);
    return `linear-gradient(180deg, ${parts.join(', ')})`;
}

export const SKY_PALETTES = {
    [CONDITION_CATEGORY.CLEAR]: {
        night: ['#000208', '#020A1E', '#0A1836', '#182B52'],
        dawn: ['#0B1A3A', '#3A4A78', '#E8916B', '#FFD9A0'],
        day: ['#124C8C', '#2E7DC4', '#6FBBEE', '#DFF4FF'],
        dusk: ['#0F1B3E', '#4A3B6B', '#E8734F', '#FFB27A'],
    },
    [CONDITION_CATEGORY.PARTLY_CLOUDY]: {
        night: ['#01050E', '#091022', '#141D38', '#243456'],
        dawn: ['#0C1730', '#3C4C74', '#D98A6E', '#F7CBA4'],
        day: ['#1C5490', '#4485C4', '#84BEE4', '#E6F3FA'],
        dusk: ['#0E1836', '#48406C', '#D9704E', '#F0A876'],
    },
    [CONDITION_CATEGORY.CLOUDY]: {
        night: ['#06070B', '#0D1017', '#1A1F29', '#2C333F'],
        dawn: ['#171A22', '#3E4450', '#8A7A72', '#D9C4B0'],
        day: ['#4C5A6B', '#6E7C8D', '#9FAEBC', '#D8E0E7'],
        dusk: ['#181A24', '#453F4A', '#8C6F63', '#CFA98F'],
    },
    [CONDITION_CATEGORY.FOG]: {
        night: ['#0C0F13', '#111419', '#212530', '#363B44'],
        dawn: ['#1A1C22', '#484A4E', '#9C948C', '#E6D9C8'],
        day: ['#707E88', '#8B9AA4', '#BAC6CD', '#E9EDEF'],
        dusk: ['#1B1B22', '#4C4548', '#9C8078', '#DCB9A6'],
    },
    [CONDITION_CATEGORY.DRIZZLE]: {
        night: ['#05080F', '#0A111B', '#172433', '#28394B'],
        dawn: ['#0D1420', '#333F58', '#79697E', '#C9A98F'],
        day: ['#324357', '#4A6580', '#7791A9', '#B4C6D5'],
        dusk: ['#0E1522', '#3A3A5A', '#7D5E6E', '#C39683'],
    },
    [CONDITION_CATEGORY.RAIN]: {
        night: ['#04060D', '#070C14', '#101A28', '#1F2E3D'],
        dawn: ['#0A0F1A', '#2A3348', '#5C5468', '#9C8474'],
        day: ['#22323F', '#324B60', '#587489', '#87A0B4'],
        dusk: ['#0B111C', '#2E2E48', '#5E4A5A', '#93705F'],
    },
    [CONDITION_CATEGORY.HEAVY_RAIN]: {
        night: ['#020408', '#04060B', '#0A121C', '#14212F'],
        dawn: ['#07090F', '#1E2536', '#463F50', '#736153'],
        day: ['#151F2A', '#213041', '#42586F', '#67808F'],
        dusk: ['#080A11', '#20202F', '#483B47', '#6E5548'],
    },
    [CONDITION_CATEGORY.SNOW]: {
        night: ['#0B0F17', '#121924', '#233145', '#3B4D63'],
        dawn: ['#171B26', '#3E4658', '#9091A0', '#EBD9CB'],
        day: ['#5E6E82', '#7C8CA0', '#B4C1D1', '#F0F5F8'],
        dusk: ['#181926', '#454050', '#948190', '#E4C4C0'],
    },
    [CONDITION_CATEGORY.THUNDERSTORM]: {
        night: ['#010203', '#04050A', '#111319', '#1E212F'],
        dawn: ['#050609', '#1B1A22', '#463C3E', '#7A5F4E'],
        day: ['#0C0F16', '#171D2A', '#333C50', '#565F6D'],
        dusk: ['#06060A', '#1D1922', '#4A343A', '#734B44'],
    },
    [CONDITION_CATEGORY.WIND]: {
        night: ['#051215', '#08181C', '#153037', '#27484E'],
        dawn: ['#0C1A1E', '#2E4A4C', '#7C8A6E', '#D8CC9E'],
        day: ['#31707D', '#4B879A', '#8AB8C1', '#D6E8EA'],
        dusk: ['#0D1A1E', '#324242', '#7E6C5E', '#CDAE87'],
    },
    [CONDITION_CATEGORY.HAZE]: {
        night: ['#0D0B12', '#131017', '#231E2B', '#382E3D'],
        dawn: ['#181419', '#4A3E38', '#9E7F5E', '#E8CBA0'],
        day: ['#867454', '#A8987A', '#CFC3A3', '#EEE7D4'],
        dusk: ['#191319', '#4C3838', '#9E6C52', '#DDA985'],
    },
};

export const SKY_GLOW = {
    [CONDITION_CATEGORY.CLEAR]: { night: '#96AAE0', dawn: '#FFA36B', day: '#FFC66B', dusk: '#FF8656' },
    [CONDITION_CATEGORY.PARTLY_CLOUDY]: { night: '#96AAE0', dawn: '#FFA36B', day: '#FFC66B', dusk: '#FF8656' },
    [CONDITION_CATEGORY.CLOUDY]: { night: '#3E4553', dawn: '#D9A98C', day: '#C3CDD6', dusk: '#C98A6C' },
    [CONDITION_CATEGORY.FOG]: { night: '#3A4048', dawn: '#E6C9AE', day: '#C7D0D6', dusk: '#D9AE93' },
    [CONDITION_CATEGORY.DRIZZLE]: { night: '#2A3A4C', dawn: '#C99A80', day: '#7794AD', dusk: '#BD7E68' },
    [CONDITION_CATEGORY.RAIN]: { night: '#20303F', dawn: '#9C7E68', day: '#4E6A84', dusk: '#8D6353' },
    [CONDITION_CATEGORY.HEAVY_RAIN]: { night: '#152230', dawn: '#73604F', day: '#37506A', dusk: '#63483C' },
    [CONDITION_CATEGORY.SNOW]: { night: '#3C4E64', dawn: '#EAD3BF', day: '#E4ECF3', dusk: '#D9B3AC' },
    [CONDITION_CATEGORY.THUNDERSTORM]: { night: '#E8D466', dawn: '#E8C25E', day: '#F4DA6E', dusk: '#E0A252' },
    [CONDITION_CATEGORY.WIND]: { night: '#284A50', dawn: '#B7B487', day: '#89B7C0', dusk: '#C69A6C' },
    [CONDITION_CATEGORY.HAZE]: { night: '#38313F', dawn: '#DBAE7E', day: '#CABE9E', dusk: '#CB916A' },
};

export const PARTICLES_BY_CATEGORY = {
    [CONDITION_CATEGORY.CLEAR]: { day: 'sun', night: 'stars' },
    [CONDITION_CATEGORY.PARTLY_CLOUDY]: { day: 'clouds-sun', night: 'clouds-moon' },
    [CONDITION_CATEGORY.CLOUDY]: { day: 'clouds', night: 'clouds' },
    [CONDITION_CATEGORY.FOG]: { day: 'fog', night: 'fog' },
    [CONDITION_CATEGORY.DRIZZLE]: { day: 'rain-light', night: 'rain-light' },
    [CONDITION_CATEGORY.RAIN]: { day: 'rain', night: 'rain' },
    [CONDITION_CATEGORY.HEAVY_RAIN]: { day: 'rain-heavy', night: 'rain-heavy' },
    [CONDITION_CATEGORY.SNOW]: { day: 'snow', night: 'snow' },
    [CONDITION_CATEGORY.THUNDERSTORM]: { day: 'storm', night: 'storm' },
    [CONDITION_CATEGORY.WIND]: { day: 'wind', night: 'wind' },
    [CONDITION_CATEGORY.HAZE]: { day: 'haze', night: 'haze' },
};

function solveSolarArc(sunriseMs, sunsetMs, nowMs, hasAstro) {
    const dayLen = sunsetMs - sunriseMs;
    const nightLen = 86400000 - dayLen;
    const nadirMs = sunsetMs + nightLen / 2;
    const prevNadirMs = sunriseMs - nightLen / 2;

    if (nowMs >= sunriseMs && nowMs <= sunsetMs) {
        const t = (nowMs - sunriseMs) / dayLen;
        const elevation = Math.sin(t * Math.PI);
        if (t <= 0.5) return { elevation, from: 'dawn', to: 'day', t: t / 0.5, rising: true, hasAstro };
        return { elevation, from: 'day', to: 'dusk', t: (t - 0.5) / 0.5, rising: false, hasAstro };
    }

    if (nowMs > sunsetMs && nowMs <= nadirMs) {
        const t = (nowMs - sunsetMs) / (nightLen / 2);
        const elevation = -Math.sin(t * (Math.PI / 2));
        return { elevation, from: 'dusk', to: 'night', t, rising: false, hasAstro };
    }

    if (nowMs > nadirMs) {
        const t = clamp01((nowMs - nadirMs) / (nightLen / 2));
        const elevation = -Math.sin((1 - t) * (Math.PI / 2));
        return { elevation, from: 'night', to: 'dawn', t, rising: true, hasAstro };
    }

    if (nowMs >= prevNadirMs) {
        const t = clamp01((nowMs - prevNadirMs) / (nightLen / 2));
        const elevation = -Math.sin((1 - t) * (Math.PI / 2));
        return { elevation, from: 'night', to: 'dawn', t, rising: true, hasAstro };
    }

    return { elevation: -1, from: 'night', to: 'night', t: 0, rising: true, hasAstro };
}

export function computeSolarState({ sunrise, sunset, now } = {}) {
    const nowDate = now ? new Date(now) : new Date();
    const nowMs = nowDate.getTime();

    const sunriseMs = sunrise ? new Date(sunrise).getTime() : null;
    const sunsetMs = sunset ? new Date(sunset).getTime() : null;

    if (sunriseMs != null && sunsetMs != null && !Number.isNaN(sunriseMs) && !Number.isNaN(sunsetMs) && sunsetMs > sunriseMs) {
        return solveSolarArc(sunriseMs, sunsetMs, nowMs, true);
    }

    const fallback = new Date(nowDate);
    fallback.setHours(6, 30, 0, 0);
    const fallbackSunrise = fallback.getTime();
    fallback.setHours(19, 30, 0, 0);
    const fallbackSunset = fallback.getTime();
    return solveSolarArc(fallbackSunrise, fallbackSunset, nowMs, false);
}

export function getSkyGradient(category, from, to, t) {
    const table = SKY_PALETTES[category] || SKY_PALETTES[CONDITION_CATEGORY.CLOUDY];
    const stopsA = table[from] || table.day;
    const stopsB = table[to] || table.day;
    return toGradientCss(mixStops(stopsA, stopsB, clamp01(t)));
}

export function getSkyGlow(category, from, to, t) {
    const table = SKY_GLOW[category] || SKY_GLOW[CONDITION_CATEGORY.CLOUDY];
    const a = table[from] || table.day;
    const b = table[to] || table.day;
    return mixHex(a, b, clamp01(t));
}

export function getParticleVariant(category, isDay) {
    const entry = PARTICLES_BY_CATEGORY[category] || PARTICLES_BY_CATEGORY[CONDITION_CATEGORY.CLOUDY];
    return isDay ? entry.day : entry.night;
}

export function getGoldenIntensity(elevation) {
    return clamp01(1 - Math.abs(elevation) / 0.45);
}

const MOON_PHASE_ILLUMINATION = {
    new_moon: 0,
    waxing_crescent: 0.25,
    first_quarter: 0.5,
    waxing_gibbous: 0.75,
    full_moon: 1,
    waning_gibbous: 0.75,
    last_quarter: 0.5,
    waning_crescent: 0.25,
};

export function getMoonIllumination(phaseName) {
    if (!phaseName) return { illumination: 1, waxing: true, key: 'full_moon' };
    const key = phaseName.toLowerCase().trim().replace(/\s+/g, '_');
    const illumination = MOON_PHASE_ILLUMINATION[key] ?? 1;
    const waxing = key === 'new_moon' || key.startsWith('waxing') || key === 'first_quarter';
    return { illumination, waxing, key };
}

export function mixHexColors(a, b, t) {
    return mixHex(a, b, clamp01(t));
}