// web/src/components/background/DynamicSky.jsx
import { useEffect, useId, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { CONDITION_CATEGORY, resolveConditionCategory } from '@/lib/weatherCondition';
import {
    computeSolarState,
    getSkyGradient,
    getSkyGlow,
    getParticleVariant,
    getGoldenIntensity,
    getMoonIllumination,
    mixHexColors,
} from '@/lib/skyTheme';
import './DynamicSky.css';

const CLOUD_PATH_VARIANTS = [
    {
        body: 'M20 70 Q10 40 40 38 Q48 18 78 26 Q100 8 122 28 Q156 22 158 52 Q182 56 172 76 Q170 84 158 84 L34 84 Q18 84 20 70Z',
        highlight: 'M46 78 Q40 60 62 58 Q70 46 90 52 Q104 44 116 56 Q132 54 132 70 L48 78Z',
    },
    {
        body: 'M14 74 Q6 54 30 50 Q34 30 62 34 Q74 14 104 24 Q130 12 148 34 Q176 34 174 58 Q192 62 180 78 Q178 86 166 86 L28 86 Q10 86 14 74Z',
        highlight: 'M40 82 Q34 68 54 64 Q64 50 86 56 Q100 46 116 58 Q134 54 136 70 L42 82Z',
    },
    {
        body: 'M26 72 Q16 46 42 42 Q50 20 76 30 Q92 14 112 30 Q138 24 142 50 Q164 52 158 74 Q158 84 144 84 L38 84 Q22 84 26 72Z',
        highlight: 'M50 80 Q44 64 64 60 Q72 48 90 54 Q102 44 114 56 Q128 54 128 70 L52 80Z',
    },
];

const CLOUD_LAYERS = [
    { depth: 'far', top: '4%', left: '-8%', width: 120, opacity: 0.22, blur: 4, variant: 1 },
    { depth: 'far', top: '38%', left: '70%', width: 140, opacity: 0.26, blur: 3.5, variant: 2 },
    { depth: 'mid', top: '14%', left: '20%', width: 220, opacity: 0.46, blur: 1, variant: 0 },
    { depth: 'mid', top: '30%', left: '-10%', width: 190, opacity: 0.4, blur: 1.5, variant: 1 },
    { depth: 'near', top: '6%', left: '54%', width: 250, opacity: 0.6, blur: 0, variant: 2 },
];

const DRIFT_CLASS_BY_DEPTH = {
    far: 'animate-cloud-drift-far',
    mid: 'animate-cloud-drift',
    near: 'animate-cloud-drift-fast',
};

const BOLT_PATHS = [
    '20,0 8,42 18,42 4,100 32,38 20,38 34,0',
    '18,0 26,30 12,32 26,64 14,64 30,100 34,54 22,52 32,20 20,0',
];

function toAlphaHex(alpha) {
    return Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0');
}

function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h << 5) - h + str.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

function useSeeded(count, seedBase = 1) {
    return useMemo(() => Array.from({ length: count }, (_, i) => {
        const seed = (i + 1) * seedBase;
        const rand = (n) => ((Math.sin(seed * n) + 1) / 2);
        return {
            left: rand(12.9898) * 100,
            top: rand(78.233) * 100,
            delay: rand(45.164) * 6,
            duration: 0.9 + rand(94.673) * 1.6,
            size: 1 + rand(37.719) * 2.2,
            drift: (rand(15.73) - 0.5) * 2,
            rotate: rand(63.91) * 360,
            variant: rand(29.34),
        };
    }), [count, seedBase]);
}

function useSolarState(sunrise, sunset) {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 60000);
        return () => clearInterval(id);
    }, []);

    return useMemo(() => computeSolarState({ sunrise, sunset }), [sunrise, sunset, tick]);
}

function GrainOverlay() {
    return <div className="sky-grain" aria-hidden="true" />;
}

function Vignette() {
    return <div className="sky-vignette" aria-hidden="true" />;
}

function DepthVeil() {
    return <div className="sky-depth-veil" aria-hidden="true" />;
}

function AtmosphericHaze({ isDay }) {
    if (!isDay) return null;
    return <div className="sky-atmo-haze" aria-hidden="true" />;
}

function GroundMist({ reduced }) {
    return <div className={cn('sky-ground-mist', !reduced && 'animate-mist-rise')} aria-hidden="true" />;
}

