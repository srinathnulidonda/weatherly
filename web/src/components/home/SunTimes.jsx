// web/src/components/home/SunTimes.jsx
import { useId, useMemo } from 'react';
import { Sunrise, Sunset, Sun, Moon, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import Card from '../ui/Card';
import { SkeletonCard } from '../ui/Skeleton';
import { AnimatedItem } from '../common/PageTransition';
import { useCurrentWeather } from '@/hooks/useWeather';
import { getMoonIllumination } from '@/lib/skyTheme';
import { formatTime } from '@/utils/formatters';

function timeToMinutes(timeStr) {
    if (!timeStr) return null;
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes();
    const parts = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!parts) return null;
    let h = parseInt(parts[1], 10);
    const m = parseInt(parts[2], 10);
    if (/pm/i.test(timeStr) && h !== 12) h += 12;
    if (/am/i.test(timeStr) && h === 12) h = 0;
    return h * 60 + m;
}

function formatCountdown(minutes, label) {
    if (minutes == null || minutes < 0) return null;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    parts.push(`${m}m`);
    return `${label} in ${parts.join(' ')}`;
}

function MoonPhaseGlyph({ illumination = 1, waxing = true, size = 16 }) {
    const clamped = Math.max(0, Math.min(1, illumination));
    const shadowScale = Math.max(0.001, 1 - clamped);
    const originX = waxing ? 15.5 : 4.5;

    const rawId = useId();
    const surfaceId = `stMoonSurface-${rawId.replace(/[:]/g, '')}`;
    const clipId = `stMoonClip-${rawId.replace(/[:]/g, '')}`;

    return (
        <svg viewBox="0 0 20 20" width={size} height={size} className="shrink-0" aria-hidden="true">
            <defs>
                <radialGradient id={surfaceId} cx="35%" cy="35%" r="75%">
                    <stop offset="0%" stopColor="#FFFDF6" />
                    <stop offset="100%" stopColor="#D9D4C4" />
                </radialGradient>
                <clipPath id={clipId}>
                    <circle cx="10" cy="10" r="8" />
                </clipPath>
            </defs>
            <circle cx="10" cy="10" r="8" fill={`url(#${surfaceId})`} />
            <g clipPath={`url(#${clipId})`}>
                <ellipse
                    cx={originX}
                    cy="10"
                    rx="8"
                    ry="8"
                    fill="#1C1917"
                    opacity={clamped >= 0.98 ? 0 : 0.82}
                    style={{ transform: `scaleX(${shadowScale})`, transformOrigin: `${originX}px 10px` }}
                />
            </g>
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="0.6" />
        </svg>
    );
}

