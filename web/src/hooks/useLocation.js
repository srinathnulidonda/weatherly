// web/src/hooks/useLocation.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../stores/store';
import { locationsApi } from '../api/locations';
import { STORAGE_KEYS } from '../utils/constants';

const shouldLog = import.meta.env.VITE_ENABLE_DEBUG_TOOLS === 'true';

const HIGH_ACCURACY_OPTIONS = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
};

const BALANCED_OPTIONS = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000,
};

function getTimezoneHint() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return null;
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export function useLocation() {
    const location = useStore((s) => s.location);
    const locationLoading = useStore((s) => s.locationLoading);
    const locationError = useStore((s) => s.locationError);
    const showLocationWarning = useStore((s) => s.showLocationWarning);
    const locationConfirmed = useStore((s) => s.locationConfirmed);
    const setLocation = useStore((s) => s.setLocation);
    const confirmLocation = useStore((s) => s.confirmLocation);
    const setLocationLoading = useStore((s) => s.setLocationLoading);
    const setLocationError = useStore((s) => s.setLocationError);
    const clearLocation = useStore((s) => s.clearLocation);

    const initRan = useRef(false);
    const watchId = useRef(null);
    const lastKnownPosition = useRef(null);
    const locationRef = useRef(location);
    const locationCache = useRef({
        timestamp: null,
        coords: null,
        accuracy: null,
    });

    useEffect(() => {
        locationRef.current = location;
    }, [location]);

    const detectViaBrowser = useCallback((options = BALANCED_OPTIONS) => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation API not supported'));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    resolve({
                        browser_latitude: pos.coords.latitude,
                        browser_longitude: pos.coords.longitude,
                        browser_accuracy_m: pos.coords.accuracy,
                        timezone_hint: getTimezoneHint(),
                        timestamp: pos.timestamp,
                    });
                },
                (err) => {
                    reject(err);
                },
                options
            );
        });
    }, []);

    const watchPosition = useCallback((callback, errorCallback) => {
        if (!navigator.geolocation) {
            errorCallback(new Error('Geolocation API not supported'));
            return;
        }

        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
        }

        watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
                if (pos.coords.accuracy <= 100) {
                    callback({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        timestamp: pos.timestamp,
                    });
                } else if (shouldLog) {
                    console.warn(`Low accuracy GPS fix: ${pos.coords.accuracy}m`);
                }
            },
            (err) => {
                errorCallback(err);
            },
            HIGH_ACCURACY_OPTIONS
        );
    }, []);

    const clearWatch = useCallback(() => {
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
    }, []);

    const detectViaIp = useCallback(async () => {
        const payload = {
            timezone_hint: getTimezoneHint(),
        };
        const response = await locationsApi.detect(payload);
        return response.data;
    }, []);

    const isCacheValid = useCallback((maxAgeMs = 900000) => {
        if (!locationCache.current.timestamp || !locationCache.current.coords) {
            return false;
        }
        const age = Date.now() - locationCache.current.timestamp;
        return age <= maxAgeMs;
    }, []);

    const updateLocationCache = useCallback((position) => {
        locationCache.current = {
            timestamp: Date.now(),
            coords: {
                latitude: position.latitude,
                longitude: position.longitude,
            },
            accuracy: position.accuracy,
        };
        lastKnownPosition.current = position;

        try {
            localStorage.setItem(STORAGE_KEYS.CONFIRMED_LOCATION, JSON.stringify({
                latitude: position.latitude,
                longitude: position.longitude,
                accuracy: position.accuracy,
                timestamp: Date.now(),
            }));
        } catch (e) {
            if (shouldLog) console.warn('Failed to cache location:', e);
        }
    }, []);

    const detectLocation = useCallback(async ({ force = false, useHighAccuracy = false } = {}) => {
        if (useStore.getState().locationLoading) return;

        if (!force && !useHighAccuracy && isCacheValid()) {
            const cached = locationCache.current;
            if (cached && cached.coords) {
                setLocation({
                    latitude: cached.coords.latitude,
                    longitude: cached.coords.longitude,
                    accuracy_m: cached.accuracy,
                    source: 'cached',
                    precision: cached.accuracy <= 10 ? 'exact' :
                        cached.accuracy <= 100 ? 'high' :
                            cached.accuracy <= 1000 ? 'medium' : 'low',
                    confidence: 0.9,
                    detection_method: 'cache',
                    is_precise: cached.accuracy <= 100,
                });
                return;
            }
        }

        setLocationLoading(true);
        setLocationError(null);

        try {
            const options = useHighAccuracy ? HIGH_ACCURACY_OPTIONS : BALANCED_OPTIONS;
            const browserCoords = await detectViaBrowser(options);

            if (browserCoords.browser_accuracy_m > 200 && shouldLog) {
                console.warn(`GPS accuracy is poor: ${browserCoords.browser_accuracy_m}m`);
            }

            const response = await locationsApi.detect(browserCoords);

            const enhancedData = {
                ...response.data,
                accuracy_m: browserCoords.browser_accuracy_m,
                precision: browserCoords.browser_accuracy_m <= 10 ? 'exact' :
                    browserCoords.browser_accuracy_m <= 100 ? 'high' :
                        browserCoords.browser_accuracy_m <= 1000 ? 'medium' : 'low',
                confidence: browserCoords.browser_accuracy_m <= 10 ? 0.99 :
                    browserCoords.browser_accuracy_m <= 25 ? 0.95 :
                        browserCoords.browser_accuracy_m <= 50 ? 0.90 :
                            browserCoords.browser_accuracy_m <= 100 ? 0.80 :
                                browserCoords.browser_accuracy_m <= 200 ? 0.60 : 0.40,
            };

            setLocation(enhancedData);
            updateLocationCache({
                latitude: browserCoords.browser_latitude,
                longitude: browserCoords.browser_longitude,
                accuracy: browserCoords.browser_accuracy_m,
            });
        } catch (browserErr) {
            if (shouldLog) console.warn('Browser geolocation failed, falling back to IP:', browserErr);
            try {
                const ipResult = await detectViaIp();

                const enhancedIpData = {
                    ...ipResult,
                    accuracy_m: (ipResult.accuracy_km || 50) * 1000,
                    precision: 'approximate',
                    confidence: ipResult.confidence || 0.3,
                    detection_method: 'ip_geolocation',
                    is_precise: false,
                };

                setLocation(enhancedIpData);
            } catch (ipErr) {
                setLocationError(
                    ipErr?.message || 'Could not detect your location. Please search for your city manually or enable device location services.'
                );
            }
        } finally {
            setLocationLoading(false);
        }
    }, [detectViaBrowser, detectViaIp, setLocation, setLocationLoading, setLocationError, isCacheValid, updateLocationCache]);

    const confirmCurrentLocation = useCallback(() => {
        confirmLocation();
    }, [confirmLocation]);

    const submitFallbackCity = useCallback(async (cityName, countryCode = null) => {
        if (!cityName || cityName.trim().length < 2) return;

        setLocationLoading(true);

        try {
            const payload = {
                fallback_city: cityName.trim(),
                timezone_hint: getTimezoneHint(),
            };
            if (countryCode) {
                payload.fallback_country_code = countryCode;
            }
            const response = await locationsApi.detect(payload);
            setLocation(response.data);
            clearWatch();
        } catch (err) {
            setLocationError(
                err?.message || `Could not find "${cityName}". Please check the spelling.`
            );
        } finally {
            setLocationLoading(false);
        }
    }, [setLocation, setLocationLoading, setLocationError, clearWatch]);

    const refreshLocation = useCallback(() => {
        clearLocation();
        clearWatch();
        detectLocation({ force: true, useHighAccuracy: true });
    }, [clearLocation, clearWatch, detectLocation]);

    const setManualLocation = useCallback((lat, lon, meta = {}) => {
        clearWatch();
        setLocation({
            latitude: lat,
            longitude: lon,
            is_precise: true,
            confidence: 0.95,
            detection_method: 'manual_city',
            source: 'manual',
            accuracy_m: 5,
            precision: 'exact',
            ...meta,
        });
    }, [setLocation, clearWatch]);

    useEffect(() => {
        const current = locationRef.current;
        const isManualOrIp = current?.detection_method === 'manual_city'
            || current?.source === 'manual'
            || current?.detection_method === 'ip_geolocation';

        if (!locationConfirmed || !current || isManualOrIp) {
            clearWatch();
            return () => clearWatch();
        }

        watchPosition((position) => {
            const prev = lastKnownPosition.current;
            const shouldUpdate = !prev || calculateDistance(prev.latitude, prev.longitude, position.latitude, position.longitude) > 100;
            if (!shouldUpdate) return;

            const base = locationRef.current;
            const watchData = {
                ...base,
                latitude: position.latitude,
                longitude: position.longitude,
                accuracy_m: position.accuracy,
                detection_method: 'gps_watch',
                lastUpdated: new Date().toISOString(),
            };

            setLocation(watchData);
            updateLocationCache({
                latitude: position.latitude,
                longitude: position.longitude,
                accuracy: position.accuracy,
            });
        }, (error) => {
            if (shouldLog) console.warn('Watch position error:', error);
        });

        return () => clearWatch();
    }, [locationConfirmed, location?.detection_method, location?.source, setLocation, watchPosition, clearWatch, updateLocationCache]);

    useEffect(() => {
        if (initRan.current) return;
        initRan.current = true;

        if (!useStore.getState().location) {
            detectLocation({ useHighAccuracy: true });
        }
    }, [detectLocation]);

    return {
        location,
        locationLoading,
        locationError,
        showLocationWarning,
        locationConfirmed,
        hasLocation: !!location,
        lat: location?.latitude ?? null,
        lon: location?.longitude ?? null,
        accuracy: location?.accuracy_m ?? null,
        precision: location?.precision ?? null,
        confidence: location?.confidence ?? null,
        detectionMethod: location?.detection_method ?? null,
        cityDisplay: location
            ? [location.city, location.state].filter(Boolean).join(', ') || location.formatted_address || (
                location.latitude != null && location.longitude != null
                    ? `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`
                    : 'Unknown location'
            )
            : null,
        detectLocation,
        confirmCurrentLocation,
        submitFallbackCity,
        refreshLocation,
        setManualLocation,
        clearLocation,
        startWatching: watchPosition,
        stopWatching: clearWatch,
        isLocationFresh: () => isCacheValid(900000),
    };
}