function HorizonGlow({ color, reduced, intensity = 0 }) {
    const alpha = 0.16 + intensity * 0.22;
    return (
        <div
            className={cn('sky-horizon-glow', !reduced && 'animate-horizon-pulse')}
            style={{
                background: `radial-gradient(ellipse at center, ${color}${toAlphaHex(alpha)} 0%, transparent 70%)`,
                transition: 'background 1.6s ease',
            }}
            aria-hidden="true"
        />
    );
}

function ShootingStar({ delay, top, left }) {
    return (
        <span
            className="sky-shooting-star animate-star-shoot"
            style={{ top: `${top}%`, left: `${left}%`, animationDelay: `${delay}s` }}
            aria-hidden="true"
        />
    );
}

function MilkyWay() {
    return <div className="sky-milkyway" aria-hidden="true" />;
}

function StarField({ reduced, category }) {
    const stars = useSeeded(58, 3);
    const bright = useSeeded(7, 11);
    const shooters = useSeeded(3, 41);

    return (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            {category === CONDITION_CATEGORY.CLEAR && <MilkyWay />}
            {stars.map((s, i) => (
                <span
                    key={`s-${i}`}
                    className={cn('sky-star', !reduced && 'animate-twinkle')}
                    style={{
                        left: `${s.left}%`,
                        top: `${s.top * 0.72}%`,
                        width: s.size,
                        height: s.size,
                        animationDelay: `${s.delay}s`,
                        animationDuration: `${2.4 + s.variant * 2}s`,
                    }}
                />
            ))}
            {bright.map((s, i) => (
                <span
                    key={`b-${i}`}
                    className={cn('sky-star-bright', !reduced && 'animate-twinkle-bright')}
                    style={{
                        left: `${s.left}%`,
                        top: `${s.top * 0.6}%`,
                        width: s.size + 1.5,
                        height: s.size + 1.5,
                        background: s.variant > 0.5 ? '#EAF1FF' : '#FFF6E0',
                        boxShadow: `0 0 6px 1px ${s.variant > 0.5 ? 'rgba(180,200,255,0.8)' : 'rgba(255,236,180,0.8)'}`,
                        animationDelay: `${s.delay}s`,
                    }}
                />
            ))}
            {!reduced && shooters.map((s, i) => (
                <ShootingStar key={`sh-${i}`} delay={4 + s.delay * 3 + i * 5} top={8 + s.top * 30} left={20 + s.left * 60} />
            ))}
        </div>
    );
}

function SunGlow({ reduced, color, goldenIntensity = 0 }) {
    const rayColor = mixHexColors('#FFFFFF', '#FFB37A', goldenIntensity * 0.85);
    const limbColor = mixHexColors(color, '#FF7A45', goldenIntensity);

    return (
        <div className="sky-sun-wrap" aria-hidden="true">
            <div
                className="sky-sun-limb"
                style={{
                    background: `radial-gradient(circle, ${limbColor}55, transparent 70%)`,
                    opacity: 0.3 + goldenIntensity * 0.4,
                    transition: 'background 1.6s ease, opacity 1.6s ease',
                }}
            />
            <div className={cn('sky-sun-halo-outer', !reduced && 'animate-glow-pulse')} style={{ background: color, transition: 'background 1.6s ease' }} />
            <div className={cn('sky-sun-halo-inner', !reduced && 'animate-horizon-pulse')} style={{ background: color, transition: 'background 1.6s ease' }} />
            <svg viewBox="0 0 100 100" className={cn('sky-sun-svg', !reduced && 'animate-ray-rotate')}>
                {Array.from({ length: 16 }).map((_, i) => (
                    <line
                        key={i}
                        x1="50" y1="2" x2="50" y2={i % 2 === 0 ? '16' : '11'}
                        stroke={rayColor} strokeWidth={i % 2 === 0 ? 2.5 : 1.5} strokeLinecap="round"
                        opacity={i % 2 === 0 ? 0.6 : 0.32}
                        transform={`rotate(${i * 22.5}, 50, 50)`}
                    />
                ))}
                <circle cx="50" cy="50" r="21" fill={rayColor} opacity="0.15" />
                <circle cx="50" cy="50" r="18" fill={rayColor} opacity="0.96" />
                <circle cx="44" cy="44" r="6" fill="#ffffff" opacity="0.5" />
            </svg>
        </div>
    );
}

