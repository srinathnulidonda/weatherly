// web/src/components/nav/AppShell.jsx
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopAppBar } from './TopAppBar';
import { LocationSwitcherSheet } from '../common/LocationSwitcherSheet';
import { OfflineBanner } from '../common/OfflineBanner';
import { AlertBanner } from '../common/AlertBanner';
import { LocationConfirmToast } from '../common/LocationConfirmToast';

function AppShell({ children }) {
    return (
        <div className="min-h-dvh bg-stone-50 dark:bg-stone-950 relative">
            <a
                href="#main-content"
                className="z-[9999] absolute left-[-9999px] focus-visible:left-0 focus-visible:top-0 focus-visible:right-0 p-2 bg-white/90 dark:bg-stone-950/90 text-stone-900 dark:text-stone-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
            >
                Skip to main content
            </a>

            <div className="notice-stack">
                <OfflineBanner />
                <LocationConfirmToast />
                <AlertBanner />
            </div>

            <LocationSwitcherSheet />
            <Sidebar />

            <div className="md:ml-[280px] flex flex-col min-h-dvh">
                <TopAppBar />
                <main id="main-content" className="flex-1 min-w-0 pb-[calc(var(--bottombar-h)+env(safe-area-inset-bottom,0px)+1rem)] md:pb-6">
                    {children}
                </main>
            </div>

            <BottomNav />
        </div>
    );
}

export { AppShell };
export default AppShell;