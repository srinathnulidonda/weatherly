// web/src/components/nav/BottomNav.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudSun, CalendarDays, ShieldAlert, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useActiveAlertCount } from '@/hooks/useAlerts';
import { BOTTOM_NAV } from '@/utils/constants';

const icons = { CloudSun, CalendarDays, ShieldAlert, Settings };

const springConfig = { stiffness: 380, damping: 30, mass: 0.8 };

function BottomNav() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { count: alertCount } = useActiveAlertCount();

    return (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-bottomnav safe-area-bottom">
            <div className="px-4 pb-4 pt-2">
                <div className="flex items-center justify-between gap-0.5 px-1.5 py-1.5 rounded-[24px] max-w-xs mx-auto bg-white/98 dark:bg-stone-900/98 backdrop-blur-2xl shadow-[0_-2px_20px_rgba(0,0,0,0.08),0_6px_32px_rgba(0,0,0,0.14)] dark:shadow-[0_-2px_20px_rgba(0,0,0,0.3),0_6px_40px_rgba(0,0,0,0.6)]">
                    {BOTTOM_NAV.map((item) => {
                        const Icon = icons[item.icon];
                        const isActive = pathname === item.path;
                        const isAlerts = item.path === '/alerts';

                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-[16px] focus-ring active:scale-[0.96] transition-transform duration-150"
                                aria-label={item.label}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="tabIndicator"
                                        className="absolute inset-0 bg-orange-500/12 dark:bg-orange-500/16 rounded-[16px]"
                                        initial={false}
                                        transition={{ layout: springConfig }}
                                    />
                                )}

                                <div className="relative z-10">
                                    <Icon
                                        size={18}
                                        strokeWidth={isActive ? 2.4 : 1.8}
                                        className={cn(
                                            'transition-all duration-500 ease-out',
                                            isActive
                                                ? 'text-orange-500'
                                                : 'text-stone-400 dark:text-stone-500'
                                        )}
                                    />
                                    <AnimatePresence>
                                        {isAlerts && alertCount > 0 && (
                                            <motion.span
                                                key="alert-badge"
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                                className="absolute -top-1 -right-1.5 min-w-[13px] h-[13px] flex items-center justify-center text-[7.5px] font-extrabold rounded-full bg-red-500 text-white px-0.5 ring-[1.5px] ring-white/90 dark:ring-stone-950"
                                            >
                                                {alertCount > 9 ? '9+' : alertCount}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <motion.span
                                    className={cn(
                                        'relative z-10 text-[9px] font-semibold leading-none tracking-tight select-none',
                                        isActive
                                            ? 'text-orange-500'
                                            : 'text-stone-400 dark:text-stone-500'
                                    )}
                                    animate={{ opacity: isActive ? 1 : 0.75 }}
                                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                >
                                    {item.label}
                                </motion.span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}

export { BottomNav };
export default BottomNav;