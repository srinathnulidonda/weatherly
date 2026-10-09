// web/src/pages/Analytics.jsx
import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BarChart3, MapPin, TrendingUp, TrendingDown, Minus, Lightbulb, AlertTriangle, Thermometer, Umbrella, Wind } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { PageTransition } from '@/components/common/PageTransition';
import { RefreshControl } from '@/components/common/RefreshControl';
import { Card } from '@/components/ui/Card';
import { TempChart } from '@/components/analytics/TempChart';
import { ActivityGauges } from '@/components/analytics/ActivityGauges';
import { CompareCard } from '@/components/analytics/CompareCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StateScreen } from '@/components/ui/StateScreen';
import { useWeatherTrends, useWeatherIndices, useWeatherInsights, useWeatherHistory } from '@/hooks/useAnalytics';
import { useCurrentWeather } from '@/hooks/useWeather';
import { useActiveLocation } from '@/hooks/useActiveLocation';
import { useStore } from '@/stores/store';

const TONE_STYLES = {
    warm: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    cool: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    neutral: 'bg-stone-500/10 text-stone-500 dark:text-stone-400',
};

function localDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function yesterdayRange() {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - 1);
    return {
        start: localDateString(start),
        end: localDateString(end),
    };
}

function ComparativeBadge({ className }) {
    const { data: current } = useCurrentWeather();
    const { start, end } = useMemo(() => yesterdayRange(), []);
    const { data: history } = useWeatherHistory(start, end);

    const insight = useMemo(() => {
        if (!current || !history?.data_points?.length) return null;

        const yesterdayTemps = history.data_points
            .map((p) => p.temperature_c)
            .filter((t) => t != null);

        if (!yesterdayTemps.length) return null;

        const yesterdayAvg = yesterdayTemps.reduce((a, b) => a + b, 0) / yesterdayTemps.length;
        const delta = current.temperature_c - yesterdayAvg;
        const absDelta = Math.abs(delta);

        if (absDelta < 1) return { label: 'Similar to yesterday', tone: 'neutral' };

        const direction = delta > 0 ? 'warmer' : 'cooler';
        const magnitude = absDelta >= 6 ? 'Much' : absDelta >= 3 ? 'Noticeably' : 'Slightly';

        return {
            label: `${magnitude} ${direction} than yesterday`,
            tone: delta > 0 ? 'warm' : 'cool',
        };
    }, [current, history]);

    if (!insight) return null;

    const Icon = insight.tone === 'warm' ? TrendingUp : insight.tone === 'cool' ? TrendingDown : Minus;

    return (
        <div className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium', TONE_STYLES[insight.tone], className)}>
            <Icon size={12} aria-hidden="true" />
            {insight.label}
        </div>
    );
}

const CATEGORY_CONFIG = {
    temperature: { icon: Thermometer, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    precipitation: { icon: Umbrella, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    wind: { icon: Wind, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    uv: { icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    comfort: { icon: TrendingUp, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    health: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
    trend: { icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    alert: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    default: { icon: Lightbulb, color: 'text-stone-400', bg: 'bg-stone-400/10' },
};

const SEVERITY_BORDER = {
    high: 'border-l-red-500',
    medium: 'border-l-amber-500',
    low: 'border-l-green-500',
};

function InsightCard({ insight, index = 0, className }) {
    if (!insight) return null;

    const category = insight.category?.toLowerCase() || 'default';
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.default;
    const Icon = config.icon;
    const severityBorder = SEVERITY_BORDER[insight.severity?.toLowerCase()] || 'border-l-stone-300 dark:border-l-stone-700';

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.3 }}
        >
            <Card className={cn('border-l-[3px]', severityBorder, className)} padding="sm">
                <div className="flex items-start gap-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', config.bg)} aria-hidden="true">
                        <Icon size={16} className={config.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                            {insight.title}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                            {insight.description}
                        </p>
                        {insight.recommendation && (
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1.5 font-medium">
                                💡 {insight.recommendation}
                            </p>
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

function Analytics() {
    const navigate = useNavigate();
    const { ready } = useActiveLocation();
    const units = useStore((s) => s.units);
    const [trendHours, setTrendHours] = useState(24);
    const queryClient = useQueryClient();

    const { data: trends, isLoading: loadingTrends, error: errorTrends } = useWeatherTrends(trendHours);
    const { data: indices, isLoading: loadingIndices } = useWeatherIndices();
    const { data: insights, isLoading: loadingInsights } = useWeatherInsights();

    const handleRefresh = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['analytics'] }),
            queryClient.invalidateQueries({ queryKey: ['weather', 'history'] }),
        ]);
    };

    if (!ready) {
        return (
            <PageTransition className="page-shell">
                <StateScreen
                    icon={MapPin}
                    title="Set your location"
                    description="Confirm your location to view analytics."
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
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="page-heading">Analytics</h1>
                    <ComparativeBadge />
                </div>
                <RefreshControl onRefresh={handleRefresh} />
            </div>

            <div className="stack-y">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <h2 className="section-heading">Temperature Trends</h2>
                    <div className="flex items-center gap-1 bg-stone-100 dark:bg-white/[0.05] rounded-full p-1">
                        {[12, 24, 48, 72, 168].map((h) => (
                            <button
                                key={h}
                                type="button"
                                onClick={() => setTrendHours(h)}
                                className={cn(
                                    'px-2.5 h-7 text-[10px] font-medium rounded-full transition-all duration-200',
                                    trendHours === h
                                        ? 'bg-white dark:bg-white/[0.10] text-orange-500 shadow-soft'
                                        : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                                )}
                            >
                                {h <= 48 ? `${h}h` : `${h / 24}d`}
                            </button>
                        ))}
                    </div>
                </div>

                {loadingTrends ? (
                    <SkeletonCard className="h-64" />
                ) : errorTrends ? (
                    <ErrorState error={errorTrends} compact />
                ) : trends?.data_points ? (
                    <TempChart dataPoints={trends.data_points} periodHours={trends.period_hours || trendHours} units={units} />
                ) : (
                    <EmptyState icon={BarChart3} title="No trend data" description="Trend data is not available." />
                )}
            </div>

            {loadingIndices ? (
                <SkeletonCard className="h-64" />
            ) : indices ? (
                <ActivityGauges data={indices} />
            ) : null}

            {loadingInsights ? (
                <SkeletonCard className="h-48" />
            ) : insights?.insights?.length > 0 ? (
                <div className="stack-y">
                    <h2 className="section-heading">Weather Insights</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {insights.insights.map((insight, i) => (
                            <InsightCard key={i} insight={insight} index={i} />
                        ))}
                    </div>
                </div>
            ) : null}

            <div className="stack-y">
                <h2 className="section-heading">Compare</h2>
                <CompareCard />
            </div>
        </PageTransition>
    );
}

export default Analytics;