// src/hooks/useReleases.js
import { useQuery } from '@tanstack/react-query';

async function fetchReleases() {
    const response = await fetch('/apk/releases/releases.json', {
        headers: { Accept: 'application/json' },
        cache: 'no-cache',
    });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Could not load releases (${response.status})`);

    let body;
    try {
        body = await response.json();
    } catch {
        // SPA hosts return index.html (200) for missing files
        return [];
    }

    const list = Array.isArray(body?.releases) ? body.releases : [];
    return list.filter((r) => {
        const valid = r && r.version && r.build_number != null && r.apk_url;
        if (!valid && import.meta.env.DEV) {
            console.warn('Skipping malformed release entry:', r);
        }
        return valid;
    });
}

export function useReleases() {
    return useQuery({
        queryKey: ['app-releases'],
        queryFn: fetchReleases,
        staleTime: 5 * 60 * 1000,
    });
}