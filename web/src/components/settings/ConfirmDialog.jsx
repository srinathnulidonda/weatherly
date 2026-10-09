// web/src/components/settings/ConfirmDialog.jsx
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    icon: Icon = AlertTriangle,
    danger = false,
}) {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="fixed inset-0 z-modal bg-stone-900/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            role="alertdialog"
                            aria-modal="true"
                            aria-label={title}
                            initial={{ opacity: 0, scale: 0.92, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 12 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 400 }}
                            className="pointer-events-auto w-full max-w-sm glass-elevated rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-elevated"
                        >
                            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                                <div className={cn(
                                    'w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0',
                                    danger ? 'bg-red-500/10' : 'bg-orange-500/10'
                                )}>
                                    <Icon size={18} className={danger ? 'text-red-500' : 'text-orange-500'} />
                                </div>
                                <h3 className="text-[15px] sm:text-base font-semibold text-stone-900 dark:text-stone-100">
                                    {title}
                                </h3>
                            </div>
                            {description && (
                                <p className="text-[13px] sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-4 sm:mb-5">
                                    {description}
                                </p>
                            )}
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
                                    {cancelLabel}
                                </Button>
                                <Button
                                    variant={danger ? 'danger' : 'primary'}
                                    size="sm"
                                    onClick={onConfirm}
                                    className="flex-1"
                                >
                                    {confirmLabel}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}

export { ConfirmDialog };
export default ConfirmDialog;