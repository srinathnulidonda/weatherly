// web/src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { AppShell } from '@/components/nav/AppShell';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const Home = lazy(() => import('@/pages/Home'));
const Forecast = lazy(() => import('@/pages/Forecast'));
const Search = lazy(() => import('@/pages/Search'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Alerts = lazy(() => import('@/pages/Alerts'));
const Settings = lazy(() => import('@/pages/Settings'));
const Download = lazy(() => import('@/pages/Download'));
const Releases = lazy(() => import('@/pages/Releases'));
const Terms = lazy(() => import('@/pages/legal/Terms'));
const Privacy = lazy(() => import('@/pages/legal/Privacy'));
const Cookies = lazy(() => import('@/pages/legal/Cookies'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function GlobalLoader() {
    return (
        <div className="flex items-center justify-center min-h-dvh">
            <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-stone-200 dark:border-stone-800" />
                <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-t-orange-500 animate-spin" />
            </div>
        </div>
    );
}

export default function App() {
    useTheme();
    return (
        <AppShell>
            <ScrollToTop />
            <ErrorBoundary variant="inline">
                <Suspense fallback={<GlobalLoader />}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/forecast" element={<Forecast />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/alerts" element={<Alerts />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/apk" element={<Download />} />
                        <Route path="/apk/releases" element={<Releases />} />
                        <Route path="/legal/terms" element={<Terms />} />
                        <Route path="/legal/privacy" element={<Privacy />} />
                        <Route path="/legal/cookies" element={<Cookies />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </ErrorBoundary>
        </AppShell>
    );
}