function MoonGlow({ reduced, color, illumination = 1, waxing = true }) {
    const rawId = useId();
    const surfaceId = `dynMoonSurface-${rawId.replace(/[:]/g, '')}`;
    const clipId = `dynMoonClip-${rawId.replace(/[:]/g, '')}`;

    const clampedIllum = Math.max(0, Math.min(1, illumination));
    const shadowScale = Math.max(0.001, 1 - clampedIllum);
    const originX = waxing ? 78 : 22;

    return (
        <div className="sky-moon-wrap" aria-hidden="true">
            <div
                className="sky-moon-limb"
                style={{ background: `radial-gradient(circle, ${color}44, transparent 70%)`, transition: 'background 1.6s ease' }}
            />
            <div className={cn('sky-moon-halo', !reduced && 'animate-glow-pulse')} style={{ background: color, transition: 'background 1.6s ease' }} />
            <svg viewBox="0 0 100 100" className="sky-moon-svg">
                <defs>
                    <radialGradient id={surfaceId} cx="35%" cy="35%" r="75%">
                        <stop offset="0%" stopColor="#FFFDF6" />
                        <stop offset="100%" stopColor="#D9D4C4" />
                    </radialGradient>
                    <clipPath id={clipId}>
                        <circle cx="50" cy="50" r="26" />
                    </clipPath>
                </defs>
                <circle cx="50" cy="50" r="26" fill={`url(#${surfaceId})`} />
                <circle cx="40" cy="38" r="3.5" fill="#C7C2B2" opacity="0.6" />
                <circle cx="58" cy="47" r="5" fill="#C7C2B2" opacity="0.45" />
                <circle cx="46" cy="60" r="2.5" fill="#C7C2B2" opacity="0.5" />
                <circle cx="62" cy="61" r="2" fill="#C7C2B2" opacity="0.4" />
                <g clipPath={`url(#${clipId})`}>
                    <ellipse
                        cx={originX}
                        cy="50"
                        rx="26"
                        ry="26"
                        fill="#05060A"
                        opacity={clampedIllum >= 0.98 ? 0 : 0.82}
                        style={{ transform: `scaleX(${shadowScale})`, transformOrigin: `${originX}px 50px` }}
                    />
                </g>
                <circle cx="63" cy="41" r="24" fill={color} opacity="0.6" style={{ mixBlendMode: 'multiply' }} />
                <circle cx="50" cy="50" r="30" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
            </svg>
        </div>
    );
}

function CloudBlob({ id, top, left, width, opacity, blur, flip, driftClass, delay, isDay, pathVariant, showShadow, goldenIntensity }) {
    const gradId = `cloudGrad-${id}`;
    const baseTop = isDay ? '#FFFFFF' : '#B9C4D6';
    const baseBottom = isDay ? '#D7DEE6' : '#6B7688';
    const baseHighlight = isDay ? '#FFFFFF' : '#CFD8E6';

    const topColor = isDay ? mixHexColors(baseTop, '#FFD9A8', goldenIntensity * 0.6) : baseTop;
    const bottomColor = isDay ? mixHexColors(baseBottom, '#D98A5E', goldenIntensity * 0.5) : baseBottom;
    const highlightColor = isDay ? mixHexColors(baseHighlight, '#FFEBC8', goldenIntensity * 0.5) : baseHighlight;

    const path = CLOUD_PATH_VARIANTS[pathVariant % CLOUD_PATH_VARIANTS.length];

    return (
        <div className={cn('sky-cloud', driftClass)} style={{ top, left, width, animationDelay: delay }} aria-hidden="true">
            {showShadow && <div className="sky-cloud-shadow" />}
            <div style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
                <svg
                    viewBox="0 0 200 100"
                    style={{
                        width: '100%',
                        display: 'block',
                        opacity,
                        filter: `${blur ? `blur(${blur}px) ` : ''}drop-shadow(0 8px 10px rgba(0,0,0,0.14))`,
                    }}
                >
                    <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={topColor} />
                            <stop offset="100%" stopColor={bottomColor} />
                        </linearGradient>
                    </defs>
                    <path d={path.body} fill={`url(#${gradId})`} />
                    <path d={path.highlight} fill={highlightColor} opacity={isDay ? 0.55 : 0.32} />
                </svg>
            </div>
        </div>
    );
}

