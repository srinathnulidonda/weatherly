// src/components/download/CopyLinkButton.jsx
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Link as LinkIcon } from 'lucide-react';

function CopyLinkButton({ url, className }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return undefined;
        const timer = setTimeout(() => setCopied(false), 1800);
        return () => clearTimeout(timer);
    }, [copied]);

    const copy = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!url) return;
        try {
            await navigator.clipboard.writeText(new URL(url, window.location.origin).toString());
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    return (
        <button
            type="button"
            onClick={copy}
            className={
                className ||
                'relative shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 hover:bg-stone-900/[0.05] dark:hover:bg-white/[0.08] active:scale-90 transition-all duration-150'
            }
            aria-label={copied ? 'Link copied' : 'Copy download link'}
        >
            <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                    <motion.span
                        key="check"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.15 }}
                    >
                        <Check size={15} className="text-green-500" aria-hidden="true" />
                    </motion.span>
                ) : (
                    <motion.span
                        key="link"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.15 }}
                    >
                        <LinkIcon size={15} aria-hidden="true" />
                    </motion.span>
                )}
            </AnimatePresence>
            <span role="status" aria-live="polite" className="sr-only">
                {copied ? 'Link copied to clipboard' : ''}
            </span>
        </button>
    );
}

export { CopyLinkButton };
export default CopyLinkButton;