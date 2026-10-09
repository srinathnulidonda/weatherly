// web/src/hooks/useReleases.js
import { useQuery } from '@tanstack/react-query';

async function fetchReleases() {
    const response = await fetch('/apk/releases/releases.json', {
        headers: { Accept: 'application/json' },
    });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Could not load releases (${response.status})`);
    const body = await response.json();
    const list = Array.isArray(body?.releases) ? body.releases : [];
    return list;
}

export function useReleases() {
    return useQuery({
        queryKey: ['app-releases'],
        queryFn: fetchReleases,
        staleTime: 5 * 60 * 1000,
    });
}