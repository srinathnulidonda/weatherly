import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Download as DownloadIcon,
    Package,
    Calendar,
    ShieldCheck,
    Smartphone,
    Fingerprint,
    Check,
    Copy,
    AlertCircle,
    ChevronRight,
    Sparkles,
    Lock,
    RefreshCw,
    CloudOff,
    History,
    ArrowRight,
} from 'lucide-react';
import { PageTransition, AnimatedItem } from '@/components/common/PageTransition';
import { Card } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useReleases } from '@/hooks/useReleases';
import { formatDate } from '@/utils/formatters';
import screenshotImage from '@/assets/screenshot-app.png';

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return null;
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
}

const FEATURES = [
    {
        icon: ShieldCheck,
        title: 'Verified builds',
        description: 'Every APK ships with a SHA-256 checksum so you can confirm it hasn\u2019t been tampered with.',
    },
    {
        icon: RefreshCw,
        title: 'Instant updates',
        description: 'New versions install in seconds — no waiting on store review queues.',
    },
    {
        icon: CloudOff,
        title: 'Works offline',
        description: 'Weatherly caches your last known forecast so you\u2019re never left without data.',
    },
    {
        icon: Lock,
        title: 'Privacy first',
        description: 'No trackers or analytics. Location is used only to fetch local weather.',
    },
];

const INSTALL_STEPS = [
    {
        icon: DownloadIcon,
        title: 'Download the APK',
        description: 'Tap "Download APK" below. The file is served securely over HTTPS.',
    },
    {
        icon: ShieldCheck,
        title: 'Allow this source',
        description: 'Android will ask to allow installs from your browser — a one-time permission.',
    },
    {
        icon: Package,
        title: 'Install Weatherly',
        description: 'Open the file and confirm. Let Play Protect finish its scan first.',
    },
    {
        icon: Smartphone,
        title: 'Open & go',
        description: 'You\u2019re ready to check the weather.',
    },
];

function SpecRow({ label, value, last }) {
    return (
        <div
            className={`flex items-center justify-between gap-3 py-3 ${!last ? 'border-b border-stone-200/70 dark:border-white/[0.06]' : ''}`}
        >
            <span className="text-sm text-stone-500 dark:text-stone-400">{label}</span>
            <span className="text-sm font-medium text-stone-800 dark:text-stone-200 text-right">{value}</span>
        </div>
    );
}