function GodRays({ reduced }) {
    return <div className={cn('sky-god-rays', !reduced && 'animate-ray-sweep')} aria-hidden="true" />;
}

function CloudDrift({ reduced, variant = 'clouds', isDay, goldenIntensity = 0, moonInfo }) {
    return (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            {variant === 'clouds-sun' && (
                <>
                    <SunGlow reduced={reduced} color="#FFD98B" goldenIntensity={goldenIntensity} />
                    <GodRays reduced={reduced} />
                </>
            )}
            {variant === 'clouds-moon' && (
                <MoonGlow reduced={reduced} color="#7C8DBE" illumination={moonInfo?.illumination ?? 1} waxing={moonInfo?.waxing ?? true} />
            )}
            {CLOUD_LAYERS.map((l, i) => (
                <CloudBlob
                    key={i}
                    id={i}
                    top={l.top}
                    left={l.left}
                    width={l.width}
                    opacity={l.opacity}
                    blur={l.blur}
                    flip={i % 2 === 1}
                    driftClass={!reduced ? DRIFT_CLASS_BY_DEPTH[l.depth] : undefined}
                    delay={`${i * 0.6}s`}
                    isDay={isDay}
                    pathVariant={l.variant}
                    showShadow={isDay}
                    goldenIntensity={goldenIntensity}
                />
            ))}
        </div>
    );
}

function FogBands({ reduced, isDay }) {
    return (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            {isDay && <div className="sky-fog-glow" />}
            {[14, 36, 58, 80].map((top, i) => (
                <div
                    key={i}
                    className={cn('sky-fog-band', !reduced && 'animate-fog-drift')}
                    style={{ top: `${top}%`, opacity: 0.16 + i * 0.06, animationDelay: `${i * 1.8}s`, animationDuration: `${7 + i}s` }}
                />
            ))}
            <div className="sky-fog-wash" />
        </div>
    );
}

function RainDrops({ reduced, intensity = 'medium' }) {
    const countMap = { light: 34, medium: 60, heavy: 90 };
    const speedMap = { light: 1.4, medium: 1.0, heavy: 0.62 };
    const angle = intensity === 'heavy' ? 14 : intensity === 'medium' ? 10 : 7;
    const count = countMap[intensity] ?? countMap.medium;
    const baseSpeed = speedMap[intensity] ?? speedMap.medium;

    const speed = reduced ? baseSpeed * 2.4 : baseSpeed;
    const effectiveCount = reduced ? Math.round(count * 0.55) : count;

    const backCount = Math.round(effectiveCount * 0.4);
    const frontCount = effectiveCount - backCount;
    const backDrops = useSeeded(backCount, 71);
    const frontDrops = useSeeded(frontCount, 7);
    const splashes = useSeeded(Math.max(6, Math.round(frontCount / 2.5)), 21);

    return (
        <>
            <div className="absolute inset-0 overflow-hidden" style={{ transform: `rotate(${angle}deg) scale(1.2)` }} aria-hidden="true">
                {backDrops.map((d, i) => (
                    <span
                        key={`b-${i}`}
                        className="sky-raindrop sky-raindrop-back animate-fall-rain"
                        style={{
                            left: `${d.left}%`,
                            width: intensity === 'heavy' ? 1.2 : 0.9,
                            height: intensity === 'heavy' ? 20 : 14,
                            animationDuration: `${speed * 1.3 * d.duration}s`,
                            animationDelay: `${d.delay}s`,
                        }}
                    />
                ))}
                {frontDrops.map((d, i) => (
                    <span
                        key={`f-${i}`}
                        className="sky-raindrop animate-fall-rain"
                        style={{
                            left: `${d.left}%`,
                            width: intensity === 'heavy' ? 2.2 : 1.5,
                            height: intensity === 'heavy' ? 32 : 22,
                            animationDuration: `${speed * d.duration}s`,
                            animationDelay: `${d.delay}s`,
                        }}
                    />
                ))}
                {!reduced && (
                    <div className="absolute inset-x-0 bottom-0" style={{ transform: `rotate(${-angle}deg)` }}>
                        {splashes.map((s, i) => (
                            <span key={i} style={{ position: 'absolute', left: `${s.left}%`, bottom: '0.4rem' }}>
                                <span className="sky-splash animate-rain-splash" style={{ animationDelay: `${s.delay}s`, animationDuration: `${1.2 + s.variant}s` }} />
                                <span className="sky-splash-droplet animate-rain-splash-droplet-a" style={{ animationDelay: `${s.delay}s`, animationDuration: `${1.2 + s.variant}s` }} />
                                <span className="sky-splash-droplet animate-rain-splash-droplet-b" style={{ animationDelay: `${s.delay}s`, animationDuration: `${1.2 + s.variant}s` }} />
                            </span>
                        ))}
                    </div>
                )}
            </div>
            {intensity !== 'light' && <GroundMist reduced={reduced} />}
            <div className={cn('sky-wet-sheen', !reduced && 'animate-wet-shimmer')} aria-hidden="true" />
        </>
    );
}

