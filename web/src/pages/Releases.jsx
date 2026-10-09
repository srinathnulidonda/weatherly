import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Download as DownloadIcon,
    Package,
    Calendar,
    ChevronRight,
    ChevronDown,
    Tag,
    Sparkles,
    Search,
    Check,
    Link as LinkIcon,
    X,
    Clock,
    Hash,
} from 'lucide-react';
import { PageTransition, AnimatedItem } from '@/components/common/PageTransition';
import { Card } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useReleases } from '@/hooks/useReleases';
import { formatDate } from '@/utils/formatters';
import { cn } from '@/lib/cn';

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return null;
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
}

function releaseId(release) {
    return `v${release.version}-b${release.build_number}`;
}

function StatBlock({ icon: Icon, label, value }) {
    return (
        <div className="glass-metric p-2.5 xs:p-3 sm:p-4 flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <Icon size={13} className="text-orange-500" aria-hidden="true" />
            </div>
            <div className="min-w-0">
                <p className="text-[8.5px] xs:text-[9px] sm:text-[10px] uppercase tracking-wider text-stone-400 dark:text-stone-500 font-semibold truncate">
                    {label}
                </p>
                <p className="text-xs xs:text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">
                    {value}
                </p>
            </div>
        </div>
    );
}

function CopyLinkButton({ url }) {
    const [copied, setCopied] = useState(false);
    const copy = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(new URL(url, window.location.origin).toString());
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    };
    return (
        <button type="button" onClick={copy} className="btn-icon shrink-0" aria-label="Copy download link">
            {copied ? <Check size={14} className="text-green-500" aria-hidden="true" /> : <LinkIcon size={14} aria-hidden="true" />}
        </button>
    );
}

