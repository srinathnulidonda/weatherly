// web/src/hooks/useActiveLocation.js
import { useMemo } from 'react';
import { useStore } from '@/stores/store';

function computeLabel(ready, meta) {
    if (!ready || !meta) return 'Set location';
    if (meta.city) return meta.city;
    if (meta.name) return meta.name;
    if (meta.formatted_address) return meta.formatted_address;
    if (meta.latitude != null && meta.longitude != null) {
        return `${meta.latitude.toFixed(1)}, ${meta.longitude.toFixed(1)}`;
    }
    return 'Unknown';
}

function useActiveLocation() {
    const location = useStore((s) => s.location);
    const locationConfirmed = useStore((s) => s.locationConfirmed);
    const savedLocations = useStore((s) => s.savedLocations);
    const activeLocationId = useStore((s) => s.activeLocationId);

    return useMemo(() => {
        if (activeLocationId !== 'current') {
            const found = savedLocations.find((l) => l.id === activeLocationId);
            if (found) {
                const meta = { ...found, isCurrent: false };
                return {
                    lat: found.latitude,
                    lon: found.longitude,
                    ready: true,
                    isCurrent: false,
                    meta,
                    label: computeLabel(true, meta),
                };
            }
        }
        if (location && locationConfirmed) {
            const meta = { ...location, id: 'current', isCurrent: true };
            return {
                lat: location.latitude,
                lon: location.longitude,
                ready: true,
                isCurrent: true,
                meta,
                label: computeLabel(true, meta),
            };
        }
        return { lat: null, lon: null, ready: false, isCurrent: false, meta: null, label: computeLabel(false, null) };
    }, [location, locationConfirmed, savedLocations, activeLocationId]);
}

export function useActiveCoords() {
    const { lat, lon, ready } = useActiveLocation();
    return ready ? { lat, lon } : null;
}

export { useActiveLocation };
export default useActiveLocation;