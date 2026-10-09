// web/src/stores/store.js
import { create } from 'zustand';
import { STORAGE_KEYS } from '../utils/constants';

function loadSavedLocation() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.CONFIRMED_LOCATION);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') return parsed;
        }
    } catch {
        localStorage.removeItem(STORAGE_KEYS.CONFIRMED_LOCATION);
    }
    return null;
}

function loadSavedLocations() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.SAVED_LOCATIONS);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function loadUserConfirmedFlag() {
    try {
        return localStorage.getItem(STORAGE_KEYS.LOCATION_USER_CONFIRMED) === 'true';
    } catch {
        return false;
    }
}

const saved = loadSavedLocation();
const initiallyConfirmed = !!saved && (
    loadUserConfirmedFlag() || !!saved.is_precise || saved.detection_method === 'manual_city'
);

export const useStore = create((set, get) => ({
    location: saved,
    locationLoading: false,
    locationError: null,
    showLocationWarning: !!saved && !initiallyConfirmed,
    locationConfirmed: initiallyConfirmed,

    setLocation(location) {
        if (!location) {
            localStorage.removeItem(STORAGE_KEYS.LOCATION_USER_CONFIRMED);
            set({ location: null, locationLoading: false, locationError: null, showLocationWarning: false, locationConfirmed: false });
            return;
        }

        const { locationConfirmed: alreadyConfirmed } = get();
        const isPrecise = !!location.is_precise;
        const isManualCity = location.detection_method === 'manual_city';
        const userPreviouslyConfirmed = loadUserConfirmedFlag();
        const confirmed = isPrecise || isManualCity || alreadyConfirmed || userPreviouslyConfirmed;

        const next = {
            latitude: location.latitude,
            longitude: location.longitude,
            city: location.city || null,
            state: location.state || null,
            country: location.country || null,
            country_code: location.country_code || null,
            timezone: location.timezone || null,
            is_precise: isPrecise,
            confidence: location.confidence ?? 0,
            detection_method: location.detection_method || 'unknown',
            source: location.source || 'manual',
            formatted_address: location.formatted_address || null,
            accuracy_m: location.accuracy_m || null,
        };

        set({ location: next, locationLoading: false, locationError: null, showLocationWarning: !confirmed, locationConfirmed: confirmed });

        if (confirmed) {
            localStorage.setItem(STORAGE_KEYS.CONFIRMED_LOCATION, JSON.stringify(next));
            localStorage.setItem(STORAGE_KEYS.LOCATION_USER_CONFIRMED, 'true');
        }
    },

    confirmLocation() {
        const { location } = get();
        if (location) localStorage.setItem(STORAGE_KEYS.CONFIRMED_LOCATION, JSON.stringify(location));
        localStorage.setItem(STORAGE_KEYS.LOCATION_USER_CONFIRMED, 'true');
        set({ showLocationWarning: false, locationConfirmed: true });
    },

    setLocationLoading(loading) {
        set({ locationLoading: loading, ...(loading ? { locationError: null } : {}) });
    },

    setLocationError(error) {
        const message = typeof error === 'string' ? error : error?.message || 'Location detection failed';
        set({ locationError: message, locationLoading: false });
    },

    clearLocation() {
        localStorage.removeItem(STORAGE_KEYS.CONFIRMED_LOCATION);
        localStorage.removeItem(STORAGE_KEYS.LOCATION_USER_CONFIRMED);
        set({ location: null, locationConfirmed: false, showLocationWarning: false, locationError: null, locationLoading: false });
    },

    savedLocations: loadSavedLocations(),
    activeLocationId: localStorage.getItem(STORAGE_KEYS.ACTIVE_LOCATION) || 'current',

    addSavedLocation(loc) {
        const id = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
        const { savedLocations } = get();
        if (!savedLocations.some((l) => l.id === id)) {
            const next = [...savedLocations, {
                id,
                latitude: loc.latitude,
                longitude: loc.longitude,
                city: loc.city || loc.name || null,
                state: loc.state || null,
                country: loc.country || null,
                country_code: loc.country_code || null,
                timezone: loc.timezone || null,
            }];
            localStorage.setItem(STORAGE_KEYS.SAVED_LOCATIONS, JSON.stringify(next));
            set({ savedLocations: next });
        }
        return id;
    },

    removeSavedLocation(id) {
        set((s) => {
            const next = s.savedLocations.filter((l) => l.id !== id);
            localStorage.setItem(STORAGE_KEYS.SAVED_LOCATIONS, JSON.stringify(next));
            return { savedLocations: next, activeLocationId: s.activeLocationId === id ? 'current' : s.activeLocationId };
        });
    },

    reorderSavedLocations(newOrder) {
        localStorage.setItem(STORAGE_KEYS.SAVED_LOCATIONS, JSON.stringify(newOrder));
        set({ savedLocations: newOrder });
    },

    setActiveLocationId(id) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_LOCATION, id);
        set({ activeLocationId: id });
    },

    theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'system',
    setTheme(theme) {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
        set({ theme });
    },

    units: localStorage.getItem(STORAGE_KEYS.UNITS) || import.meta.env.VITE_DEFAULT_UNITS || 'metric',
    setUnits(units) {
        localStorage.setItem(STORAGE_KEYS.UNITS, units);
        set({ units });
    },

    locationPanelOpen: false,
    setLocationPanelOpen(open) { set({ locationPanelOpen: open }); },
}));