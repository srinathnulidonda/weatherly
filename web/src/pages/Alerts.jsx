// web/src/pages/Alerts.jsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, MapPin, ChevronDown, ChevronUp, AlertTriangle, Clock, Info } from 'lucide-react';
import { PageTransition } from '@/components/common/PageTransition';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StateScreen } from '@/components/ui/StateScreen';
import { RefreshControl } from '@/components/common/RefreshControl';
import { AlertRadiusMap } from '@/components/alerts/AlertRadiusMap';
import { useAlerts, useAlertStats } from '@/hooks/useAlerts';
import { useActiveLocation, useActiveCoords } from '@/hooks/useActiveLocation';
import { formatRelative, formatDateTime, getSeverityConfig } from '@/utils/formatters';
import { cn } from '@/lib/cn';

function Alerts() {
    const navigate = useNavigate();
    const { ready } = useActiveLocation();
    const coords = useActiveCoords();
    const [radiusKm, setRadiusKm] = useState(50);
    const [page, setPage] = useState(1);

    const { data, isLoading, isRefetching, error, refetch } = useAlerts({ radiusKm, page, size: 20 });
    const { data: stats } = useAlertStats(radiusKm);

    const alerts = useMemo(() => data?.alerts || [], [data]);
    const pagination = data?.pagination;

    if (!ready) {
        return (
            <PageTransition className="page-shell">
                <StateScreen
                    icon={MapPin}
                    title="Set your location"
                    description="Confirm your location to view weather alerts."
                    action={
                        <button onClick={() => navigate('/search')} className="btn-primary">
                            Search for a city
                        </button>
                    }
                />
            </PageTransition>
        );
    }

    return (
        <PageTransition className="page-shell stack-y">
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <h1 className="page-heading">Weather Alerts</h1>
                <div className="flex items-center gap-2">
                    <select
                        value={radiusKm}
                        onChange={(e) => { setRadiusKm(Number(e.target.value)); setPage(1); }}
                        aria-label="Alert search radius"
                        className="text-xs px-3 h-9 rounded-full border border-stone-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.03] text-stone-700 dark:text-stone-300"
                    >
                        <option value={25}>25 km</option>
                        <option value={50}>50 km</option>
                        <option value={100}>100 km</option>
                        <option value={250}>250 km</option>
                        <option value={500}>500 km</option>
                    </select>
                    <RefreshControl onRefresh={refetch} isRefreshing={isRefetching} />
                </div>
            </div>

            {stats && (
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={stats.total_active > 0 ? 'danger' : 'success'} dot>
                        {stats.total_active} Active Alert{stats.total_active !== 1 ? 's' : ''}
                    </Badge>
                    {stats.by_severity && Object.entries(stats.by_severity).map(([sev, count]) => (
                        <Badge key={sev} variant="default" size="xs">{sev}: {count}</Badge>
                    ))}
                    {stats.recent_count_24h > 0 && (
                        <Badge variant="warning" size="xs" dot>{stats.recent_count_24h} in last 24h</Badge>
                    )}
                </div>
            )}

            {isLoading ? (
                <div className="stack-y">
                    {Array.from({ length: 3 }).map((_, i) => (<SkeletonCard key={i} className="h-24" />))}
                </div>
            ) : error ? (
                <ErrorState error={error} onRetry={refetch} />
            ) : alerts.length === 0 ? (
                <EmptyState icon={ShieldAlert} title="No active alerts" description={`No weather alerts within ${radiusKm} km of your location. Stay safe!`} />
            ) : (
                <>
                    <Card className="py-6">
                        <AlertRadiusMap alerts={alerts} radiusKm={radiusKm} userLat={coords?.lat} userLon={coords?.lon} />
                    </Card>
                    <div className="stack-y">
                        {alerts.map((alert, i) => (<AlertCard key={alert.id || i} alert={alert} index={i} />))}
                    </div>
                </>
            )}

            {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.has_previous}>
                        Previous
                    </Button>
                    <span className="text-sm text-stone-500">{pagination.page} / {pagination.total_pages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!pagination.has_next}>
                        Next
                    </Button>
                </div>
            )}
        </PageTransition>
    );
}

function AlertCard({ alert, index }) {
    const [expanded, setExpanded] = useState(false);
    const severity = getSeverityConfig(alert.severity);

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.3 }}>
            <Card className="overflow-hidden" padding={false}>
                <div className={cn('h-1', severity.bg)} />
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <div className={cn('w-8 h-8 rounded-2xl flex items-center justify-center shrink-0', severity.bg)} aria-hidden="true">
                            <AlertTriangle size={16} className={severity.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 line-clamp-2">{alert.headline}</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <Badge variant="default" size="xs">{alert.event_type}</Badge>
                                        <Badge variant={alert.severity === 'extreme' || alert.severity === 'severe' ? 'danger' : alert.severity === 'moderate' ? 'warning' : 'default'} size="xs">
                                            {alert.severity}
                                        </Badge>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setExpanded(!expanded)}
                                    className="shrink-0 btn-icon !w-8 !h-8"
                                    aria-expanded={expanded}
                                    aria-label={expanded ? 'Collapse alert details' : 'Expand alert details'}
                                >
                                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-stone-400 flex-wrap">
                                <span className="flex items-center gap-1"><Clock size={10} aria-hidden="true" />{formatRelative(alert.effective_at)}</span>
                                <span>Expires: {formatDateTime(alert.expires_at)}</span>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {expanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                                <div className="mt-3 pt-3 border-t border-stone-100 dark:border-white/[0.04] space-y-3">
                                    {alert.description && (
                                        <div>
                                            <p className="text-xs font-medium text-stone-500 mb-1 flex items-center gap-1"><Info size={10} aria-hidden="true" /> Description</p>
                                            <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{alert.description}</p>
                                        </div>
                                    )}
                                    {alert.instruction && (
                                        <div>
                                            <p className="text-xs font-medium text-stone-500 mb-1">Instructions</p>
                                            <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{alert.instruction}</p>
                                        </div>
                                    )}
                                    {alert.location_name && <p className="text-xs text-stone-400">📍 {alert.location_name}</p>}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Card>
        </motion.div>
    );
}

export default Alerts;