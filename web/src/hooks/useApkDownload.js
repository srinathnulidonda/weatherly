// web/src/hooks/useApkDownload.js
import { useCallback, useState } from 'react';

function useApkDownload() {
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);

    const download = useCallback(async (url, filename) => {
        if (!url) return;
        setStatus('downloading');
        setProgress(0);
        try {
            const response = await fetch(url);
            if (!response.ok || !response.body) throw new Error('network');
            const total = Number(response.headers.get('content-length')) || 0;
            const reader = response.body.getReader();
            const chunks = [];
            let received = 0;
            for (; ;) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                received += value.length;
                if (total) setProgress(Math.min(99, Math.round((received / total) * 100)));
            }
            const blob = new Blob(chunks);
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'weatherly.apk';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);
            setProgress(100);
            setStatus('done');
            setTimeout(() => {
                setStatus('idle');
                setProgress(0);
            }, 2200);
        } catch {
            setStatus('idle');
            setProgress(0);
            window.open(url, '_blank', 'noopener');
        }
    }, []);

    return { status, progress, download };
}

export { useApkDownload };
export default useApkDownload;