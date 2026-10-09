// web/src/api/weather.js
import client from './client';

const W = '/api/v1/weather';
const A = '/api/v1/analytics';

export const weatherApi = {
    current(lat, lon, units = 'metric', source = 'manual', precision = 'medium') {
        return client.get(W + '/current', {
            params: { lat, lon, units, source, precision },
        });
    },

    forecast(lat, lon, days = 7, units = 'metric', hourly = false) {
        return client.get(W + '/forecast', {
            params: { lat, lon, days, units, hourly },
        });
    },

    history(lat, lon, startDate, endDate, units = 'metric') {
        return client.get(W + '/history', {
            params: { lat, lon, start_date: startDate, end_date: endDate, units },
        });
    },

    alerts(lat, lon, { radiusKm = 50, severity, activeOnly = true, page = 1, size = 20 } = {}) {
        const params = { lat, lon, radius_km: radiusKm, active_only: activeOnly, page, size };
        if (severity && severity.length) params.severity = severity.join(',');
        return client.get(W + '/alerts', { params });
    },

    airQuality(lat, lon) {
        return client.get(W + '/air-quality', { params: { lat, lon } });
    },

    trends(lat, lon, hours = 24) {
        return client.get(A + '/trends', { params: { lat, lon, hours } });
    },

    compare(locations, units = 'metric') {
        return client.post(A + '/compare', locations, { params: { units } });
    },

    indices(lat, lon) {
        return client.get(A + '/indices', { params: { lat, lon } });
    },

    insights(lat, lon) {
        return client.get(A + '/insights', { params: { lat, lon } });
    },

    alertStats(lat, lon, radiusKm = 100) {
        return client.get(A + '/alert-stats', { params: { lat, lon, radius_km: radiusKm } });
    },
};