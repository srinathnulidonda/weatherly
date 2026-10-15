// src/components/legal/LegalPage.jsx
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageTransition } from '@/components/common/PageTransition';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

const LEGAL_TABS = [
    { key: 'terms', label: 'Terms', to: '/legal/terms' },
    { key: 'privacy', label: 'Privacy', to: '/legal/privacy' },
    { key: 'cookies', label: 'Cookies', to: '/legal/cookies' },
];

function LegalSection({ title, id, children, className }) {
    return (
        <section
            id={id}
            className={cn(
                'scroll-mt-20 py-4 sm:py-5 first:pt-0 border-t border-stone-200/70 first:border-t-0 dark:border-white/[0.06]',
                className
            )}
        >
            {title ? (
                <h2 className="mb-1.5 sm:mb-2 text-[13.5px] sm:text-base font-semibold text-stone-900 dark:text-stone-100">
                    {title}
                </h2>
            ) : null}
            <div className="space-y-2 sm:space-y-3 text-[12.5px] sm:text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                {children}
            </div>
        </section>
    );
}

function LegalPage({ title, updated, current, children, className }) {
    const navigate = useNavigate();

    return (
        <PageTransition className={cn('page-shell stack-y !gap-3 sm:!gap-4', className)}>
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex w-fit items-center gap-1 sm:gap-1.5 text-[12.5px] sm:text-sm font-medium text-stone-500 transition-colors hover:text-orange-600 dark:text-stone-400 dark:hover:text-orange-400"
            >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Back
            </button>

            <header className="space-y-1 sm:space-y-1.5">
                <h1 className="page-heading">{title}</h1>
                {updated ? (
                    <p className="text-[11px] sm:text-sm text-stone-400 dark:text-stone-500">Last updated {updated}</p>
                ) : null}
            </header>

            <nav aria-label="Legal documents" className="grid grid-cols-3 gap-1 sm:flex sm:w-fit sm:gap-1.5">
                {LEGAL_TABS.map((tab) => {
                    const active = tab.key === current;
                    return (
                        <Link
                            key={tab.key}
                            to={tab.to}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'rounded-full px-2.5 sm:px-3.5 py-1.5 sm:py-1.5 text-center text-[11.5px] sm:text-sm font-medium transition-colors whitespace-nowrap',
                                active
                                    ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70 dark:bg-white/[0.06] dark:text-stone-300 dark:hover:bg-white/[0.1]'
                            )}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </nav>

            <Card padding="lg">
                {children}
            </Card>
        </PageTransition>
    );
}

LegalPage.Section = LegalSection;

export { LegalPage, LegalSection };
export default LegalPage;