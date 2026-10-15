// src/components/download/DownloadButton.jsx
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Download as DownloadIcon, Loader2 } from 'lucide-react';
import { useApkDownload } from '@/hooks/useApkDownload';
import { cn } from '@/lib/cn';

function DownloadButton({ url, filename, label = 'Download', variant = 'primary', size = 'md', className }) {
    const { status, progress, download } = useApkDownload();
    const isBusy = status === 'downloading';
    const isDone = status === 'done';

    const base =
        'relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 active:scale-[0.97] disabled:active:scale-100 select-none w-full sm:w-auto';
    const variants = {
        primary:
            'bg-orange-500 text-white shadow-[0_10px_24px_-8px_rgba(249,115,22,0.55)] hover:bg-orange-600',
        outline:
            'border border-stone-200 dark:border-white/[0.12] text-stone-900 dark:text-stone-50 bg-white/60 dark:bg-white/[0.03] hover:bg-stone-50 dark:hover:bg-white/[0.07]',
    };
    const sizes = {
        md: 'text-[14.5px] px-5 py-3',
        sm: 'text-[13px] px-3.5 py-2',
    };
    const iconSize = size === 'sm' ? 14 : 16;

    if (!url) return null;

    return (
        <button
            type="button"
            disabled={isBusy}
            onClick={() => download(url, filename)}
            className={cn(base, variants[variant], sizes[size], className)}
            aria-live="polite"
        >
            {isBusy && (
                <span
                    className="absolute inset-0 bg-white/20 dark:bg-white/10 transition-[width] duration-150 ease-linear"
                    style={{ width: `${progress}%` }}
                    aria-hidden="true"
                />
            )}
            <span className="relative z-10 inline-flex items-center gap-2">
                <AnimatePresence mode="wait" initial={false}>
                    {isBusy ? (
                        <motion.span
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="inline-flex items-center gap-2"
                        >
                            <Loader2 size={iconSize} className="animate-spin" aria-hidden="true" />
                            {progress > 0 ? `${progress}%` : 'Starting…'}
                        </motion.span>
                    ) : isDone ? (
                        <motion.span
                            key="done"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="inline-flex items-center gap-2"
                        >
                            <Check size={iconSize} aria-hidden="true" />
                            Downloaded
                        </motion.span>
                    ) : (
                        <motion.span
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="inline-flex items-center gap-2"
                        >
                            <DownloadIcon size={iconSize} aria-hidden="true" />
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>
            </span>
        </button>
    );
}

export { DownloadButton };
export default DownloadButton;