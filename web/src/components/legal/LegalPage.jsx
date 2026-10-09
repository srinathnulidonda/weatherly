// web/src/components/legal/LegalPage.jsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/common/PageTransition';
import { Card } from '@/components/ui/Card';

function LegalPage({ title, updated, children }) {
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
                        <ArrowLeft size={18} />
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

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.35 }}
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