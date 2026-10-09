// web/src/hooks/useAnalytics.js
import { useQuery, useMutation } from '@tanstack/react-query';
import { useStore } from '../stores/store';
import { weatherApi } from '../api/weather';
import { useActiveCoords } from './useActiveLocation';

export function useWeatherTrends(hours = 24, options = {}) {
    const coords = useActiveCoords();

    return useQuery({
        queryKey: ['analytics', 'trends', coords?.lat, coords?.lon, hours],
        queryFn: async () => {
            const res = await weatherApi.trends(coords.lat, coords.lon, hours);
            return res.data;
        },
        enabled: !!coords,
        staleTime: 15 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        ...options,
    });
}

export function useWeatherIndices(options = {}) {
    const coords = useActiveCoords();

    return useQuery({
        queryKey: ['analytics', 'indices', coords?.lat, coords?.lon],
        queryFn: async () => {
            const res = await weatherApi.indices(coords.lat, coords.lon);
            return res.data;
        },
        enabled: !!coords,
        staleTime: 15 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        ...options,
    });
}

export function useWeatherInsights(options = {}) {
    const coords = useActiveCoords();

    return useQuery({
        queryKey: ['analytics', 'insights', coords?.lat, coords?.lon],
        queryFn: async () => {
            const res = await weatherApi.insights(coords.lat, coords.lon);
            return res.data;
        },
        enabled: !!coords,
        staleTime: 15 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        ...options,
    });
}

export function useWeatherCompare() {
    const units = useStore((s) => s.units);

    const mutation = useMutation({
        mutationFn: async (locations) => {
            const coords = locations.map((loc) => ({ latitude: loc.latitude, longitude: loc.longitude }));
            const res = await weatherApi.compare(coords, units);
            return res.data;
        },
        retry: 1,
    });

    return {
        compare: mutation.mutate,
        compareAsync: mutation.mutateAsync,
        data: mutation.data,
        isLoading: mutation.isPending,
        error: mutation.error,
        reset: mutation.reset,
    };
}

export function useWeatherHistory(startDate, endDate, options = {}) {
    const coords = useActiveCoords();
    const units = useStore((s) => s.units);

    return useQuery({
        queryKey: ['weather', 'history', coords?.lat, coords?.lon, startDate, endDate, units],
        queryFn: async () => {
            const res = await weatherApi.history(coords.lat, coords.lon, startDate, endDate, units);
            return res.data;
        },
        enabled: !!coords && !!startDate && !!endDate,
        staleTime: 60 * 60 * 1000,
        gcTime: 2 * 60 * 60 * 1000,
        retry: 1,
        ...options,
    });
}