function SnowFlakes({ reduced }) {
    const flakes = useSeeded(42, 5);
    const speed = reduced ? 2.4 : 1;
    const effectiveCount = reduced ? Math.round(42 * 0.7) : 42;
    const visibleFlakes = flakes.slice(0, effectiveCount);

    return (
        <>
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                {visibleFlakes.map((f, i) => {
                    const depthBlur = Math.max(0, (2.4 - f.size) * 0.6);
                    const fallDuration = (4.5 + f.duration + (2.4 - f.size) * 1.4) * speed;
                    return (
                        <span
                            key={i}
                            className="sky-snowflake animate-fall-snow-drift"
                            style={{
                                left: `${f.left}%`,
                                width: f.size + 1,
                                height: f.size + 1,
                                opacity: 0.55 + f.variant * 0.4,
                                filter: depthBlur > 0.15 ? `blur(${depthBlur}px)` : undefined,
                                '--drift-x': `${f.drift * (20 + f.size * 14)}px`,
                                animationDuration: `${fallDuration}s`,
                                animationDelay: `${f.delay}s`,
                            }}
                        />
                    );
                })}
            </div>
            <GroundMist reduced={reduced} />
            <div className="sky-snow-ground" aria-hidden="true" />
        </>
    );
}

function LeafShape({ rotation = 0 }) {
    return (
        <svg viewBox="0 0 20 20" style={{ width: '100%', height: 'auto', display: 'block', transform: `rotate(${rotation}deg)` }} aria-hidden="true">
            <path d="M10 1 C15 3 18 8 15 14 C12 19 6 19 3 15 C0 11 2 5 10 1Z" fill="rgba(255,255,255,0.55)" />
            <path d="M10 2 L10 17" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
        </svg>
    );
}

function WindSweep({ reduced }) {
    const leaves = useSeeded(8, 9);

    if (reduced) {
        return (
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute inset-0 flex flex-col justify-center gap-6 px-4">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="sky-wind-line" style={{ opacity: 0.3 }} />
                    ))}
                </div>
                {leaves.slice(0, 5).map((l, i) => (
                    <span
                        key={i}
                        className="sky-leaf"
                        style={{ top: `${20 + l.top * 0.6}%`, left: `${10 + l.left * 0.7}%`, width: 10 + l.size * 2, opacity: 0.6 }}
                    >
                        <LeafShape rotation={l.rotate} />
                    </span>
                ))}
            </div>
        );
    }

    return (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute inset-0 flex flex-col justify-center gap-6 px-4">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="sky-wind-line animate-wind-sweep"
                        style={{ animationDelay: `${i * 0.9}s`, animationDuration: `${2 + i * 0.4}s` }}
                    />
                ))}
            </div>
            {leaves.map((l, i) => (
                <span
                    key={i}
                    className="sky-leaf animate-leaf-tumble"
                    style={{
                        top: `${20 + l.top * 0.6}%`,
                        width: 10 + l.size * 2,
                        animationDelay: `${l.delay}s`,
                        animationDuration: `${3 + l.duration}s`,
                    }}
                >
                    <LeafShape rotation={l.rotate} />
                </span>
            ))}
        </div>
    );
}

