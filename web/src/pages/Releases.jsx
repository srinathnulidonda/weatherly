// web/src/pages/Releases.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Hash, Package, RefreshCw, Search, ShieldAlert, Tag, X } from 'lucide-react';
import { useReleases } from '@/hooks/useReleases';
import { formatDate } from '@/utils/formatters';
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

function releaseId(release) {
    return `v${release.version}-b${release.build_number}`;
}

function Breadcrumb() {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12.5px] text-stone-400 dark:text-stone-500 mb-5">
            <span>Android</span>
            <ChevronRight size={13} aria-hidden="true" />
            <Link to="/apk" className="hover:text-stone-700 dark:hover:text-stone-300">
                Download
            </Link>
            <ChevronRight size={13} aria-hidden="true" />
            <span className="text-stone-700 dark:text-stone-300 font-medium">Releases</span>
        </nav>
    );
}

function VersionBadge({ version, isLatest }) {
    const major = String(version).split('.').slice(0, 2).join('.');
    return (
        <div
            className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-[12px] font-bold text-white tabular-nums ${isLatest
                ? 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_6px_16px_-4px_rgba(249,115,22,0.5)]'
                : 'bg-gradient-to-br from-stone-400 to-stone-600 dark:from-stone-600 dark:to-stone-800'
                }`}
        >
            {major}
        </div>
    );
}

function ReleaseRow({ release, isLatest }) {
    const [expanded, setExpanded] = useState(false);
    const changelog = release.changelog ?? [];
    const releaseDate = release.released_at ?? null;
    const sizeBytes = release.file_size_bytes ?? null;
    const visibleLines = expanded ? changelog : changelog.slice(0, 4);
    const hasMore = changelog.length > 4;

    return (
        <div
            id={releaseId(release)}
            className={`relative rounded-3xl border bg-white dark:bg-white/[0.02] p-5 sm:p-6 lg:p-7 scroll-mt-28 ${isLatest
                ? 'border-orange-300/50 dark:border-orange-500/25 ring-1 ring-orange-400/20'
                : 'border-stone-200/70 dark:border-white/[0.08]'
                }`}
        >
            <span
                className={`hidden lg:flex absolute -left-[45px] top-9 w-3 h-3 rounded-full ring-4 ring-white dark:ring-stone-950 ${isLatest ? 'bg-orange-500' : 'bg-stone-300 dark:bg-stone-700'
                    }`}
                aria-hidden="true"
            />

            <div className="grid gap-5 lg:grid-cols-[200px_1fr] lg:gap-8">
                <div className="min-w-0">
                    <div className="flex items-center gap-3">
                        <VersionBadge version={release.version} isLatest={isLatest} />
                        <div className="min-w-0">
                            <h3 className="text-[15px] font-bold text-stone-900 dark:text-stone-50 truncate">
                                Version {release.version}
                            </h3>
                            {isLatest && (
                                <span className="inline-flex items-center rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10.5px] font-bold px-2 py-0.5 mt-1">
                                    Latest
                                </span>
                            )}
                        </div>
                    </div>

                    <p className="text-[12px] text-stone-400 dark:text-stone-500 mt-3 leading-relaxed">
                        Build #{release.build_number ?? '—'} · {releaseDate ? formatDate(releaseDate) : '—'} ·{' '}
                        {formatBytes(sizeBytes)}
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                        <DownloadButton
                            url={release.apk_url}
                            filename={`weatherly-v${release.version}.apk`}
                            label="Download"
                            variant={isLatest ? 'primary' : 'outline'}
                            size="sm"
                            className="flex-1 lg:flex-none"
                        />
                        <CopyLinkButton
                            url={release.apk_url}
                            className="w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-2xl border border-stone-200 dark:border-white/[0.12] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 hover:bg-stone-50 dark:hover:bg-white/[0.06] transition-colors"
                        />
                    </div>
                </div>

                <div className="min-w-0 pt-4 mt-1 border-t border-stone-100 dark:border-white/[0.06] lg:pt-1 lg:mt-0 lg:border-0">
                    {changelog.length > 0 ? (
                        <>
                            <ul className="space-y-1.5">
                                {visibleLines.map((item, i) => (
                                    <li
                                        key={i}
                                        className="flex gap-2.5 text-[13px] sm:text-[13.5px] text-stone-600 dark:text-stone-300 leading-relaxed break-words"
                                    >
                                        <span className="mt-[7px] w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600 shrink-0" aria-hidden="true" />
                                        <span className="min-w-0">{item}</span>
                                    </li>
                                ))}
                            </ul>
                            {hasMore && (
                                <button
                                    type="button"
                                    onClick={() => setExpanded((v) => !v)}
                                    className="mt-2.5 text-[12.5px] font-semibold text-orange-600 dark:text-orange-400 hover:underline underline-offset-2"
                                >
                                    {expanded ? 'Show less' : `Show ${changelog.length - 4} more`}
                                </button>
                            )}
                        </>
                    ) : (
                        <p className="text-[13px] text-stone-400 dark:text-stone-500 italic">No changelog provided.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="space-y-4 animate-pulse">
            {[0, 1, 2].map((i) => (
                <div key={i} className="h-48 rounded-3xl bg-stone-100 dark:bg-white/[0.04]" />
            ))}
        </div>
    );
}

function ErrorCard({ message, onRetry }) {
    return (
        <div className="rounded-3xl border border-red-200/60 dark:border-red-500/20 bg-red-50/60 dark:bg-red-500/[0.06] p-8 text-center">
            <ShieldAlert size={28} className="mx-auto mb-3 text-red-500" aria-hidden="true" />
            <p className="text-[14.5px] font-semibold text-stone-900 dark:text-stone-50 mb-1">Couldn't load releases</p>
            <p className="text-[13px] text-stone-500 dark:text-stone-400 mb-4">{message || 'Something went wrong.'}</p>
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

function Releases() {
    const { data: releases = [], isLoading, error, refetch } = useReleases();
    const [query, setQuery] = useState('');
    const [activeId, setActiveId] = useState(null);
    const sectionRefs = useRef(new Map());
    const headerRef = useRef(null);
    const [pastHeader, setPastHeader] = useState(false);

    const sorted = useMemo(
        () => [...releases].sort((a, b) => (b.build_number ?? 0) - (a.build_number ?? 0)),
        [releases]
    );
    const latest = sorted[0] ?? null;
    const isSearching = query.trim().length > 0;

    const filtered = useMemo(() => {
        if (!isSearching) return sorted;
        const q = query.trim().toLowerCase();
        return sorted.filter(
            (r) => String(r.version).toLowerCase().includes(q) || String(r.build_number ?? '').includes(q)
        );
    }, [sorted, query, isSearching]);

    const activeRelease = useMemo(() => {
        if (isSearching) return null;
        return sorted.find((r) => releaseId(r) === activeId) || latest;
    }, [sorted, activeId, latest, isSearching]);

    useEffect(() => {
        if (!sorted.length || isSearching) return undefined;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.find((e) => e.isIntersecting);
                if (visible) setActiveId(visible.target.id);
            },
            { rootMargin: '-20% 0px -65% 0px', threshold: 0 }
        );
        sectionRefs.current.forEach((node) => node && observer.observe(node));
        return () => observer.disconnect();
    }, [sorted, isSearching]);

    useEffect(() => {
        const node = headerRef.current;
        if (!node || !latest) return undefined;
        const observer = new IntersectionObserver(
            ([entry]) => setPastHeader(!entry.isIntersecting),
            { rootMargin: '-64px 0px 0px 0px', threshold: 0 }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [latest]);

    const showNav = !isSearching && sorted.length > 1;
    const showStickyBar = pastHeader && !isSearching && !!activeRelease;
    const latestDate = latest?.released_at ?? null;
    const latestSize = latest?.file_size_bytes ?? null;

    const jumpTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12 pb-36 md:pb-16">
            <Breadcrumb />

            <div className="mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-[22px] sm:text-[26px] font-bold text-stone-900 dark:text-stone-50 tracking-tight">
                        Release notes
                    </h1>
                    {sorted.length > 0 && (
                        <span className="inline-flex items-center rounded-full bg-stone-900/5 dark:bg-white/10 text-stone-500 dark:text-stone-400 text-[11.5px] font-semibold px-2.5 py-0.5 tabular-nums">
                            {sorted.length} version{sorted.length === 1 ? '' : 's'}
                        </span>
                    )}
                </div>
                <p className="text-[13.5px] text-stone-500 dark:text-stone-400 mt-1.5 max-w-prose">
                    Every Weatherly build, with full changelogs and direct APK downloads.
                </p>
            </div>

            {isLoading && <LoadingState />}
            {!isLoading && error && <ErrorCard message={error.message} onRetry={refetch} />}

            {!isLoading && !error && sorted.length === 0 && (
                <div className="rounded-3xl border border-stone-200 dark:border-white/[0.08] p-10 text-center">
                    <Package size={28} className="mx-auto mb-3 text-stone-300 dark:text-stone-600" aria-hidden="true" />
                    <p className="text-[14.5px] font-semibold text-stone-900 dark:text-stone-50">No releases yet</p>
                </div>
            )}

            {!isLoading && !error && latest && (
                <>
                    <div ref={headerRef}>
                        <InfoStrip
                            className="mb-6"
                            items={[
                                { icon: Tag, value: `v${latest.version}`, label: 'Latest' },
                                { icon: Hash, value: latest.build_number ?? '—', label: 'Build' },
                                { icon: Package, value: formatBytes(latestSize), label: 'Size' },
                                { icon: Calendar, value: latestDate ? formatDate(latestDate) : '—', label: 'Released' },
                            ]}
                        />

                        <div className="relative mb-5">
                            <Search
                                size={15}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                                aria-hidden="true"
                            />
                            <input
                                type="search"
                                inputMode="search"
                                enterKeyHint="search"
                                autoComplete="off"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by version or build number"
                                className="w-full rounded-2xl border border-stone-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.02] pl-10 pr-10 py-2.5 text-[13.5px] text-stone-900 dark:text-stone-50 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 [&::-webkit-search-cancel-button]:appearance-none"
                            />
                            {isSearching && (
                                <button
                                    type="button"
                                    onClick={() => setQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                                    aria-label="Clear search"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>
                    </div>

                    {isSearching && (
                        <p className="text-[12.5px] text-stone-400 dark:text-stone-500 mb-4 px-1">
                            {filtered.length} result{filtered.length === 1 ? '' : 's'} for "{query.trim()}"
                        </p>
                    )}

                    {showNav && (
                        <div className="lg:hidden -mx-4 px-4 mb-2 relative">
                            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mask-fade-x">
                                {sorted.map((r) => {
                                    const id = releaseId(r);
                                    const active = activeId === id;
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => jumpTo(id)}
                                            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${active
                                                ? 'border-orange-400 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                                : 'border-stone-200 dark:border-white/[0.1] text-stone-500 dark:text-stone-400'
                                                }`}
                                        >
                                            v{r.version}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className={showNav ? 'lg:grid lg:grid-cols-[200px_1fr] lg:gap-10' : ''}>
                        {showNav && (
                            <aside className="hidden lg:block">
                                <div className="sticky top-24 space-y-1">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2 px-1">
                                        Jump to version
                                    </p>
                                    {sorted.map((r) => {
                                        const id = releaseId(r);
                                        const active = activeId === id;
                                        return (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => jumpTo(id)}
                                                className={`block w-full text-left rounded-xl px-3 py-1.5 text-[13px] font-medium transition-colors ${active
                                                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/[0.05]'
                                                    }`}
                                            >
                                                v{r.version}
                                            </button>
                                        );
                                    })}
                                </div>
                            </aside>
                        )}

                        <div
                            className={
                                showNav
                                    ? 'space-y-4 lg:border-l lg:border-stone-200/70 dark:lg:border-white/[0.07] lg:pl-10'
                                    : 'space-y-4'
                            }
                        >
                            {filtered.map((release) => (
                                <div
                                    key={releaseId(release)}
                                    ref={(node) => {
                                        if (node) sectionRefs.current.set(releaseId(release), node);
                                        else sectionRefs.current.delete(releaseId(release));
                                    }}
                                >
                                    <ReleaseRow release={release} isLatest={releaseId(release) === releaseId(latest)} />
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div className="rounded-3xl border border-dashed border-stone-200 dark:border-white/[0.1] py-14 text-center">
                                    <Search size={22} className="mx-auto mb-3 text-stone-300 dark:text-stone-600" aria-hidden="true" />
                                    <p className="text-[13.5px] text-stone-400 dark:text-stone-500">
                                        No releases match "{query.trim()}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <StickyInstallBar
                        show={showStickyBar}
                        version={activeRelease?.version}
                        subtitle={`${formatBytes(activeRelease?.file_size_bytes)} · Build ${activeRelease?.build_number ?? '—'}`}
                        badge={activeRelease && activeRelease === latest ? 'Latest' : null}
                        url={activeRelease?.apk_url}
                        filename={activeRelease ? `weatherly-v${activeRelease.version}.apk` : undefined}
                    />
                </>
            )}
        </div>
    );
}

export default Releases;