// web/src/hooks/useLocationSearch.js
import { useState, useEffect } from 'react';
import { locationsApi } from '@/api/locations';

export function useLocationSearch(query, { limit = 5, minLength = 2, delay = 350 } = {}) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), delay);
        return () => clearTimeout(timer);
    }, [query, delay]);

    useEffect(() => {
        const q = debouncedQuery?.trim();
        if (!q || q.length < minLength) {
            setResults([]);
            setError(null);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        locationsApi.search(q, limit)
            .then((res) => { if (!cancelled) setResults(res.data || []); })
            .catch((err) => {
                if (!cancelled) {
                    setResults([]);
                    setError(err);
                }
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [debouncedQuery, limit, minLength]);

    return { results, loading, error };
}