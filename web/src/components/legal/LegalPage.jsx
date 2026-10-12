// web/src/components/legal/LegalPage.jsx
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/common/PageTransition';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

const TABS = [
    { key: 'terms', label: 'Terms', to: '/legal/terms' },
    { key: 'privacy', label: 'Privacy', to: '/legal/privacy' },
    { key: 'cookies', label: 'Cookies', to: '/legal/cookies' },
];

function LegalPage({ title, updated, current, children }) {
    const navigate = useNavigate();

    return (
        <PageTransition className="page-shell">
            <div className="stack-y max-w-2xl mx-auto pb-6 !gap-4 sm:!gap-5">
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 sm:gap-3"
                >
                    <button
                        onClick={() => navigate(-1)}
                        aria-label="Go back"
                        className="min-touch flex items-center justify-center rounded-full text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-900/5 dark:hover:bg-white/[0.06] transition-colors shrink-0"
                    >
                        <ArrowLeft size={18} aria-hidden="true" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="page-heading truncate">{title}</h1>
                        {updated && (
                            <p className="text-[11px] sm:text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                                Last updated: {updated}
                            </p>
                        )}
                    </div>
                </motion.div>

                <motion.nav
                    aria-label="Legal documents"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.04 }}
                    className="flex items-center gap-1 bg-stone-100 dark:bg-white/[0.05] rounded-full p-1 w-full sm:w-fit overflow-x-auto"
                >
                    {TABS.map((tab) => (
                        <Link
                            key={tab.key}
                            to={tab.to}
                            className={cn(
                                'flex-1 sm:flex-none text-center px-3.5 sm:px-4 h-9 sm:h-10 flex items-center justify-center text-[12px] sm:text-xs font-semibold rounded-full transition-colors whitespace-nowrap',
                                current === tab.key
                                    ? 'bg-white dark:bg-white/[0.10] text-orange-500 shadow-soft'
                                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                            )}
                            aria-current={current === tab.key ? 'page' : undefined}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </motion.nav>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08, duration: 0.35 }}
                >
                    <Card padding="lg">
                        <div className="stack-y !gap-4 sm:!gap-5 text-[13px] sm:text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                            {children}
                        </div>
                    </Card>
                </motion.div>
            </div>
        </PageTransition>
    );
}

function LegalSection({ title, children }) {
    return (
        <section>
            <h2 className="text-[13px] sm:text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1.5 sm:mb-2">
                {title}
            </h2>
            <div className="space-y-2 sm:space-y-2.5">{children}</div>
        </section>
    );
}

LegalPage.Section = LegalSection;

export { LegalPage, LegalSection };
export default LegalPage;