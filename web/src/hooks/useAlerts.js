// web/src/hooks/useAlerts.js
import { useQuery } from '@tanstack/react-query';
import { weatherApi } from '../api/weather';
import { useActiveCoords } from './useActiveLocation';

export function useAlerts({ radiusKm = 50, severity = null, activeOnly = true, page = 1, size = 20 } = {}, options = {}) {
    const coords = useActiveCoords();

    return useQuery({
        queryKey: ['weather', 'alerts', coords?.lat, coords?.lon, radiusKm, severity, activeOnly, page, size],
        queryFn: async () => {
            const res = await weatherApi.alerts(coords.lat, coords.lon, { radiusKm, severity, activeOnly, page, size });
            return res.data;
        },
        enabled: !!coords,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchInterval: 5 * 60 * 1000,
        retry: 2,
        ...options,
    });
}

export function useAlertStats(radiusKm = 100, options = {}) {
    const coords = useActiveCoords();

    return useQuery({
        queryKey: ['analytics', 'alert-stats', coords?.lat, coords?.lon, radiusKm],
        queryFn: async () => {
            const res = await weatherApi.alertStats(coords.lat, coords.lon, radiusKm);
            return res.data;
        },
        enabled: !!coords,
        staleTime: 10 * 60 * 1000,
        retry: 1,
        ...options,
    });
}

export function useActiveAlertCount() {
    const { data, isLoading } = useAlerts({ activeOnly: true, size: 5 });
    return { count: data?.pagination?.total_items ?? 0, isLoading };
}