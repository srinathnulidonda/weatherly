// web/src/api/client.js
import axios from 'axios';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

const shouldLog = import.meta.env.VITE_ENABLE_DEBUG_TOOLS === 'true';

client.interceptors.request.use(
    (config) => {
        config.metadata = { startTime: Date.now() };
        return config;
    },
    (error) => Promise.reject(error)
);

client.interceptors.response.use(
    (response) => {
        const duration = Date.now() - (response.config.metadata?.startTime || Date.now());
        if (duration > 5000 && shouldLog) {
            console.warn(`[Weatherly] Slow API response: ${response.config.url} took ${duration}ms`);
        }

        const remaining = response.headers['x-ratelimit-remaining'];
        if (remaining !== undefined && parseInt(remaining, 10) <= 5 && shouldLog) {
            console.warn(`[Weatherly] Rate limit low: ${remaining} requests remaining`);
        }

        return response.data;
    },
    (error) => {
        if (error.response) {
            const { status, data, headers } = error.response;

            if (status === 429) {
                const retryAfter = headers['retry-after'] ? parseInt(headers['retry-after'], 10) : 60;
                const err = new Error(data?.message || 'Rate limit exceeded. Please wait before trying again.');
                err.code = 'RATE_LIMIT_EXCEEDED';
                err.status = 429;
                err.retryAfter = retryAfter;
                return Promise.reject(err);
            }

            if (status === 401 || status === 403) {
                const err = new Error(data?.message || 'Access denied. Please refresh the page or contact support.');
                err.code = 'UNAUTHORIZED';
                err.status = status;
                return Promise.reject(err);
            }

            const err = new Error(data?.message || `Request failed with status ${status}`);
            err.code = data?.error_code || 'API_ERROR';
            err.status = status;
            err.details = data?.details || {};
            return Promise.reject(err);
        }

        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            const err = new Error('Request timed out. Please check your connection and try again.');
            err.code = 'TIMEOUT';
            err.status = 0;
            return Promise.reject(err);
        }

        if (!error.response && !error.status) {
            const err = new Error('Network error. Please check your internet connection.');
            err.code = 'NETWORK_ERROR';
            err.status = 0;
            return Promise.reject(err);
        }

        return Promise.reject(error);
    }
);

export default client;