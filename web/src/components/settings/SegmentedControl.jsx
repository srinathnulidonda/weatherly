// src/components/settings/SegmentedControl.jsx
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

function SegmentedControl({ options = [], value, onChange, groupId = 'segmented', label, className, renderLabel }) {
    const optionRefs = useRef([]);

    const handleKeyDown = (event, index) => {
        const lastIndex = options.length - 1;
        let nextIndex = null;

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            nextIndex = index === lastIndex ? 0 : index + 1;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            nextIndex = index === 0 ? lastIndex : index - 1;
        } else if (event.key === 'Home') {
            nextIndex = 0;
        } else if (event.key === 'End') {
            nextIndex = lastIndex;
        } else {
            return;
        }

        event.preventDefault();
        const nextOption = options[nextIndex];
        if (!nextOption) return;
        onChange?.(nextOption.value);
        const node = optionRefs.current[nextIndex];
        if (node && typeof node.focus === 'function') {
            node.focus();
        }
    };

    const renderOptionContent = (option, active) => {
        if (renderLabel) return renderLabel(option, active);
        return (
            <span className="flex items-center gap-1 sm:gap-1.5">
                {option.icon ? <option.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : null}
                {option.label}
            </span>
        );
    };

    return (
        <div
            role="radiogroup"
            aria-label={label}
            className={cn(
                'inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-stone-100/80 p-0.5 sm:p-1 ring-1 ring-black/[0.04] dark:bg-white/[0.05] dark:ring-white/[0.07]',
                className
            )}
        >
            {options.map((option, index) => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        ref={(node) => {
                            optionRefs.current[index] = node;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        tabIndex={active ? 0 : -1}
                        onClick={() => onChange?.(option.value)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        className={cn(
                            'focus-ring relative flex min-h-[1.75rem] sm:min-h-[2.25rem] flex-1 items-center justify-center whitespace-nowrap rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10.5px] sm:text-xs font-semibold transition-colors',
                            active
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                        )}
                    >
                        {active ? (
                            <motion.span
                                layoutId={`segbg-${groupId}`}
                                className="absolute inset-0 rounded-full bg-white shadow-soft dark:bg-stone-800"
                                transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                            />
                        ) : null}
                        <span className="relative">{renderOptionContent(option, active)}</span>
                    </button>
                );
            })}
        </div>
    );
}

export { SegmentedControl };
export default SegmentedControl;