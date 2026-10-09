// web/src/pages/Forecast.jsx
import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin } from 'lucide-react';
import { PageTransition } from '@/components/common/PageTransition';
import { RefreshControl } from '@/components/common/RefreshControl';
import { DailyForecast } from '@/components/common/DailyForecast';
import { HourlyForecast } from '@/components/common/HourlyForecast';
import { HourlyScrubber } from '@/components/forecast/HourlyScrubber';
import { PrecipitationTimeline } from '@/components/forecast/PrecipitationTimeline';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StateScreen } from '@/components/ui/StateScreen';
import { useForecast, useHourlyForecast } from '@/hooks/useWeather';
import { useActiveLocation } from '@/hooks/useActiveLocation';

function Forecast() {
    const navigate = useNavigate();
    const { ready } = useActiveLocation();
    const [days, setDays] = useState(7);
    const queryClient = useQueryClient();

    const { data: forecast, isLoading, error, refetch } = useForecast(days);
    const { data: hourlyData } = useHourlyForecast(Math.min(days, 3));
    const allHours = useMemo(() => hourlyData?._flatHours?.slice(0, 48) || [], [hourlyData]);

    const handleRefresh = async () => {
        await queryClient.invalidateQueries({ queryKey: ['weather', 'forecast'] });
    };

    if (!ready) {
        return (
            <PageTransition className="page-shell">
                <StateScreen
                    icon={MapPin}
                    title="Set your location"
                    description="Confirm your location to see the forecast."
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
                <h1 className="page-heading">Forecast</h1>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-stone-100 dark:bg-white/[0.05] rounded-full p-1">
                        {[3, 7, 14].map((d) => (
                            <button
                                key={d}
                                onClick={() => setDays(d)}
                                className={`px-3 h-8 text-xs font-medium rounded-full transition-all duration-200 ${days === d ? 'bg-white dark:bg-white/[0.10] text-orange-500 shadow-soft' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
                            >
                                {d}d
                            </button>
                        ))}
                    </div>
                    <RefreshControl onRefresh={handleRefresh} />
                </div>
            </div>

            {error && <ErrorState error={error} onRetry={refetch} compact />}

            {isLoading ? (
                <div className="stack-y">
                    {Array.from({ length: 4 }).map((_, i) => (<SkeletonCard key={i} className="h-16" />))}
                </div>
            ) : (
                <div className="stack-y">
                    <PrecipitationTimeline hours={allHours} />
                    <HourlyScrubber hours={allHours} />
                    {allHours.length > 0 && <HourlyForecast hours={allHours} />}
                    {forecast?.days && <DailyForecast days={days} />}
                    {!forecast?.days?.length && (
                        <EmptyState icon={CalendarDays} title="No forecast data" description="Forecast data is not available right now." />
                    )}
                </div>
            )}
        </PageTransition>
    );
}

export default Forecast;