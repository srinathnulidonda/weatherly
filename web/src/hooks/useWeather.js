// web/src/hooks/useWeather.js
import { useQuery } from '@tanstack/react-query';
import { useStore } from '../stores/store';
import { weatherApi } from '../api/weather';
import { useActiveCoords, useActiveLocation } from './useActiveLocation';

function splitEnabled(options) {
    const { enabled, ...rest } = options;
    return { enabledOption: enabled, rest };
}

export function useCurrentWeather(options = {}) {
    const coords = useActiveCoords();
    const units = useStore((s) => s.units);
    const { meta } = useActiveLocation();
    const source = meta?.source || 'manual';
    const precision = meta?.is_precise ? 'high' : 'medium';
    const { enabledOption, rest } = splitEnabled(options);

    return useQuery({
        queryKey: ['weather', 'current', coords?.lat, coords?.lon, units],
        queryFn: async () => {
            const res = await weatherApi.current(coords.lat, coords.lon, units, source, precision);
            return res.data;
        },
        enabled: !!coords && (enabledOption ?? true),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchInterval: 10 * 60 * 1000,
        retry: 2,
        ...rest,
    });
}

export function useWeatherAt(lat, lon, options = {}) {
    const units = useStore((s) => s.units);
    const { enabledOption, rest } = splitEnabled(options);
    const hasCoords = lat != null && lon != null;

    return useQuery({
        queryKey: ['weather', 'current', lat, lon, units],
        queryFn: async () => {
            const res = await weatherApi.current(lat, lon, units, 'manual', 'medium');
            return res.data;
        },
        enabled: hasCoords && (enabledOption ?? true),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        ...rest,
    });
}

export function useForecast(days = 7, hourly = false, options = {}) {
    const coords = useActiveCoords();
    const units = useStore((s) => s.units);
    const { enabledOption, rest } = splitEnabled(options);

    return useQuery({
        queryKey: ['weather', 'forecast', coords?.lat, coords?.lon, days, units, hourly],
        queryFn: async () => {
            const res = await weatherApi.forecast(coords.lat, coords.lon, days, units, hourly);
            return res.data;
        },
        enabled: !!coords && (enabledOption ?? true),
        staleTime: 15 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        ...rest,
    });
}

export function useHourlyForecast(days = 2, options = {}) {
    const coords = useActiveCoords();
    const units = useStore((s) => s.units);
    const { enabledOption, rest } = splitEnabled(options);

    return useQuery({
        queryKey: ['weather', 'forecast', 'hourly', coords?.lat, coords?.lon, days, units],
        queryFn: async () => {
            const res = await weatherApi.forecast(coords.lat, coords.lon, days, units, true);
            const forecast = res.data;
            const hours = [];
            if (forecast?.days && Array.isArray(forecast.days)) {
                for (const day of forecast.days) {
                    if (day.hourly && Array.isArray(day.hourly)) {
                        for (const h of day.hourly) hours.push(h);
                    }
                }
            }

            hours.sort((a, b) => new Date(a.datetime_utc).getTime() - new Date(b.datetime_utc).getTime());

            const currentHourStart = new Date();
            currentHourStart.setMinutes(0, 0, 0);
            const cutoff = currentHourStart.getTime();

            const upcoming = hours.filter((h) => {
                const t = new Date(h.datetime_utc).getTime();
                return !Number.isNaN(t) && t >= cutoff;
            });

            return { ...forecast, _flatHours: upcoming.length > 0 ? upcoming : hours };
        },
        enabled: !!coords && (enabledOption ?? true),
        staleTime: 15 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        ...rest,
    });
}

export function useAirQuality(options = {}) {
    const coords = useActiveCoords();
    const { enabledOption, rest } = splitEnabled(options);

    return useQuery({
        queryKey: ['weather', 'air-quality', coords?.lat, coords?.lon],
        queryFn: async () => {
            const res = await weatherApi.airQuality(coords.lat, coords.lon);
            return res.data;
        },
        enabled: !!coords && (enabledOption ?? true),
        staleTime: 15 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        ...rest,
    });
}