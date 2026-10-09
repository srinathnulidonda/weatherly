// web/src/components/alerts/AlertRadiusMap.jsx
import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getSeverityToken } from '@/lib/theme';

function toRad(deg) {
    return deg * (Math.PI / 180);
}

function computeBearingDistance(lat1, lon1, lat2, lon2) {
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    const bearing = (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;

    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return { bearing, distanceKm };
}

function extractCoords(alert) {
    const lat = alert.latitude ?? alert.lat ?? alert.location?.latitude ?? null;
    const lon = alert.longitude ?? alert.lon ?? alert.location?.longitude ?? null;
    if (lat == null || lon == null) return null;
    return { lat, lon };
}

function bearingToXY(distanceRatio, angleDeg, center, maxRadius) {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return {
        x: center + Math.cos(rad) * distanceRatio * maxRadius,
        y: center + Math.sin(rad) * distanceRatio * maxRadius,
    };
}

function AlertRadiusMap({ alerts = [], radiusKm = 100, userLat, userLon, className }) {
    const center = 100;
    const maxRadius = 82;

    const { points, unplacedCount } = useMemo(() => {
        if (userLat == null || userLon == null) return { points: [], unplacedCount: alerts.length };

        const placed = [];
        let unplaced = 0;

        for (const a of alerts.slice(0, 12)) {
            const coords = extractCoords(a);
            if (!coords) {
                unplaced += 1;
                continue;
            }
            const { bearing, distanceKm } = computeBearingDistance(userLat, userLon, coords.lat, coords.lon);
            const ratio = Math.min(1, distanceKm / radiusKm);
            placed.push({ ...a, ...bearingToXY(ratio, bearing, center, maxRadius), distanceKm });
        }

        return { points: placed.slice(0, 8), unplacedCount: unplaced };
    }, [alerts, radiusKm, userLat, userLon]);

    return (
        <div className={cn('flex flex-col items-center gap-2', className)}>
            <div className="relative aspect-square w-full max-w-[280px] mx-auto">
                <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden="true">
                    {[0.33, 0.66, 1].map((r) => (
                        <circle key={r} cx={center} cy={center} r={maxRadius * r} fill="none" className="stroke-stone-200 dark:stroke-white/[0.08]" strokeWidth="1" strokeDasharray={r === 1 ? '0' : '3 4'} />
                    ))}
                    <circle cx={center} cy={center} r={maxRadius} fill="none" stroke="#F97316" strokeOpacity="0.3" strokeWidth="1.5" />
                    <circle cx={center} cy={center} r="5" fill="#F97316" />
                    <circle cx={center} cy={center} r="9" fill="none" stroke="#F97316" strokeWidth="1.5" opacity="0.4" />

                    {points.map((p, i) => {
                        const { hex } = getSeverityToken(p.severity);
                        return (
                            <g key={p.id || i}>
                                <circle cx={p.x} cy={p.y} r="6" fill={hex} />
                                <circle cx={p.x} cy={p.y} r="10" fill="none" stroke={hex} strokeWidth="1" opacity="0.3" />
                            </g>
                        );
                    })}
                </svg>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[10px] text-stone-400 font-medium whitespace-nowrap">
                    <MapPin size={10} />
                    Your location · {radiusKm}km radius
                </div>
            </div>
            {unplacedCount > 0 && (
                <p className="text-[11px] text-stone-400 text-center">
                    {unplacedCount} alert{unplacedCount !== 1 ? 's' : ''} without precise location data not shown on radar
                </p>
            )}
        </div>
    );
}

export { AlertRadiusMap };
export default AlertRadiusMap;