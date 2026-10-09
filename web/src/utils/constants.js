// web/src/utils/constants.js
export const STORAGE_KEYS = {
    CONFIRMED_LOCATION: 'weatherly_confirmed_location',
    LOCATION_USER_CONFIRMED: 'weatherly_location_user_confirmed',
    SAVED_LOCATIONS: 'weatherly_saved_locations',
    ACTIVE_LOCATION: 'weatherly_active_location',
    UNITS: 'weatherly_units',
    THEME: 'weatherly_theme',
    RECENT_SEARCHES: 'weatherly_recent_searches',
};

export const SIDEBAR_NAV = [
    { path: '/', label: 'Weather', icon: 'CloudSun' },
    { path: '/forecast', label: 'Forecast', icon: 'CalendarDays' },
    { path: '/analytics', label: 'Analytics', icon: 'BarChart3' },
    { path: '/alerts', label: 'Alerts', icon: 'ShieldAlert' },
    { path: '/search', label: 'Search', icon: 'Search' },
    { path: '/settings', label: 'Settings', icon: 'Settings' },
    { path: '/apk', label: 'Download', icon: 'Download' },
];

export const BOTTOM_NAV = [
    { path: '/', label: 'Home', icon: 'CloudSun' },
    { path: '/forecast', label: 'Forecast', icon: 'CalendarDays' },
    { path: '/alerts', label: 'Alerts', icon: 'ShieldAlert' },
    { path: '/settings', label: 'Settings', icon: 'Settings' },
];