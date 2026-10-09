// web/src/components/ui/Tooltip.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

function Tooltip({ children, content, side = 'top', delay = 200, className }) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);
    const timeoutRef = useRef(null);
    const autoHideRef = useRef(null);

    const updatePosition = useCallback(() => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();

        let top = 0;
        let left = 0;

        switch (side) {
            case 'top':
                top = triggerRect.top - tooltipRect.height - 8;
                left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
                break;
            case 'bottom':
                top = triggerRect.bottom + 8;
                left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
                break;
            case 'left':
                top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
                left = triggerRect.left - tooltipRect.width - 8;
                break;
            case 'right':
                top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
                left = triggerRect.right + 8;
                break;
            default:
                top = triggerRect.top - tooltipRect.height - 8;
                left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        }

        const padding = 8;
        if (left < padding) left = padding;
        if (left + tooltipRect.width > window.innerWidth - padding) {
            left = window.innerWidth - tooltipRect.width - padding;
        }
        if (top < padding) top = triggerRect.bottom + 8;

        setPosition({ top, left });
    }, [side]);

    useEffect(() => {
        if (isVisible) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isVisible, updatePosition]);

    const show = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
    }, [delay]);

    const hide = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(false);
    }, []);

    const handleTouchStart = useCallback((e) => {
        e.stopPropagation();
        if (isVisible) {
            hide();
            return;
        }
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(true);
        if (autoHideRef.current) clearTimeout(autoHideRef.current);
        autoHideRef.current = setTimeout(() => setIsVisible(false), 3000);
    }, [isVisible, hide]);

    useEffect(() => {
        if (!isVisible) return;
        function handleOutside(e) {
            if (triggerRef.current?.contains(e.target) || tooltipRef.current?.contains(e.target)) return;
            hide();
        }
        document.addEventListener('touchstart', handleOutside, { passive: true });
        document.addEventListener('click', handleOutside);
        return () => {
            document.removeEventListener('touchstart', handleOutside);
            document.removeEventListener('click', handleOutside);
        };
    }, [isVisible, hide]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (autoHideRef.current) clearTimeout(autoHideRef.current);
        };
    }, []);

    if (!content) return <>{children}</>;

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={show}
                onMouseLeave={hide}
                onTouchStart={handleTouchStart}
                className="inline-flex"
            >
                {children}
            </div>

            {createPortal(
                <AnimatePresence>
                    {isVisible && (
                        <motion.div
                            ref={tooltipRef}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            style={{
                                position: 'fixed',
                                top: `${position.top}px`,
                                left: `${position.left}px`,
                                zIndex: 9999,
                            }}
                            className={cn(
                                'pointer-events-none px-3 py-2 text-xs font-medium rounded-xl shadow-xl max-w-[240px]',
                                'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200',
                                'border border-stone-200 dark:border-white/[0.08]',
                                'backdrop-blur-xl',
                                className
                            )}
                        >
                            {content}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}

export { Tooltip };
export default Tooltip;