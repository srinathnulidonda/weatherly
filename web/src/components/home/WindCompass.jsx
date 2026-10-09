// web/src/components/home/WindCompass.jsx
import { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Tooltip } from '../ui/Tooltip';
import { getWindLabel, formatWind, getBeaufortFromSpeed } from '@/utils/formatters';

function WindCompass({ direction, speed, gust, units = 'metric', size = 'md', className }) {
    const SIZES = {
        sm: { container: 'w-20 h-20', text: 'text-xs', label: 'text-[8px]' },
        md: { container: 'w-28 h-28', text: 'text-sm', label: 'text-[9px]' },
        lg: { container: 'w-36 h-36', text: 'text-base', label: 'text-[10px]' },
    };

    const s = SIZES[size] || SIZES.md;
    const dirLabel = getWindLabel(direction);
    const beaufort = getBeaufortFromSpeed(speed);
    const rotation = direction ?? 0;

    const rawId = useId();
    const needleGradId = `windNeedle-${rawId.replace(/[:]/g, '')}`;

    const cardinals = [
        { label: 'N', angle: 0, primary: true },
        { label: 'NE', angle: 45, primary: false },
        { label: 'E', angle: 90, primary: true },
        { label: 'SE', angle: 135, primary: false },
        { label: 'S', angle: 180, primary: true },
        { label: 'SW', angle: 225, primary: false },
        { label: 'W', angle: 270, primary: true },
        { label: 'NW', angle: 315, primary: false },
    ];

    const tickCount = 36;
    const ticks = Array.from({ length: tickCount }, (_, i) => i * (360 / tickCount));

    let speedValue = '--';
    let speedUnit = '';
    if (speed != null) {
        const parts = formatWind(speed, units).split(' ');
        speedValue = parts[0] ?? '--';
        speedUnit = parts[1] ?? '';
    }

    const tooltipContent = speed != null
        ? `${dirLabel} at ${formatWind(speed, units)}${gust ? ` (gusts ${formatWind(gust, units)})` : ''} — ${beaufort.label}`
        : `${dirLabel} — wind data unavailable`;

    return (
        <Tooltip content={tooltipContent}>
            <div className={cn('relative flex items-center justify-center', s.container, className)}>
                <div className="absolute inset-[7%] rounded-full bg-gradient-to-b from-stone-100/80 to-transparent dark:from-white/[0.04] dark:to-transparent" />

                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
                    <circle cx="50" cy="50" r="46" fill="none" className="stroke-stone-200 dark:stroke-white/[0.07]" strokeWidth="0.6" />
                    <circle cx="50" cy="50" r="38" fill="none" className="stroke-stone-150 dark:stroke-white/[0.04]" strokeWidth="0.4" />

                    {ticks.map((angle) => {
                        const isMajor = angle % 90 === 0;
                        const isMinor = angle % 45 === 0;
                        const len = isMajor ? 5.5 : isMinor ? 4 : 2;
                        const outerR = 46;
                        const innerR = outerR - len;
                        const rad = (angle - 90) * (Math.PI / 180);
                        const x1 = 50 + outerR * Math.cos(rad);
                        const y1 = 50 + outerR * Math.sin(rad);
                        const x2 = 50 + innerR * Math.cos(rad);
                        const y2 = 50 + innerR * Math.sin(rad);
                        return (
                            <line
                                key={angle}
                                x1={x1} y1={y1} x2={x2} y2={y2}
                                className={cn(
                                    isMajor
                                        ? 'stroke-stone-400 dark:stroke-stone-400'
                                        : isMinor
                                            ? 'stroke-stone-300 dark:stroke-stone-600'
                                            : 'stroke-stone-200 dark:stroke-stone-700'
                                )}
                                strokeWidth={isMajor ? 1.2 : 0.5}
                                strokeLinecap="round"
                            />
                        );
                    })}

                    {cardinals.map(({ label, angle, primary }) => {
                        const r = 34;
                        const rad = (angle - 90) * (Math.PI / 180);
                        const x = 50 + r * Math.cos(rad);
                        const y = 50 + r * Math.sin(rad);
                        return (
                            <text
                                key={label} x={x} y={y}
                                textAnchor="middle" dominantBaseline="central"
                                className={cn(
                                    primary
                                        ? 'fill-stone-500 dark:fill-stone-400 font-bold'
                                        : 'fill-stone-300 dark:fill-stone-600 font-medium',
                                    label === 'N' && 'fill-orange-500 dark:fill-orange-400'
                                )}
                                fontSize={primary ? 6 : 4}
                            >
                                {label}
                            </text>
                        );
                    })}

                    {direction != null && (
                        <motion.g
                            animate={{ rotate: rotation }}
                            transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                            style={{ transformOrigin: '50px 50px' }}
                        >
                            <defs>
                                <linearGradient id={needleGradId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FB923C" />
                                    <stop offset="100%" stopColor="#EA580C" />
                                </linearGradient>
                            </defs>
                            <polygon points="50,10 46,27 54,27" fill={`url(#${needleGradId})`} />
                            <polygon points="50,90 46,73 54,73" className="fill-stone-300 dark:fill-stone-600" opacity="0.45" />
                            <line x1="50" y1="27" x2="50" y2="73" className="stroke-orange-500/25" strokeWidth="1" />
                        </motion.g>
                    )}

                    <circle cx="50" cy="50" r="10.5" className="fill-white dark:fill-stone-900" />
                    <circle cx="50" cy="50" r="10.5" fill="none" className="stroke-stone-200 dark:stroke-stone-700" strokeWidth="0.6" />
                </svg>

                <div className="flex flex-col items-center z-10 pointer-events-none">
                    <span className={cn('font-extrabold text-stone-800 dark:text-stone-100 leading-none tabular-nums', s.text)}>
                        {speedValue}
                    </span>
                    <span className="text-[6.5px] sm:text-[7px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider leading-none mt-0.5">
                        {speedUnit}
                    </span>
                    <span className={cn('text-orange-500 dark:text-orange-400 font-bold mt-1', s.label)}>
                        {dirLabel || '--'}
                    </span>
                </div>
            </div>
        </Tooltip>
    );
}

export { WindCompass };
export default WindCompass;