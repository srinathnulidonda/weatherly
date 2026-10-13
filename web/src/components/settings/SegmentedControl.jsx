// web/src/components/settings/SegmentedControl.jsx
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

function SegmentedControl({ options, value, onChange, renderLabel, groupId }) {
    return (
        <div
            role="radiogroup"
            className="relative flex items-center gap-0.5 bg-stone-100/80 dark:bg-white/[0.05] ring-1 ring-black/[0.04] dark:ring-white/[0.07] rounded-full p-1 w-full sm:w-auto"
        >
            {options.map((opt) => {
                const active = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            'relative flex-1 sm:flex-none px-3 sm:px-4 h-9 sm:h-10 min-w-[42px] sm:min-w-[46px] text-[11.5px] sm:text-xs font-semibold rounded-full whitespace-nowrap',
                            'transition-colors duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40',
                            active
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                        )}
                    >
                        {active && (
                            <motion.span
                                layoutId={`segbg-${groupId}`}
                                className="absolute inset-0 bg-white dark:bg-stone-800 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_10px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_12px_-2px_rgba(0,0,0,0.4)] rounded-full"
                                transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                            />
                        )}
                        <span className="relative z-10 inline-flex items-center justify-center gap-1 sm:gap-1.5">
                            {renderLabel ? renderLabel(opt, active) : opt.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

export { SegmentedControl };
export default SegmentedControl;