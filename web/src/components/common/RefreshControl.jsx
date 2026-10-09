// web/src/components/common/RefreshControl.jsx
import { useState, useCallback, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

function RefreshControl({ children, onRefresh, isRefreshing, className }) {
    const [pulling, setPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const startY = useRef(0);
    const threshold = 80;

    const handleTouchStart = useCallback((e) => {
        if (window.scrollY === 0) {
            startY.current = e.touches[0].clientY;
            setPulling(true);
        }
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!pulling) return;
        const delta = e.touches[0].clientY - startY.current;
        if (delta > 0) setPullDistance(Math.min(delta * 0.4, threshold * 1.5));
    }, [pulling]);

    const handleTouchEnd = useCallback(async () => {
        if (pullDistance >= threshold && onRefresh && !isRefreshing) await onRefresh();
        setPulling(false);
        setPullDistance(0);
    }, [pullDistance, onRefresh, isRefreshing]);

    if (children) {
        return (
            <div className={cn('relative', className)} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                <span className="sr-only" role="status" aria-live="polite">
                    {isRefreshing ? 'Refreshing weather data' : ''}
                </span>

                {(pulling && pullDistance > 10) && (
                    <div className="flex items-center justify-center transition-opacity" style={{ height: pullDistance, opacity: Math.min(pullDistance / threshold, 1) }}>
                        <motion.div animate={{ rotate: isRefreshing ? 360 : (pullDistance / threshold) * 180 }} transition={isRefreshing ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : { duration: 0 }}>
                            <RefreshCw size={20} className={cn('text-stone-400 transition-colors', pullDistance >= threshold && 'text-orange-500')} />
                        </motion.div>
                    </div>
                )}

                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="hidden md:flex fixed bottom-8 right-8 z-30 w-12 h-12 rounded-full glass-elevated items-center justify-center shadow-elevated hover:shadow-elevated transition-all duration-300 group"
                    aria-label="Refresh weather"
                >
                    <motion.div animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }} transition={isRefreshing ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}>
                        <RefreshCw size={18} className="text-stone-500 group-hover:text-orange-500 transition-colors" />
                    </motion.div>
                </button>

                {children}
            </div>
        );
    }

    return (
        <button onClick={onRefresh} disabled={isRefreshing} className={cn('p-2.5 rounded-full text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-900/5 dark:hover:bg-white/[0.05] transition-all duration-200', className)} aria-label="Refresh">
            <span className="sr-only" role="status" aria-live="polite">{isRefreshing ? 'Refreshing' : ''}</span>
            <motion.div animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }} transition={isRefreshing ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}>
                <RefreshCw size={18} />
            </motion.div>
        </button>
    );
}

export { RefreshControl };
export default RefreshControl;