function ReleaseRow({ release, isLatest, isLast }) {
    const sizeLabel = formatBytes(release.file_size_bytes);
    const changelog = Array.isArray(release.changelog) ? release.changelog : [];
    const LIMIT = 4;
    const [expanded, setExpanded] = useState(false);
    const showToggle = changelog.length > LIMIT;
    const visibleLines = expanded ? changelog : changelog.slice(0, LIMIT);
    const id = releaseId(release);

    return (
        <div
            id={id}
            style={{ scrollMarginTop: 'calc(var(--topbar-h) + 20px)' }}
            className={cn(
                'px-4 sm:px-6 lg:px-7 py-5 sm:py-6 lg:py-7 transition-colors',
                !isLast && 'border-b border-stone-100 dark:border-white/[0.06]'
            )}
        >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3.5 sm:gap-4">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
                            {release.version}
                        </h3>
                        {isLatest && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-semibold uppercase tracking-wider">
                                <Sparkles size={9} aria-hidden="true" />
                                Latest
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-stone-500 dark:text-stone-400">
                        <span className="flex items-center gap-1.5">
                            <Hash size={11} aria-hidden="true" />
                            Build {release.build_number}
                        </span>
                        {release.released_at && (
                            <span className="flex items-center gap-1.5">
                                <Calendar size={11} aria-hidden="true" />
                                {formatDate(release.released_at, 'MMM d, yyyy')}
                            </span>
                        )}
                        {sizeLabel && (
                            <span className="flex items-center gap-1.5">
                                <Package size={11} aria-hidden="true" />
                                {sizeLabel}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <a
                        href={release.apk_url}
                        rel="noopener noreferrer"
                        className={cn(
                            isLatest ? 'btn-primary' : 'btn-outline',
                            'inline-flex items-center justify-center gap-1.5 !px-4 !py-2 text-xs sm:text-sm flex-1 sm:flex-none'
                        )}
                    >
                        <DownloadIcon size={13} aria-hidden="true" />
                        Download
                    </a>
                    <CopyLinkButton url={release.apk_url} />
                </div>
            </div>

            {changelog.length > 0 && (
                <div className="mt-4">
                    <ul className="space-y-2">
                        {visibleLines.map((line, i) => (
                            <li key={i} className="flex gap-2.5 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                                <span className="mt-[7px] w-1 h-1 rounded-full bg-orange-500 shrink-0" aria-hidden="true" />
                                <span>{line}</span>
                            </li>
                        ))}
                    </ul>
                    {showToggle && (
                        <button
                            type="button"
                            onClick={() => setExpanded((v) => !v)}
                            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                        >
                            {expanded ? 'Show less' : `Show ${changelog.length - LIMIT} more`}
                            <ChevronDown
                                size={12}
                                className={cn('transition-transform duration-200', expanded && 'rotate-180')}
                                aria-hidden="true"
                            />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function Releases() {
    const { data: releases, isLoading, error, refetch } = useReleases();
    const [query, setQuery] = useState('');
    const [activeId, setActiveId] = useState(null);

    const sorted = useMemo(
        () =>
            [...(releases ?? [])].sort((a, b) => {
                const aBuild = Number(a?.build_number) || 0;
                const bBuild = Number(b?.build_number) || 0;
                if (aBuild !== bBuild) return bBuild - aBuild;
                return String(b?.version ?? '').localeCompare(String(a?.version ?? ''));
            }),
        [releases]
    );
    const latest = sorted[0];
    const latestBuild = latest?.build_number;
    const hasSidebar = sorted.length > 2;

    const filtered = useMemo(() => {
        if (!query.trim()) return sorted;
        const q = query.trim().toLowerCase();
        return sorted.filter(
            (r) => String(r.version).toLowerCase().includes(q) || String(r.build_number).includes(q)
        );
    }, [sorted, query]);

    useEffect(() => {
        if (!filtered.length) return undefined;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActiveId(visible[0].target.id);
            },
            { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
        );
        filtered.forEach((r) => {
            const el = document.getElementById(releaseId(r));
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [filtered]);

    return (
        <PageTransition className="page-shell stack-y">
            <AnimatedItem>
                <div className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500 flex-wrap">
                    <Link to="/apk" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
                        Android
                    </Link>
                    <ChevronRight size={11} aria-hidden="true" />
                    <Link to="/apk" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
                        Download
                    </Link>
                    <ChevronRight size={11} aria-hidden="true" />
                    <span className="text-stone-600 dark:text-stone-300 font-medium">Releases</span>
                </div>
            </AnimatedItem>

            <AnimatedItem delay={0.02}>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="page-heading">Release history</h1>
                        {sorted.length > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stone-100 dark:bg-white/[0.06] text-stone-500 dark:text-stone-400 text-[10px] font-semibold uppercase tracking-wider">
                                {sorted.length} {sorted.length === 1 ? 'version' : 'versions'}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-stone-500 dark:text-stone-400 max-w-2xl">
                        Every published Weatherly Android build, newest first. Installing any version replaces the
                        current install — your saved locations and settings stay intact.
                    </p>
                </div>
            </AnimatedItem>

            {isLoading ? (
                <div className="stack-y">
                    <SkeletonCard className="h-24" />
                    <SkeletonCard className="h-64" />
                </div>
            ) : error ? (
                <ErrorState error={error} onRetry={refetch} />
            ) : sorted.length === 0 ? (
                <Card padding="sm">
                    <div className="py-10 flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-stone-200 to-stone-100 dark:from-white/[0.08] dark:to-white/[0.02] flex items-center justify-center mb-4">
                            <Tag size={22} className="text-stone-400" aria-hidden="true" />
                        </div>
                        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                            No releases published yet
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm">
                            Once an APK is uploaded to <code className="font-mono">/apk/releases/</code> and added to
                            the manifest, it will appear here.
                        </p>
                        <Link to="/apk" className="btn-outline mt-4 inline-flex items-center gap-2">
                            Back to download
                        </Link>
                    </div>
                </Card>
            ) : (
                <>
                    <AnimatedItem delay={0.05}>
                        <div className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-4">
                            <StatBlock icon={Tag} label="Latest version" value={latest.version} />
                            <StatBlock icon={Hash} label="Latest build" value={latest.build_number} />
                            <StatBlock
                                icon={Clock}
                                label="Released"
                                value={latest.released_at ? formatDate(latest.released_at, 'MMM d') : '—'}
                            />
                        </div>
                    </AnimatedItem>

                    <div
                        className={cn(
                            'grid gap-6 lg:gap-10 items-start',
                            hasSidebar && 'lg:grid-cols-[200px_1fr]'
                        )}
                    >
                        {/* Sticky sidebar must NOT be a descendant of a motion/transformed element,
                            otherwise `position: sticky` breaks (transform creates a new containing block). */}
                        {hasSidebar && (
                            <div className="hidden lg:block lg:sticky lg:top-24 self-start">
                                <AnimatedItem delay={0.08}>
                                    <p className="label mb-3 px-1">Jump to version</p>
                                    <nav className="space-y-0.5 max-h-[60vh] overflow-y-auto scrollbar-hide pr-2">
                                        {sorted.map((r) => {
                                            const id = releaseId(r);
                                            const active = activeId === id;
                                            return (
                                                <a
                                                    key={id}
                                                    href={`#${id}`}
                                                    className={cn(
                                                        'flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                                        active
                                                            ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                                            : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/[0.04] hover:text-stone-800 dark:hover:text-stone-200'
                                                    )}
                                                >
                                                    <span className="truncate">{r.version}</span>
                                                    {r.build_number === latestBuild && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" aria-hidden="true" />
                                                    )}
                                                </a>
                                            );
                                        })}
                                    </nav>
                                </AnimatedItem>
                            </div>
                        )}

                        <div className="min-w-0">
                            {hasSidebar && (
                                <div className="lg:hidden -mx-1 mb-4 overflow-x-auto scrollbar-hide">
                                    <div className="flex items-center gap-2 px-1 pb-1">
                                        {sorted.map((r) => (
                                            <a
                                                key={releaseId(r)}
                                                href={`#${releaseId(r)}`}
                                                className="shrink-0 px-3 py-1.5 rounded-full border border-stone-200 dark:border-white/[0.08] text-xs font-medium text-stone-600 dark:text-stone-300 whitespace-nowrap active:scale-95 transition-transform"
                                            >
                                                {r.version}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <AnimatedItem delay={0.05}>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                                    <div className="relative flex-1 min-w-0">
                                        <Search
                                            size={14}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500"
                                            aria-hidden="true"
                                        />
                                        <input
                                            type="text"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Search version or build…"
                                            className="w-full h-11 sm:h-10 pl-9 pr-9 rounded-full border border-stone-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-sm text-stone-700 dark:text-stone-300 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-orange-400/60 dark:focus:border-orange-400/40 transition-colors"
                                        />
                                        {query && (
                                            <button
                                                type="button"
                                                onClick={() => setQuery('')}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/[0.08] transition-colors"
                                                aria-label="Clear search"
                                            >
                                                <X size={12} aria-hidden="true" />
                                            </button>
                                        )}
                                    </div>
                                    <a
                                        href={latest.apk_url}
                                        rel="noopener noreferrer"
                                        className="btn-primary inline-flex items-center justify-center gap-2 !px-4 !py-2.5 text-sm w-full sm:w-auto shrink-0"
                                    >
                                        <DownloadIcon size={14} aria-hidden="true" />
                                        Latest ({latest.version})
                                    </a>
                                </div>
                            </AnimatedItem>

                            {filtered.length === 0 ? (
                                <Card padding="sm">
                                    <div className="py-8 flex flex-col items-center text-center">
                                        <Search size={18} className="text-stone-400 mb-2" aria-hidden="true" />
                                        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                                            No matches found
                                        </p>
                                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                                            Try a different version or build number.
                                        </p>
                                    </div>
                                </Card>
                            ) : (
                                <AnimatedItem delay={0.1}>
                                    <Card padding={false} className="overflow-hidden">
                                        {filtered.map((release, i) => (
                                            <ReleaseRow
                                                key={releaseId(release)}
                                                release={release}
                                                isLatest={release.build_number === latestBuild && latestBuild != null}
                                                isLast={i === filtered.length - 1}
                                            />
                                        ))}
                                    </Card>
                                </AnimatedItem>
                            )}
                        </div>
                    </div>
                </>
            )}
        </PageTransition>
    );
}

export default Releases;