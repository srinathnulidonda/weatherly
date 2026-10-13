// web/src/components/download/StickyInstallBar.jsx
import { AnimatePresence, motion } from 'framer-motion';
import { AppIcon } from './AppIcon';
import { DownloadButton } from './DownloadButton';

function StickyInstallBar({ show, version, subtitle, badge, url, filename }) {
    return (
        <AnimatePresence>
            {show && url && (
                <motion.div
                    initial={{ y: 110, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 110, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                    className="md:hidden fixed inset-x-0 z-[60] px-3 pointer-events-none"
                    style={{ bottom: 'calc(var(--bottombar-h) + env(safe-area-inset-bottom, 0px) + 10px)' }}
                >
                    <div className="pointer-events-auto max-w-sm mx-auto flex items-center gap-3 rounded-[20px] border border-stone-200/70 dark:border-white/[0.1] bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl shadow-[0_12px_32px_-8px_rgba(0,0,0,0.3)] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.65)] p-2.5 pl-3">
                        <AppIcon size={38} className="shrink-0" />
                        <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-stone-900 dark:text-stone-50">
                                <span className="truncate">Weatherly{version ? ` v${version}` : ''}</span>
                                {badge && (
                                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400 bg-orange-500/10 rounded-full px-1.5 py-0.5">
                                        {badge}
                                    </span>
                                )}
                            </p>
                            {subtitle && (
                                <p className="text-[10.5px] text-stone-400 dark:text-stone-500 truncate">{subtitle}</p>
                            )}
                        </div>
                        <DownloadButton
                            url={url}
                            filename={filename}
                            label="Install"
                            size="sm"
                            className="!w-auto shrink-0"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export { StickyInstallBar };
export default StickyInstallBar;