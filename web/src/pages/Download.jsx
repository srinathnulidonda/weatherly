// web/src/pages/Download.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ChevronRight,
    CloudOff,
    Lock,
    RefreshCw,
    ShieldCheck,
    Smartphone,
    Tag,
    Package,
    Calendar,
    ShieldAlert,
    FileCode2,
    Copy,
    Check,
} from 'lucide-react';
import { useReleases } from '@/hooks/useReleases';
import { formatDate } from '@/utils/formatters';
import { cn } from '@/lib/cn';
import { AppIcon } from '@/components/download/AppIcon';
import { InfoStrip } from '@/components/download/InfoStrip';
import { CopyLinkButton } from '@/components/download/CopyLinkButton';
import { DownloadButton } from '@/components/download/DownloadButton';
import { StickyInstallBar } from '@/components/download/StickyInstallBar';

function formatBytes(bytes) {
    const n = Number(bytes);
    if (!n && n !== 0) return '—';
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)} KB`;
    return `${n} B`;
}

const FEATURES = [
    { icon: ShieldCheck, title: 'Verified builds', desc: 'Every release is signed and checksum-verified.' },
    { icon: RefreshCw, title: 'Instant updates', desc: 'Lightweight APKs that install in seconds.' },
    { icon: CloudOff, title: 'Works offline', desc: 'Cached forecasts even without a connection.' },
    { icon: Lock, title: 'Privacy first', desc: 'No trackers, no ads, no data resale.' },
];

function Breadcrumb() {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12.5px] text-stone-400 dark:text-stone-500 mb-5">
            <span>Android</span>
            <ChevronRight size={13} aria-hidden="true" />
            <span className="text-stone-700 dark:text-stone-300 font-medium">Download</span>
        </nav>
    );
}

function SpecRow({ label, value, mono = false, copyable = false }) {
    const [copied, setCopied] = useState(false);
    const isLongValue = typeof value === 'string' && value.length > 20;

    const handleCopy = async () => {
        if (!copyable || typeof value !== 'string' || value === '—') return;
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div
            className={cn(
                'py-2.5 border-b border-stone-100 dark:border-white/[0.06] last:border-0 gap-1.5',
                isLongValue ? 'flex flex-col items-start' : 'flex items-center justify-between gap-4'
            )}
        >
            <span className="text-[13px] text-stone-500 dark:text-stone-400 shrink-0">{label}</span>
            {copyable ? (
                <button
                    type="button"
                    onClick={handleCopy}
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-md text-stone-900 dark:text-stone-100 font-medium transition-colors',
                        'hover:text-orange-600 dark:hover:text-orange-400 active:scale-[0.98]',
                        mono && 'font-mono text-[11px] sm:text-[11.5px]',
                        isLongValue ? 'text-left break-all w-full' : 'text-[13px] text-right truncate max-w-[60%]'
                    )}
                    title={typeof value === 'string' ? value : undefined}
                    aria-label={`Copy ${label}`}
                >
                    <span className={isLongValue ? 'break-all' : 'truncate'}>{value}</span>
                    {copied ? (
                        <Check size={12} className="text-green-500 shrink-0" aria-hidden="true" />
                    ) : (
                        <Copy size={12} className="text-stone-400 shrink-0" aria-hidden="true" />
                    )}
                </button>
            ) : (
                <span
                    className={cn(
                        'text-[13px] text-stone-900 dark:text-stone-100 font-medium',
                        mono && 'font-mono text-[11.5px]',
                        isLongValue ? 'text-left break-all w-full' : 'text-right truncate max-w-[60%]'
                    )}
                    title={typeof value === 'string' ? value : undefined}
                >
                    {value}
                </span>
            )}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-48 rounded-3xl bg-stone-100 dark:bg-white/[0.04]" />
            <div className="grid lg:grid-cols-[1fr_340px] gap-6 lg:gap-8">
                <div className="h-72 rounded-3xl bg-stone-100 dark:bg-white/[0.04]" />
                <div className="h-56 rounded-3xl bg-stone-100 dark:bg-white/[0.04]" />
            </div>
        </div>
    );
}

function ErrorCard({ message, onRetry }) {
    return (
        <div className="rounded-3xl border border-red-200/60 dark:border-red-500/20 bg-red-50/60 dark:bg-red-500/[0.06] p-8 text-center">
            <ShieldAlert size={28} className="mx-auto mb-3 text-red-500" aria-hidden="true" />
            <p className="text-[14.5px] font-semibold text-stone-900 dark:text-stone-50 mb-1">Couldn't load the latest build</p>
            <p className="text-[13px] text-stone-500 dark:text-stone-400 mb-4">{message || 'Something went wrong. Please try again.'}</p>
            <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 dark:border-white/[0.12] px-4 py-2 text-[13px] font-semibold hover:bg-white dark:hover:bg-white/[0.06] transition-colors"
            >
                <RefreshCw size={14} aria-hidden="true" />
                Try again
            </button>
        </div>
    );
}

function Download() {
    const { data: releases = [], isLoading, error, refetch } = useReleases();

    const sorted = useMemo(
        () => [...releases].sort((a, b) => (b.build_number ?? 0) - (a.build_number ?? 0)),
        [releases]
    );
    const latest = sorted[0] ?? null;

    const releaseDate = latest?.released_at ?? null;
    const sizeBytes = latest?.file_size_bytes ?? null;
    const changelog = latest?.changelog ?? [];

    const ctaRef = useRef(null);
    const [showSticky, setShowSticky] = useState(false);

    useEffect(() => {
        const node = ctaRef.current;
        if (!node || !latest) return undefined;
        const observer = new IntersectionObserver(
            ([entry]) => setShowSticky(!entry.isIntersecting),
            { rootMargin: '-64px 0px 0px 0px', threshold: 0 }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [latest]);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12 pb-36 md:pb-16">
            <Breadcrumb />

            {isLoading && <LoadingState />}

            {!isLoading && error && <ErrorCard message={error.message} onRetry={refetch} />}

            {!isLoading && !error && !latest && (
                <div className="rounded-3xl border border-stone-200 dark:border-white/[0.08] p-10 text-center">
                    <Package size={28} className="mx-auto mb-3 text-stone-300 dark:text-stone-600" aria-hidden="true" />
                    <p className="text-[14.5px] font-semibold text-stone-900 dark:text-stone-50">No release available yet</p>
                    <p className="text-[13px] text-stone-500 dark:text-stone-400 mt-1">Check back soon for the first build.</p>
                </div>
            )}

            {!isLoading && !error && latest && (
                <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                    <section className="rounded-3xl border border-stone-200/70 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-5 sm:p-8 lg:p-10 shadow-[0_1px_0_0_rgba(0,0,0,0.02)]">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <AppIcon size={64} className="sm:!w-[76px] sm:!h-[76px]" />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="text-[18px] xs:text-[19px] sm:text-[22px] font-bold text-stone-900 dark:text-stone-50 tracking-tight">
                                            Weatherly
                                        </h1>
                                        <span className="inline-flex items-center rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[11px] font-bold px-2.5 py-0.5 tabular-nums">
                                            v{latest.version}
                                        </span>
                                    </div>
                                    <p className="text-[13px] sm:text-[13.5px] text-stone-500 dark:text-stone-400 mt-0.5">
                                        Weather, forecasts &amp; alerts
                                    </p>
                                </div>
                            </div>

                            <div ref={ctaRef} className="flex items-center gap-2 sm:shrink-0">
                                <DownloadButton
                                    url={latest.apk_url}
                                    filename={`weatherly-v${latest.version}.apk`}
                                    label="Install"
                                    className="flex-1 sm:min-w-[170px]"
                                />
                                <CopyLinkButton
                                    url={latest.apk_url}
                                    className="w-11 h-11 shrink-0 inline-flex items-center justify-center rounded-2xl border border-stone-200 dark:border-white/[0.12] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 hover:bg-stone-50 dark:hover:bg-white/[0.06] transition-colors"
                                />
                            </div>
                        </div>

                        <InfoStrip
                            className="mt-6"
                            items={[
                                { icon: Tag, value: `v${latest.version}`, label: 'Version' },
                                { icon: Package, value: formatBytes(sizeBytes), label: 'Size' },
                                { icon: Smartphone, value: '6.0+', label: 'Android' },
                                { icon: Calendar, value: releaseDate ? formatDate(releaseDate) : '—', label: 'Updated' },
                            ]}
                        />

                        <Link
                            to="/apk/releases"
                            className="mt-4 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-orange-600 dark:text-orange-400 hover:underline underline-offset-2"
                        >
                            View release notes
                            <ChevronRight size={14} aria-hidden="true" />
                        </Link>
                    </section>

                    <div className="grid lg:grid-cols-[1fr_340px] gap-6 lg:gap-8 items-start">
                        <div className="space-y-6 lg:space-y-8 min-w-0">
                            <section>
                                <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3 px-1">
                                    Why Weatherly
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {FEATURES.map((f) => (
                                        <div
                                            key={f.title}
                                            className="rounded-2xl border border-stone-200/70 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-3.5 sm:p-4"
                                        >
                                            <f.icon size={18} className="text-orange-500 mb-2" aria-hidden="true" />
                                            <p className="text-[13px] sm:text-[13.5px] font-semibold text-stone-900 dark:text-stone-50">{f.title}</p>
                                            <p className="text-[11.5px] sm:text-[12px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">{f.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {changelog.length > 0 && (
                                <section className="rounded-3xl border border-stone-200/70 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-5 sm:p-7">
                                    <h2 className="text-[14.5px] font-bold text-stone-900 dark:text-stone-50 mb-3">
                                        What's new in v{latest.version}
                                    </h2>
                                    <ul className="space-y-2">
                                        {changelog.map((item, i) => (
                                            <li key={i} className="flex gap-2.5 text-[13.5px] text-stone-600 dark:text-stone-300 leading-relaxed break-words">
                                                <span className="mt-[7px] w-1 h-1 rounded-full bg-orange-500 shrink-0" aria-hidden="true" />
                                                <span className="min-w-0">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </div>

                        <aside className="space-y-6 lg:sticky lg:top-24">
                            <div className="rounded-3xl border border-stone-200/70 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-5 sm:p-6">
                                <h2 className="text-[14.5px] font-bold text-stone-900 dark:text-stone-50 mb-3 flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-orange-500" aria-hidden="true" />
                                    Verified &amp; protected
                                </h2>
                                <p className="text-[13px] text-stone-500 dark:text-stone-400 leading-relaxed">
                                    This build is checksum-verified and scanned by Google Play Protect on install.
                                    Always download Weatherly from this page to ensure authenticity.
                                </p>
                            </div>

                            <div className="rounded-3xl border border-stone-200/70 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-5 sm:p-6">
                                <h2 className="text-[14.5px] font-bold text-stone-900 dark:text-stone-50 mb-1">
                                    Technical specifications
                                </h2>
                                <div className="mt-2">
                                    <SpecRow label="Package" value="com.sn.weatherly" mono copyable />
                                    <SpecRow label="Min Android" value="6.0 (Marshmallow)" />
                                    <SpecRow label="Architecture" value="Universal (arm64 / armeabi)" />
                                    <SpecRow label="Build" value={latest.build_number ?? '—'} />
                                    <SpecRow label="SHA-256" value={latest.sha256 ?? '—'} mono copyable={!!latest.sha256} />
                                </div>
                            </div>

                            <Link
                                to="/apk/releases"
                                className="flex items-center justify-between rounded-2xl border border-stone-200/70 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] px-5 py-4 hover:border-orange-300 dark:hover:border-orange-500/30 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <FileCode2 size={18} className="text-stone-400 dark:text-stone-500" aria-hidden="true" />
                                    <span className="text-[13.5px] font-semibold text-stone-900 dark:text-stone-50">
                                        Browse older releases
                                    </span>
                                </div>
                                <ChevronRight
                                    size={16}
                                    className="text-stone-400 group-hover:translate-x-0.5 transition-transform"
                                    aria-hidden="true"
                                />
                            </Link>
                        </aside>
                    </div>
                </div>
            )}

            {latest && (
                <StickyInstallBar
                    show={showSticky}
                    version={latest.version}
                    subtitle={`${formatBytes(sizeBytes)} · Build ${latest.build_number ?? '—'}`}
                    url={latest.apk_url}
                    filename={`weatherly-v${latest.version}.apk`}
                />
            )}
        </div>
    );
}

export default Download;