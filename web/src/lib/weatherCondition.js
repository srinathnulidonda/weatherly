// web/src/lib/weatherCondition.js
export const CONDITION_CATEGORY = {
    CLEAR: 'clear',
    PARTLY_CLOUDY: 'partly_cloudy',
    CLOUDY: 'cloudy',
    FOG: 'fog',
    DRIZZLE: 'drizzle',
    THUNDERSTORM: 'thunderstorm',
    HEAVY_RAIN: 'heavy_rain',
    RAIN: 'rain',
    SNOW: 'snow',
    WIND: 'wind',
    HAZE: 'haze',
};

const KEYWORD_ORDER = [
    [['thunder', 'lightning'], CONDITION_CATEGORY.THUNDERSTORM],
    [['blizzard', 'sleet', 'ice_pellet', 'hail', 'snow'], CONDITION_CATEGORY.SNOW],
    [['torrential', 'heavy_rain', 'heavy_shower'], CONDITION_CATEGORY.HEAVY_RAIN],
    [['drizzle'], CONDITION_CATEGORY.DRIZZLE],
    [['freezing_rain', 'rain', 'shower'], CONDITION_CATEGORY.RAIN],
    [['dust', 'smoke', 'haze', 'sand', 'ash'], CONDITION_CATEGORY.HAZE],
    [['mist', 'fog'], CONDITION_CATEGORY.FOG],
    [['gale', 'tornado', 'squall', 'wind'], CONDITION_CATEGORY.WIND],
    [['overcast', 'cloud'], CONDITION_CATEGORY.CLOUDY],
    [['partly', 'partial'], CONDITION_CATEGORY.PARTLY_CLOUDY],
    [['clear', 'sunny'], CONDITION_CATEGORY.CLEAR],
];

export function normalizeConditionKey(condition) {
    if (!condition) return 'clear';
    const raw = typeof condition === 'string' ? condition : condition.main || condition.description || '';
    return raw.toLowerCase().trim().replace(/[\s-]+/g, '_').replace(/_+/g, '_');
}

function tokenize(key) {
    return key.split('_').filter(Boolean);
}

export function resolveConditionCategory(condition) {
    const key = normalizeConditionKey(condition);
    const tokens = tokenize(key);

    for (const [keywords, category] of KEYWORD_ORDER) {
        const matched = keywords.some((word) => {
            if (word.includes('_')) return key.includes(word);
            return tokens.some((token) => token.includes(word));
        });
        if (matched) return category;
    }
    return CONDITION_CATEGORY.CLOUDY;
}

export function isNightCondition(condition) {
    return tokenize(normalizeConditionKey(condition)).includes('night');
}

function getHourInTimezone(timezone) {
    try {
        const hourStr = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            hour12: false,
            timeZone: timezone,
        }).format(new Date());
        const hour = parseInt(hourStr, 10);
        return Number.isNaN(hour) ? null : hour % 24;
    } catch {
        return null;
    }
}

export function resolveIsDay(data) {
    if (typeof data?.is_day === 'boolean') return data.is_day;
    if (data?.condition && isNightCondition(data.condition)) return false;

    const sunrise = data?.astronomy?.sunrise;
    const sunset = data?.astronomy?.sunset;
    if (sunrise && sunset) {
        const now = Date.now();
        const sr = new Date(sunrise).getTime();
        const ss = new Date(sunset).getTime();
        if (!Number.isNaN(sr) && !Number.isNaN(ss)) return now >= sr && now <= ss;
    }

    const timezone = data?.timezone || data?.location?.timezone;
    if (timezone) {
        const hour = getHourInTimezone(timezone);
        if (hour != null) return hour >= 6 && hour < 19;
    }

    const hour = new Date().getHours();
    return hour >= 6 && hour < 19;
}

export function getConditionKey(condition) {
    return condition ? (condition.main || condition.description || null) : null;
}