function LightningBolt({ left, top, scale, delay, duration, glow, variant = 0, flickerClass, burstClass, staticOpacity }) {
    const points = BOLT_PATHS[variant % BOLT_PATHS.length];

    return (
        <>
            <div
                className={cn('sky-lightning-burst', burstClass)}
                style={{
                    left: `${left - 15}%`,
                    top: `${top - 5}%`,
                    width: 220 * scale,
                    height: 220 * scale,
                    background: `radial-gradient(circle, ${glow}55, transparent 70%)`,
                    animationDelay: burstClass ? `${delay}s` : undefined,
                    animationDuration: burstClass ? `${duration}s` : undefined,
                    opacity: staticOpacity != null ? staticOpacity * 0.7 : undefined,
                }}
                aria-hidden="true"
            />
            <svg
                viewBox="0 0 40 100"
                className={cn('sky-lightning-bolt', flickerClass)}
                style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: 40 * scale,
                    height: 100 * scale,
                    animationDelay: flickerClass ? `${delay}s` : undefined,
                    animationDuration: flickerClass ? `${duration}s` : undefined,
                    filter: `drop-shadow(0 0 10px ${glow})`,
                    opacity: staticOpacity != null ? staticOpacity : undefined,
                }}
                aria-hidden="true"
            >
                <polyline points={points} fill={glow} opacity="0.95" />
            </svg>
        </>
    );
}

function SheetLightning({ glow, delay, duration }) {
    return (
        <div
            className="sky-sheet-flash animate-sheet-flash"
            style={{
                background: `radial-gradient(ellipse at 50% 20%, ${glow}40, transparent 60%)`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
            }}
            aria-hidden="true"
        />
    );
}

function StormLayer({ reduced, glow }) {
    if (reduced) {
        return (
            <>
                <RainDrops reduced intensity="heavy" />
                <div className="sky-storm-veil" aria-hidden="true" />
                <LightningBolt left={30} top={4} scale={0.9} glow={glow} variant={0} staticOpacity={0.3} />
            </>
        );
    }

    return (
        <>
            <RainDrops reduced={reduced} intensity="heavy" />
            <div className="sky-storm-veil" aria-hidden="true" />
            <SheetLightning glow={glow} delay={0} duration={13} />
            <SheetLightning glow={glow} delay={6.5} duration={16} />
            <LightningBolt left={22} top={4} scale={1.1} delay={0.4} duration={7} glow={glow} variant={0} flickerClass="animate-lightning-flicker" burstClass="animate-lightning-burst" />
            <LightningBolt left={64} top={2} scale={0.85} delay={3.8} duration={9} glow={glow} variant={1} flickerClass="animate-lightning-flicker-fast" burstClass="animate-lightning-burst-fast" />
            <LightningBolt left={45} top={6} scale={0.7} delay={5.6} duration={8.5} glow={glow} variant={0} flickerClass="animate-lightning-flicker-soft" burstClass="animate-lightning-burst-soft" />
            <div className="sky-strike-flash animate-screen-flash-strike" style={{ animationDelay: '0.4s', animationDuration: '7s' }} aria-hidden="true" />
            <div className="sky-strike-flash animate-screen-flash-strike" style={{ animationDelay: '3.8s', animationDuration: '9s' }} aria-hidden="true" />
        </>
    );
}

function HazeParticles({ reduced, isDay }) {
    const dust = useSeeded(24, 13);
    return (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="sky-haze-wash" />
            {isDay && <GodRays reduced={reduced} />}
            {dust.map((d, i) => (
                <span
                    key={i}
                    className={cn('sky-dust', !reduced && 'animate-haze-drift')}
                    style={{
                        left: `${d.left}%`,
                        top: `${d.top}%`,
                        width: d.size + 2,
                        height: (d.size + 2) / 3,
                        animationDelay: `${d.delay}s`,
                        animationDuration: `${8 + d.duration}s`,
                    }}
                />
            ))}
            <FogBands reduced={reduced} isDay={false} />
        </div>
    );
}

function Rainbow({ isDay, category, seedKey, reduced }) {
    if (!isDay || category !== CONDITION_CATEGORY.DRIZZLE) return null;
    const show = (hashString(seedKey) % 100) < 45;
    if (!show) return null;

    return (
        <svg viewBox="0 0 300 150" className={cn('sky-rainbow', !reduced && 'animate-rainbow-emerge')} aria-hidden="true">
            <defs>
                <linearGradient id="rainbowGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="20%" stopColor="#F59E0B" />
                    <stop offset="40%" stopColor="#FDE047" />
                    <stop offset="60%" stopColor="#22C55E" />
                    <stop offset="80%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
            </defs>
            <path d="M 20 150 A 130 130 0 0 1 280 150" fill="none" stroke="url(#rainbowGrad)" strokeWidth="8" strokeLinecap="round" />
        </svg>
    );
}

