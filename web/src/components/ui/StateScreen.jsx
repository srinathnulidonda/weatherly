// web/src/components/ui/StateScreen.jsx
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

function StateScreen({ icon: Icon, title, description, action, className }) {
    return (
        <div className={cn(
            'relative rounded-5xl overflow-hidden min-h-[380px] flex items-center justify-center shadow-elevated',
            'bg-gradient-to-br from-stone-100 via-stone-50 to-orange-50/40 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950',
            className
        )}>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 flex flex-col items-center text-center px-6 py-10 max-w-sm"
            >
                {Icon && (
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
                        <Icon size={26} className="text-orange-500" />
                    </div>
                )}
                {title && <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-1.5">{title}</h3>}
                {description && <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">{description}</p>}
                {action && <div className="mt-5">{action}</div>}
            </motion.div>
        </div>
    );
}

export { StateScreen };
export default StateScreen;