function AppScreenshot({ version }) {
    return (
        <div className="relative mx-auto w-[190px] xs:w-[220px] sm:w-[260px]">
            <motion.div
                initial={{ opacity: 0, y: 24, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: -2 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative rounded-[2.5rem] sm:rounded-[2.75rem] border-[5px] sm:border-[6px] border-stone-900 dark:border-stone-800 bg-stone-950 shadow-2xl shadow-stone-900/30 dark:shadow-black/60 overflow-hidden aspect-[9/19.5]"
            >
                <div
                    className="absolute top-0 inset-x-0 h-6 flex items-center justify-center z-20"
                    aria-hidden="true"
                >
                    <div className="w-16 sm:w-20 h-4 sm:h-5 bg-stone-950 rounded-b-2xl" />
                </div>
                <img
                    src={screenshotImage}
                    alt="Weatherly app showing current weather conditions on Android"
                    className="w-full h-full object-cover select-none pointer-events-none"
                    draggable={false}
                    loading="eager"
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -right-3 sm:-right-8 top-6 sm:top-8 glass-elevated px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl flex items-center gap-1.5 animate-icon-float"
            >
                <Sparkles size={11} className="text-orange-500 shrink-0" aria-hidden="true" />
                <span className="text-[10px] sm:text-[11px] font-semibold text-stone-700 dark:text-stone-200 whitespace-nowrap">
                    New in v{version}
                </span>
            </motion.div>

            <div
                className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[65%] h-5 bg-stone-900/15 dark:bg-black/40 blur-xl rounded-full"
                aria-hidden="true"
            />
        </div>
    );
}

function Download() {
    const { data: releases, isLoading, error, refetch } = useReleases();
    const [copied, setCopied] = useState(false);

    const sorted = [...(releases ?? [])].sort((a, b) => {
        const aBuild = Number(a?.build_number) || 0;
        const bBuild = Number(b?.build_number) || 0;
        if (aBuild !== bBuild) return bBuild - aBuild;
        return String(b?.version ?? '').localeCompare(String(a?.version ?? ''));
    });
    const latest = sorted[0];
    const latestSize = latest ? formatBytes(latest.file_size_bytes) : null;

    const copyHash = async () => {
        if (!latest?.sha256) return;
        try {
            await navigator.clipboard.writeText(latest.sha256);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    return (
        <PageTransition className="page-shell stack-y">
            <AnimatedItem>
                <div className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
                    <span>Android</span>
                    <ChevronRight size={11} aria-hidden="true" />
                    <span className="text-stone-600 dark:text-stone-300 font-medium">Download</span>
                </div>
            </AnimatedItem>

            {isLoading ? (
                <SkeletonCard className="h-96" />
            ) : error ? (
                <ErrorState error={error} onRetry={refetch} />
            ) : !latest ? (
                <Card>
                    <div className="py-10 flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-stone-200 to-stone-100 dark:from-white/[0.08] dark:to-white/[0.02] flex items-center justify-center mb-4">
                            <Package size={22} className="text-stone-400" aria-hidden="true" />
                        </div>
                        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                            No release published yet
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm">
                            The latest APK has not been uploaded. Check back soon.
                        </p>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Hero */}
                    <AnimatedItem>
                        <div className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem] border border-stone-200/70 dark:border-white/[0.07] bg-gradient-to-b from-white to-stone-50 dark:from-stone-900/50 dark:to-stone-950">
                            <div
                                className="pointer-events-none absolute -top-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-orange-400/20 blur-[110px]"
                                aria-hidden="true"
                            />
                            <div
                                className="pointer-events-none absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-sky-300/15 blur-[110px]"
                                aria-hidden="true"
                            />

                            <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-10 items-center px-5 py-10 sm:px-10 sm:py-16 lg:py-20">
                                <div className="flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider mb-4 sm:mb-5">
                                        <Sparkles size={11} aria-hidden="true" />
                                        Version {latest.version} available
                                    </span>

                                    <h1 className="text-[2.25rem] leading-[1.08] sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:leading-[1.05]">
                                        Weatherly,
                                        <br />
                                        for Android.
                                    </h1>
                                    <p className="mt-3.5 sm:mt-4 text-sm sm:text-base text-stone-500 dark:text-stone-400 max-w-sm">
                                        Fast, accurate weather — installed directly to your phone in under a
                                        minute.
                                    </p>

                                    <div className="mt-7 sm:mt-8 flex flex-col xs:flex-row items-stretch xs:items-center gap-3 w-full xs:w-auto">
                                        <a
                                            href={latest.apk_url}
                                            rel="noopener noreferrer"
                                            className="btn-primary inline-flex items-center justify-center gap-2 px-7 py-3.5 text-[15px] shadow-xl shadow-orange-500/30 w-full xs:w-auto"
                                        >
                                            <DownloadIcon size={17} aria-hidden="true" />
                                            Download APK
                                        </a>
                                        <Link
                                            to="/apk/releases"
                                            className="btn-ghost inline-flex items-center justify-center gap-1.5 w-full xs:w-auto"
                                        >
                                            Release notes
                                            <ChevronRight size={14} aria-hidden="true" />
                                        </Link>
                                    </div>

                                    <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1.5 text-xs text-stone-400 dark:text-stone-500">
                                        {latestSize && <span>{latestSize}</span>}
                                        {latestSize && <span aria-hidden="true">·</span>}
                                        <span>Android 6.0+</span>
                                        <span aria-hidden="true">·</span>
                                        <span>HTTPS secured</span>
                                        {latest.released_at && (
                                            <>
                                                <span aria-hidden="true">·</span>
                                                <span>{formatDate(latest.released_at, 'MMM d, yyyy')}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="order-1 lg:order-2">
                                    <AppScreenshot version={latest.version} />
                                </div>
                            </div>
                        </div>
                    </AnimatedItem>

                    {/* Features */}
                    <AnimatedItem delay={0.05}>
                        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-px bg-stone-200/70 dark:bg-white/[0.06] rounded-[1.5rem] sm:rounded-[1.75rem] overflow-hidden border border-stone-200/70 dark:border-white/[0.06]">
                            {FEATURES.map((f) => (
                                <div
                                    key={f.title}
                                    className="bg-white dark:bg-stone-950 p-5 sm:p-6 flex flex-col gap-3 hover:bg-stone-50 dark:hover:bg-white/[0.02] transition-colors duration-300"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                        <f.icon size={16} className="text-orange-500" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                            {f.title}
                                        </p>
                                        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mt-1">
                                            {f.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AnimatedItem>

                    {/* What's new */}
                    {Array.isArray(latest.changelog) && latest.changelog.length > 0 && (
                        <AnimatedItem delay={0.1}>
                            <Card padding="sm">
                                <div className="grid sm:grid-cols-[130px,1fr] lg:grid-cols-[150px,1fr] gap-4 sm:gap-8">
                                    <div className="flex sm:flex-col items-baseline sm:items-start gap-2 sm:gap-0">
                                        <p className="label">Version</p>
                                        <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-orange-500 to-amber-400 bg-clip-text text-transparent tracking-tight">
                                            {latest.version}
                                        </p>
                                        <p className="text-xs text-stone-400 dark:text-stone-500 sm:mt-1">
                                            Build {latest.build_number}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="card-heading mb-3">What's new</p>
                                        <ul className="space-y-2.5">
                                            {latest.changelog.map((line, i) => (
                                                <li
                                                    key={i}
                                                    className="flex gap-3 text-sm text-stone-700 dark:text-stone-300 leading-relaxed"
                                                >
                                                    <Check size={15} className="text-orange-500 shrink-0 mt-0.5" aria-hidden="true" />
                                                    <span>{line}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </Card>
                        </AnimatedItem>
                    )}

                    {/* Install steps */}
                    <AnimatedItem delay={0.15}>
                        <div>
                            <p className="label mb-4 px-1">Installation</p>
                            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                                {INSTALL_STEPS.map((step, i) => (
                                    <div key={step.title} className="relative">
                                        <Card padding="sm" className="h-full">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                                                    <step.icon size={16} className="text-orange-500" aria-hidden="true" />
                                                </div>
                                                <span className="text-[11px] font-semibold text-stone-300 dark:text-stone-600 tabular-nums">
                                                    0{i + 1}
                                                </span>
                                            </div>
                                            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                                {step.title}
                                            </p>
                                            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mt-1.5">
                                                {step.description}
                                            </p>
                                        </Card>
                                        {i < INSTALL_STEPS.length - 1 && (
                                            <div
                                                className="hidden lg:block absolute top-9 -right-2.5 w-5 h-px bg-stone-200 dark:bg-white/[0.08]"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </AnimatedItem>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Verify + update */}
                        <div className="stack-y !gap-4">
                            {latest.sha256 && (
                                <AnimatedItem delay={0.2}>
                                    <Card padding="sm">
                                        <p className="card-heading mb-2 flex items-center gap-2">
                                            <Fingerprint size={12} aria-hidden="true" />
                                            Verify your download
                                        </p>
                                        <p className="text-xs text-stone-500 dark:text-stone-400 mb-3 leading-relaxed">
                                            Compare this SHA-256 checksum with the downloaded file to confirm
                                            authenticity.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 min-w-0 truncate text-[11px] sm:text-xs font-mono text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-white/[0.04] rounded-lg px-2.5 py-2">
                                                {latest.sha256}
                                            </code>
                                            <button
                                                type="button"
                                                onClick={copyHash}
                                                className="btn-icon shrink-0"
                                                aria-label="Copy SHA-256"
                                            >
                                                {copied ? (
                                                    <Check size={14} className="text-green-500" aria-hidden="true" />
                                                ) : (
                                                    <Copy size={14} aria-hidden="true" />
                                                )}
                                            </button>
                                        </div>
                                    </Card>
                                </AnimatedItem>
                            )}

                            <AnimatedItem delay={0.25}>
                                <Card padding="sm">
                                    <p className="card-heading mb-3 flex items-center gap-2">
                                        <RefreshCw size={12} aria-hidden="true" />
                                        Updating an existing install
                                    </p>
                                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                                        You don't need to uninstall anything. Installing a newer APK replaces the
                                        current one and keeps your saved locations, theme, and settings intact.
                                        Weatherly also checks for updates automatically from inside the app.
                                    </p>
                                </Card>
                            </AnimatedItem>

                            <AnimatedItem delay={0.3}>
                                <div className="glass-metric p-3.5 flex items-start gap-2.5">
                                    <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                                        Play Protect may show a warning for apps installed outside the Play Store —
                                        this is expected. Choose{' '}
                                        <span className="font-medium text-stone-700 dark:text-stone-300">
                                            "Install anyway"
                                        </span>{' '}
                                        to continue.
                                    </p>
                                </div>
                            </AnimatedItem>
                        </div>

                        {/* Specs */}
                        <AnimatedItem delay={0.2}>
                            <Card padding="sm" className="h-full">
                                <p className="card-heading mb-1">Technical specifications</p>
                                <div>
                                    <SpecRow label="Compatibility" value="Android 6.0 or later" />
                                    <SpecRow label="Architecture" value="arm64-v8a" />
                                    <SpecRow label="Download size" value={latestSize || '—'} />
                                    <SpecRow label="Permissions" value="Location (optional)" />
                                    <SpecRow label="Sign-in" value="Not required" />
                                    <SpecRow label="Distribution" value="Direct APK" last />
                                </div>
                            </Card>
                        </AnimatedItem>
                    </div>

                    {/* Older releases */}
                    {sorted.length > 1 && (
                        <AnimatedItem delay={0.35}>
                            <Link to="/apk/releases" className="group block">
                                <Card
                                    padding="sm"
                                    className="transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5"
                                >
                                    <div className="flex items-center gap-3.5 sm:gap-4">
                                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-stone-100 dark:bg-white/[0.05] flex items-center justify-center shrink-0">
                                            <History size={17} className="text-stone-500 dark:text-stone-400" aria-hidden="true" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                                Release history
                                            </p>
                                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                                {sorted.length} versions available · browse changelogs & older builds
                                            </p>
                                        </div>
                                        <ArrowRight
                                            size={16}
                                            className="text-stone-400 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                                            aria-hidden="true"
                                        />
                                    </div>
                                </Card>
                            </Link>
                        </AnimatedItem>
                    )}
                </>
            )}
        </PageTransition>
    );
}

export default Download;