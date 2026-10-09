// web/src/api/locations.js
import client from './client';

const BASE = '/api/v1/locations';

export const locationsApi = {
    detect(data, { requirePrecise = false } = {}) {
        return client.post(BASE + '/detect', data, {
            params: requirePrecise ? { require_precise: true } : undefined,
        });
    },

    search(q, limit = 5, countryCode = null) {
        const params = { q, limit };
        if (countryCode) params.country_code = countryCode;
        return client.get(BASE + '/search', { params });
    },
};