function ParticleLayer({ particles, reduced, glow, isDay, category, goldenIntensity, moonInfo, rainbowSeed }) {
    switch (particles) {
        case 'sun': return <SunGlow reduced={reduced} color={glow} goldenIntensity={goldenIntensity} />;
        case 'stars': return <StarField reduced={reduced} category={category} />;
        case 'clouds-sun': return <CloudDrift reduced={reduced} variant="clouds-sun" isDay={isDay} goldenIntensity={goldenIntensity} moonInfo={moonInfo} />;
        case 'clouds-moon': return <CloudDrift reduced={reduced} variant="clouds-moon" isDay={isDay} goldenIntensity={goldenIntensity} moonInfo={moonInfo} />;
        case 'clouds': return <CloudDrift reduced={reduced} variant="clouds" isDay={isDay} goldenIntensity={goldenIntensity} moonInfo={moonInfo} />;
        case 'fog': return <FogBands reduced={reduced} isDay={isDay} />;
        case 'rain-light': return (<><Rainbow isDay={isDay} category={category} seedKey={rainbowSeed} reduced={reduced} /><RainDrops reduced={reduced} intensity="light" /></>);
        case 'rain': return <RainDrops reduced={reduced} intensity="medium" />;
        case 'rain-heavy': return <RainDrops reduced={reduced} intensity="heavy" />;
        case 'snow': return <SnowFlakes reduced={reduced} />;
        case 'storm': return <StormLayer reduced={reduced} glow={glow} />;
        case 'wind': return <WindSweep reduced={reduced} />;
        case 'haze': return <HazeParticles reduced={reduced} isDay={isDay} />;
        default: return null;
    }
}

function DynamicSky({ condition, isDay, sunrise = null, sunset = null, moonPhase = null, className }) {
    const reduced = useReducedMotion();
    const category = useMemo(() => resolveConditionCategory(condition), [condition]);
    const solar = useSolarState(sunrise, sunset);
    const moonInfo = useMemo(() => getMoonIllumination(moonPhase), [moonPhase]);

    const goldenIntensity = useMemo(() => {
        if (!isDay) return 0;
        const raw = getGoldenIntensity(solar.elevation);
        return solar.hasAstro ? raw : raw * 0.55;
    }, [isDay, solar.elevation, solar.hasAstro]);

    const particleVariant = useMemo(() => getParticleVariant(category, isDay), [category, isDay]);

    const gradient = useMemo(
        () => getSkyGradient(category, solar.from, solar.to, solar.t),
        [category, solar.from, solar.to, solar.t]
    );
    const glowColor = useMemo(
        () => getSkyGlow(category, solar.from, solar.to, solar.t),
        [category, solar.from, solar.to, solar.t]
    );

    const rainbowSeed = useMemo(() => `${category}:${Math.floor(Date.now() / 3600000)}`, [category]);
    const sceneKey = `${category}:${particleVariant}`;
    const showGoldenVeil = isDay && goldenIntensity > 0.12 && category !== CONDITION_CATEGORY.FOG && category !== CONDITION_CATEGORY.HAZE;

    return (
        <div className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden="true">
            <AnimatePresence>
                <motion.div
                    key={`${category}:${isDay}`}
                    className="absolute inset-0"
                    style={{ backgroundImage: gradient }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.6, ease: 'easeInOut' }}
                />
            </AnimatePresence>

            <HorizonGlow color={glowColor} reduced={reduced} intensity={goldenIntensity} />
            <AtmosphericHaze isDay={isDay} />

            {showGoldenVeil && (
                <div
                    className={cn('sky-golden-veil', !reduced && 'animate-golden-veil-pulse')}
                    style={{ opacity: 0.4 + goldenIntensity * 0.5 }}
                />
            )}

            <AnimatePresence mode="sync">
                <motion.div
                    key={sceneKey}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.4, ease: 'easeInOut' }}
                >
                    <ParticleLayer
                        particles={particleVariant}
                        reduced={reduced}
                        glow={glowColor}
                        isDay={isDay}
                        category={category}
                        goldenIntensity={goldenIntensity}
                        moonInfo={moonInfo}
                        rainbowSeed={rainbowSeed}
                    />
                </motion.div>
            </AnimatePresence>

            <GrainOverlay />
            <DepthVeil />
            <Vignette />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/15" />
        </div>
    );
}

export { DynamicSky };
export default DynamicSky;