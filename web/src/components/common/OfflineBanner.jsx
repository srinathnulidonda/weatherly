// web/src/components/common/OfflineBanner.jsx
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';

function OfflineBanner() {
    const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

    useEffect(() => {
        const goOnline = () => setOnline(true);
        const goOffline = () => setOnline(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {!online && (
                <motion.div
                    role="status"
                    aria-live="polite"
                    initial={{ y: -24, opacity: 0, scale: 0.97 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -24, opacity: 0, scale: 0.97 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-3xl shadow-elevated bg-stone-900 dark:bg-stone-800 text-white text-xs font-medium"
                >
                    <WifiOff size={14} className="shrink-0" aria-hidden="true" />
                    You're offline — showing last saved data
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export { OfflineBanner };
export default OfflineBanner;