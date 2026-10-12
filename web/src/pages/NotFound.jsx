// web/src/pages/NotFound.jsx
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CloudOff, Home, Search as SearchIcon, Settings as SettingsIcon } from 'lucide-react';
import { PageTransition } from '@/components/common/PageTransition';
import { Button } from '@/components/ui/Button';

const QUICK_LINKS = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: SearchIcon, label: 'Search' },
    { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

function NotFound() {
    const navigate = useNavigate();

    return (
        <PageTransition>
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 py-10 pb-28 md:pb-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-stone-100 dark:bg-white/[0.05] flex items-center justify-center mb-5 sm:mb-6"
                >
                    <CloudOff size={38} className="text-stone-400 dark:text-stone-500 sm:w-11 sm:h-11" aria-hidden="true" />
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    aria-hidden="true"
                    className="text-6xl sm:text-7xl font-extralight text-stone-300 dark:text-stone-700 mb-2 tabular-nums"
                >
                    404
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16 }}
                >
                    <h1 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
                        Page not found
                    </h1>
                    <p className="text-[13px] sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mb-7 sm:mb-8 leading-relaxed">
                        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                    className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-xs mb-7 sm:mb-8"
                >
                    {QUICK_LINKS.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-stone-100 dark:border-white/[0.06] hover:border-orange-200 dark:hover:border-orange-500/20 hover:-translate-y-0.5 transition-all duration-200 focus-ring"
                        >
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-100 dark:bg-white/[0.05] flex items-center justify-center" aria-hidden="true">
                                <link.icon size={15} className="text-stone-500 dark:text-stone-400" />
                            </div>
                            <span className="text-[11px] sm:text-xs font-medium text-stone-600 dark:text-stone-300">
                                {link.label}
                            </span>
                        </Link>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 }}
                >
                    <Button onClick={() => navigate('/')}>
                        <Home size={16} aria-hidden="true" />
                        Back to Weather
                    </Button>
                </motion.div>
            </div>
        </PageTransition>
    );
}

export default NotFound;