function SunTimes({ className }) {
    const { data, isLoading } = useCurrentWeather();

    const { sunrise, sunset, dayLength, sunProgress, moonPhase, isDaytime, nextEventLabel } = useMemo(() => {
        const astro = data?.astronomy;
        if (!astro) return {};
        const sr = astro.sunrise;
        const ss = astro.sunset;
        const srMin = timeToMinutes(sr);
        const ssMin = timeToMinutes(ss);
        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();

        let progress = 0;
        let daytime = false;
        let eventLabel = null;

        if (srMin != null && ssMin != null) {
            if (nowMin < srMin) {
                progress = 0;
                eventLabel = formatCountdown(srMin - nowMin, 'Sunrise');
            } else if (nowMin > ssMin) {
                progress = 1;
                eventLabel = formatCountdown((24 * 60 - nowMin) + srMin, 'Sunrise');
            } else {
                progress = (nowMin - srMin) / (ssMin - srMin);
                daytime = true;
                eventLabel = formatCountdown(ssMin - nowMin, 'Sunset');
            }
        }

        return {
            sunrise: sr,
            sunset: ss,
            dayLength: astro.day_length_hours,
            sunProgress: progress,
            moonPhase: astro.moon_phase_name,
            isDaytime: daytime,
            nextEventLabel: eventLabel,
        };
    }, [data]);

    const moonInfo = useMemo(() => (moonPhase ? getMoonIllumination(moonPhase) : null), [moonPhase]);

    if (isLoading) return <SkeletonCard className={className} />;
    if (!sunrise && !sunset) return null;

    return (
        <AnimatedItem>
            <Card variant="glass" className={cn(className)}>
                <div className="flex items-center justify-between gap-2 flex-wrap gap-y-1.5 mb-3 sm:mb-4">
                    <Card.Title className="min-w-0">Sun & Moon</Card.Title>
                    {nextEventLabel && (
                        <span className={cn(
                            'inline-flex items-center gap-1.5 shrink-0 text-[10px] sm:text-[11px] font-semibold px-2 py-1 rounded-full',
                            isDaytime
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                        )}>
                            <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                            {isDaytime ? <Sun size={11} /> : <Moon size={11} />}
                            {nextEventLabel}
                        </span>
                    )}
                </div>

                <div className="relative w-full aspect-[12/5] sm:aspect-[5/2] mb-3 sm:mb-4 rounded-2xl overflow-hidden bg-gradient-to-b from-stone-100/60 to-transparent dark:from-white/[0.03] dark:to-transparent">
                    <div className="absolute left-0 bottom-1 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-300/25 dark:bg-amber-500/10 blur-xl pointer-events-none" />
                    <div className={cn(
                        'absolute right-0 bottom-1 w-12 h-12 sm:w-14 sm:h-14 rounded-full blur-xl pointer-events-none',
                        isDaytime ? 'bg-orange-400/25 dark:bg-orange-500/10' : 'bg-indigo-400/20 dark:bg-indigo-500/10'
                    )} />

                    <svg viewBox="0 0 200 100" className="relative z-10 w-full h-full" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
                        <defs>
                            <linearGradient id="sunArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#FB923C" stopOpacity="0.3" />
                                <stop offset="50%" stopColor="#F97316" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#EA580C" stopOpacity="0.3" />
                            </linearGradient>
                        </defs>

                        <line x1="10" y1="90" x2="190" y2="90" className="stroke-stone-200 dark:stroke-white/[0.06]" strokeWidth="0.5" strokeDasharray="3,3" />

                        <path d="M 10 90 Q 100 0 190 90" fill="none" className="stroke-stone-300/20 dark:stroke-white/[0.04]" strokeWidth="2" />

                        {isDaytime && sunProgress > 0 && sunProgress < 1 && (
                            <path d="M 10 90 Q 100 0 190 90" fill="none" stroke="url(#sunArcGrad)" strokeWidth="2.5" strokeDasharray={`${sunProgress * 283} 283`} strokeLinecap="round" />
                        )}

                        <circle cx="10" cy="90" r="3" className="fill-amber-400 dark:fill-amber-500" opacity="0.9" />
                        <circle cx="190" cy="90" r="3" className="fill-orange-500" opacity="0.9" />

                        {isDaytime && sunProgress > 0 && sunProgress < 1 && (() => {
                            const t = sunProgress;
                            const x = (1 - t) * (1 - t) * 10 + 2 * (1 - t) * t * 100 + t * t * 190;
                            const y = (1 - t) * (1 - t) * 90 + 2 * (1 - t) * t * 0 + t * t * 90;
                            return (
                                <g>
                                    <circle cx={x} cy={y} r="7" fill="#F97316" opacity="0.18" />
                                    <circle cx={x} cy={y} r="4.5" fill="#F97316" opacity="0.92" />
                                    <circle cx={x} cy={y} r="2.5" fill="#FDE68A" />
                                </g>
                            );
                        })()}

                        {!isDaytime && (
                            <g transform={sunProgress >= 1 ? 'translate(190, 78)' : 'translate(10, 78)'}>
                                <circle cx="0" cy="0" r="6.5" fill="#818CF8" opacity="0.16" />
                                <circle cx="0" cy="0" r="3.5" fill="#A5B4FC" opacity="0.92" />
                            </g>
                        )}
                    </svg>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-stone-50/80 dark:bg-white/[0.03] border border-stone-100 dark:border-white/[0.05] min-w-0 transition-transform duration-300 hover:-translate-y-0.5">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Sunrise className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="label text-[10px]">Sunrise</p>
                            <p className="text-sm sm:text-base font-bold tabular-nums text-stone-800 dark:text-stone-200 truncate">{formatTime(sunrise)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-stone-50/80 dark:bg-white/[0.03] border border-stone-100 dark:border-white/[0.05] min-w-0 transition-transform duration-300 hover:-translate-y-0.5">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                            <Sunset className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="label text-[10px]">Sunset</p>
                            <p className="text-sm sm:text-base font-bold tabular-nums text-stone-800 dark:text-stone-200 truncate">{formatTime(sunset)}</p>
                        </div>
                    </div>
                </div>

                {(dayLength != null || moonPhase) && (
                    <div className="mt-2.5 pt-2.5 sm:mt-3 sm:pt-3 border-t border-stone-100 dark:border-white/[0.04] grid grid-cols-2 gap-2.5 sm:gap-3">
                        {dayLength != null && (
                            <div className={cn(
                                'glass-metric flex items-center gap-2 p-2.5 sm:p-3 min-w-0 transition-transform duration-300 hover:-translate-y-0.5',
                                !moonPhase && 'col-span-2'
                            )}>
                                <div className="w-7 h-7 rounded-lg bg-stone-200/70 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                                    <Clock size={13} className="text-stone-500 dark:text-stone-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="label text-[10px]">Daylight</p>
                                    <p className="text-[12px] sm:text-[13px] font-semibold tabular-nums text-stone-800 dark:text-stone-200 truncate">{dayLength.toFixed(1)}h</p>
                                </div>
                            </div>
                        )}
                        {moonPhase && (
                            <div className={cn(
                                'glass-metric flex items-center gap-2 p-2.5 sm:p-3 min-w-0 transition-transform duration-300 hover:-translate-y-0.5',
                                dayLength == null && 'col-span-2'
                            )}>
                                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                                    {moonInfo
                                        ? <MoonPhaseGlyph illumination={moonInfo.illumination} waxing={moonInfo.waxing} size={15} />
                                        : <Moon size={13} className="text-indigo-500" />
                                    }
                                </div>
                                <div className="min-w-0">
                                    <p className="label text-[10px]">Moon Phase</p>
                                    <p className="text-[12px] sm:text-[13px] font-semibold text-stone-800 dark:text-stone-200 truncate capitalize">{moonPhase.replace(/_/g, ' ')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </AnimatedItem>
    );
}

export { SunTimes };
export default SunTimes;