// web/src/pages/Home.jsx
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { PageTransition, AnimatedItem } from '@/components/common/PageTransition';
import RefreshControl from '@/components/common/RefreshControl';
import { LocationPager } from '@/components/home/LocationPager';
import { LocationBar } from '@/components/home/LocationBar';
import { SmartAdvisories } from '@/components/home/SmartAdvisories';
import CurrentWeather from '@/components/home/CurrentWeather';
import WeatherDetails from '@/components/home/WeatherDetails';
import HourlyForecast from '@/components/common/HourlyForecast';
import DailyForecast from '@/components/common/DailyForecast';
import SunTimes from '@/components/home/SunTimes';
import AirQuality from '@/components/home/AirQuality';
import { StateScreen } from '@/components/ui/StateScreen';
import { useLocation } from '@/hooks/useLocation';
import { useActiveLocation } from '@/hooks/useActiveLocation';

function Home() {
    const navigate = useNavigate();
    const { locationError } = useLocation();
    const { ready } = useActiveLocation();
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await queryClient.invalidateQueries({ queryKey: ['weather'] });
        } finally {
            setTimeout(() => setIsRefreshing(false), 600);
        }
    }, [queryClient]);

    if (!ready) {
        return (
            <PageTransition className="flex-1 flex items-center justify-center page-shell">
                <StateScreen
                    icon={MapPin}
                    title="Set your location"
                    description={locationError || 'Enable location access or search for a city to see live weather.'}
                    action={
                        <button onClick={() => navigate('/search')} className="btn-primary">
                            Search for a city
                        </button>
                    }
                    className="w-full max-w-lg"
                />
            </PageTransition>
        );
    }

    return (
        <RefreshControl onRefresh={handleRefresh} isRefreshing={isRefreshing}>
            <PageTransition className="page-shell stack-y">
                <div className="flex items-center gap-2">
                    <LocationPager className="flex-1 min-w-0" />
                    <LocationBar className="hidden md:flex shrink-0" />
                </div>

                <div className="grid grid-cols-1 tablet:grid-cols-2 xl:grid-cols-[1fr_380px] 2xl:grid-cols-[1fr_420px] gap-4 md:gap-6">
                    <div className="stack-y min-w-0">
                        <AnimatedItem><CurrentWeather /></AnimatedItem>
                        <AnimatedItem delay={0.03}><SmartAdvisories /></AnimatedItem>
                        <AnimatedItem delay={0.05}><HourlyForecast limit={24} viewAllLink /></AnimatedItem>
                        <AnimatedItem delay={0.1}><WeatherDetails /></AnimatedItem>
                    </div>
                    <div className="stack-y min-w-0">
                        <AnimatedItem delay={0.05}><DailyForecast days={7} compact viewAllLink /></AnimatedItem>
                        <AnimatedItem delay={0.1}><SunTimes /></AnimatedItem>
                        <AnimatedItem delay={0.15}><AirQuality /></AnimatedItem>
                    </div>
                </div>
            </PageTransition>
        </RefreshControl>
    );
}

export default Home;