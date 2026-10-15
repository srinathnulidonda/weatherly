// src/pages/Settings.jsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
    AlertTriangle,
    ChevronRight,
    Cookie,
    Database,
    ExternalLink,
    FileText,
    History,
    Monitor,
    Moon,
    Plus,
    ShieldCheck,
    Smartphone,
    Sun,
    Trash2,
} from 'lucide-react';
import { PageTransition } from '@/components/common/PageTransition';
import { AppIcon } from '@/components/download/AppIcon';
import { InfoStrip } from '@/components/download/InfoStrip';
import { ConfirmDialog } from '@/components/settings/ConfirmDialog';
import { CurrentLocationCard } from '@/components/settings/CurrentLocationCard';
import { LocationManager } from '@/components/settings/LocationManager';
import { SegmentedControl } from '@/components/settings/SegmentedControl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useLocation } from '@/hooks/useLocation';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/stores/store';
import { capitalize } from '@/utils/formatters';
import { cn } from '@/lib/cn';

const THEME_OPTIONS = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
];

const UNIT_OPTIONS = [
    { value: 'metric', label: 'Metric', description: '°C · m/s · hPa' },
    { value: 'imperial', label: 'Imperial', description: '°F · mph · inHg' },
    { value: 'standard', label: 'Standard', description: 'K · m/s · hPa' },
];

function SettingsSection({ title, children, className }) {
    return (
        <section className={cn('space-y-2 sm:space-y-3', className)}>
            <h2 className="px-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 sm:text-xs">
                {title}
            </h2>
            <Card padding={false} className="divide-y divide-stone-200/70 px-3 dark:divide-white/[0.06] sm:px-4">
                {children}
            </Card>
        </section>
    );
}

function SettingsRow({ title, description, children }) {
    return (
        <div className="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3.5">
            <div className="min-w-0">
                <p className="text-[13px] font-medium text-stone-900 dark:text-stone-100 sm:text-sm">{title}</p>
                {description ? (
                    <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400 sm:text-xs">{description}</p>
                ) : null}
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}

function LinkRow({ icon: Icon, title, description, to, href, onClick, external = false }) {
    const content = (
        <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-white/[0.06] dark:text-stone-300 sm:h-9 sm:w-9 sm:rounded-xl">
                {Icon ? <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : null}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-stone-900 dark:text-stone-100 sm:text-sm">
                    {title}
                </span>
                {description ? (
                    <span className="mt-0.5 block truncate text-[10.5px] text-stone-500 dark:text-stone-400 sm:text-xs">
                        {description}
                    </span>
                ) : null}
            </span>
            {external ? (
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-stone-500 sm:h-4 sm:w-4" />
            ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-stone-500 sm:h-4 sm:w-4" />
            )}
        </>
    );

    const rowClassName =
        'flex items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl px-1.5 sm:px-2 py-2 sm:py-2.5 transition-colors hover:bg-stone-100/70 dark:hover:bg-white/[0.05]';

    if (to) {
        return (
            <Link to={to} className={rowClassName}>
                {content}
            </Link>
        );
    }

    if (href) {
        return (
            <a
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className={rowClassName}
            >
                {content}
            </a>
        );
    }

    return (
        <button type="button" onClick={onClick} className={cn(rowClassName, 'w-full text-left')}>
            {content}
        </button>
    );
}

function Settings() {
    const queryClient = useQueryClient();
    const { theme, setTheme } = useTheme();
    const units = useStore((state) => state.units);
    const setUnits = useStore((state) => state.setUnits);
    const {
        location,
        locationConfirmed,
        locationLoading,
        locationError,
        refreshLocation,
        clearLocation,
        cityDisplay,
    } = useLocation();

    const [confirmClearLocation, setConfirmClearLocation] = useState(false);
    const [confirmClearCache, setConfirmClearCache] = useState(false);
    const [cacheCleared, setCacheCleared] = useState(false);
    const cacheTimerRef = useRef(null);

    const appName = import.meta.env.VITE_APP_NAME || 'Weatherly';
    const appVersion = import.meta.env.VITE_APP_VERSION || 'dev';
    const year = new Date().getFullYear();

    useEffect(
        () => () => {
            window.clearTimeout(cacheTimerRef.current);
        },
        []
    );

    const handleClearCache = () => {
        queryClient.invalidateQueries();
        setConfirmClearCache(false);
        setCacheCleared(true);
        window.clearTimeout(cacheTimerRef.current);
        cacheTimerRef.current = window.setTimeout(() => setCacheCleared(false), 2500);
    };

    const handleClearLocation = () => {
        clearLocation();
        setConfirmClearLocation(false);
    };

    return (
        <PageTransition className="page-shell stack-y">
            <header className="space-y-0.5 text-center sm:space-y-1 sm:text-left">
                <h1 className="page-heading">Settings</h1>
                <p className="text-[12.5px] text-stone-500 dark:text-stone-400 sm:text-sm">
                    Preferences, location, and app data for this device.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
                <div className="min-w-0 space-y-4 sm:space-y-6">
                    <SettingsSection title="Appearance">
                        <SettingsRow title="Theme" description="Choose light, dark, or match your system.">
                            <SegmentedControl
                                groupId="theme"
                                label="Theme"
                                options={THEME_OPTIONS}
                                value={theme}
                                onChange={setTheme}
                                className="w-full sm:w-auto sm:min-w-[250px]"
                            />
                        </SettingsRow>
                    </SettingsSection>

                    <SettingsSection title="Units">
                        <SettingsRow title="Measurement units" description="Used across forecasts, charts, and details.">
                            <SegmentedControl
                                groupId="units"
                                label="Measurement units"
                                options={UNIT_OPTIONS}
                                value={units}
                                onChange={setUnits}
                                className="w-full sm:w-auto sm:min-w-[310px]"
                                renderLabel={(option) => (
                                    <span className="flex flex-col items-center gap-0.5">
                                        <span className="text-[10.5px] font-semibold sm:text-xs">{option.label}</span>
                                        <span className="text-[9px] font-medium text-stone-500 dark:text-stone-400 sm:text-[10px]">
                                            {option.description}
                                        </span>
                                    </span>
                                )}
                            />
                        </SettingsRow>
                    </SettingsSection>

                    <section className="space-y-2 sm:space-y-3">
                        <h2 className="px-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 sm:text-xs">
                            Location
                        </h2>

                        {locationError && (
                            <div
                                className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 dark:border-red-500/20 sm:rounded-2xl sm:p-3"
                                role="alert"
                            >
                                <AlertTriangle size={13} className="shrink-0 text-red-500" aria-hidden="true" />
                                <p className="min-w-0 flex-1 text-[11px] text-red-600 dark:text-red-400 sm:text-xs">
                                    {locationError}
                                </p>
                            </div>
                        )}

                        <Link
                            to="/search"
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-stone-300 bg-stone-50/60 px-4 py-2.5 text-[12.5px] font-semibold text-orange-600 transition-colors hover:border-orange-400/70 hover:bg-orange-500/5 active:scale-[0.99] dark:border-white/[0.15] dark:bg-white/[0.02] dark:text-orange-400 dark:hover:bg-orange-500/10 sm:rounded-2xl sm:py-3 sm:text-sm"
                        >
                            <Plus size={14} className="sm:hidden" aria-hidden="true" />
                            <Plus size={15} className="hidden sm:block" aria-hidden="true" />
                            Add a location
                        </Link>

                        <Card padding={false} className="overflow-hidden">
                            <CurrentLocationCard
                                location={location}
                                confirmed={locationConfirmed}
                                loading={locationLoading}
                                cityDisplay={cityDisplay}
                                onRefresh={refreshLocation}
                                onClear={() => setConfirmClearLocation(true)}
                            />
                            <div className="border-t border-stone-200/70 px-3 pb-3 pt-2.5 dark:border-white/[0.06] sm:px-3.5 sm:pb-3.5 sm:pt-3">
                                <p className="px-0.5 pb-1.5 text-[9px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 sm:text-[10px]">
                                    Saved locations
                                </p>
                                <LocationManager />
                            </div>
                        </Card>
                    </section>

                    <SettingsSection title="Data & Storage">
                        <SettingsRow title="Clear location data" description="Removes the detected location from this device.">
                            <Button variant="danger" size="sm" onClick={() => setConfirmClearLocation(true)}>
                                <Trash2 size={12} className="sm:hidden" aria-hidden="true" />
                                <Trash2 size={13} className="hidden sm:block" aria-hidden="true" />
                                Clear location
                            </Button>
                        </SettingsRow>
                        <SettingsRow title="Clear cached data" description="Fresh forecasts and alerts are fetched on your next visit.">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmClearCache(true)}
                                disabled={cacheCleared}
                                className={cn(cacheCleared && '!text-green-500 !border-green-500/30')}
                            >
                                <Database size={12} className="sm:hidden" aria-hidden="true" />
                                <Database size={13} className="hidden sm:block" aria-hidden="true" />
                                {cacheCleared ? 'Cleared ✓' : 'Clear cache'}
                            </Button>
                        </SettingsRow>
                    </SettingsSection>
                </div>

                <aside className="space-y-3 sm:space-y-4 lg:sticky lg:top-6 lg:self-start">
                    <Card padding="lg">
                        <div className="flex flex-col items-center text-center">
                            <AppIcon className="h-12 w-12 shrink-0 sm:h-14 sm:w-14" />
                            <p className="mt-2.5 truncate text-[13px] font-semibold text-stone-900 dark:text-stone-100 sm:mt-3 sm:text-sm">
                                {appName}
                            </p>
                            <p className="mt-0.5 text-[10.5px] font-medium text-stone-500 dark:text-stone-400 sm:text-xs">
                                v{appVersion}
                            </p>
                        </div>
                        <div className="mt-3 sm:mt-4">
                            <InfoStrip
                                items={[
                                    { label: 'Theme', value: capitalize(theme) },
                                    { label: 'Units', value: capitalize(units) },
                                ]}
                            />
                        </div>
                    </Card>

                    <Card padding="lg">
                        <h2 className="text-[13px] font-semibold text-stone-900 dark:text-stone-100 sm:text-sm">Android app</h2>
                        <div className="-mx-1.5 mt-1.5 space-y-0.5 sm:-mx-2 sm:mt-2">
                            <LinkRow icon={Smartphone} title="Download the app" description="Get the latest APK" to="/apk" />
                            <LinkRow icon={History} title="Release history" description="Browse every published build" to="/apk/releases" />
                        </div>
                    </Card>

                    <Card padding="lg">
                        <h2 className="text-[13px] font-semibold text-stone-900 dark:text-stone-100 sm:text-sm">Legal & policies</h2>
                        <div className="-mx-1.5 mt-1.5 space-y-0.5 sm:-mx-2 sm:mt-2">
                            <LinkRow icon={FileText} title="Terms of Service" to="/legal/terms" />
                            <LinkRow icon={ShieldCheck} title="Privacy Policy" to="/legal/privacy" />
                            <LinkRow icon={Cookie} title="Cookie Policy" to="/legal/cookies" />
                        </div>
                    </Card>

                    <p className="px-1 text-center text-[10px] text-stone-400 dark:text-stone-500 sm:text-xs">
                        © {year} {appName}
                    </p>
                </aside>
            </div>

            <ConfirmDialog
                open={confirmClearLocation}
                onClose={() => setConfirmClearLocation(false)}
                onConfirm={handleClearLocation}
                title="Clear location data?"
                description="Your detected location will be removed from this device. Weatherly will ask for your location again the next time it needs it."
                confirmLabel="Clear location"
                danger
                icon={Trash2}
            />
            <ConfirmDialog
                open={confirmClearCache}
                onClose={() => setConfirmClearCache(false)}
                onConfirm={handleClearCache}
                title="Clear cached data?"
                description="Cached forecasts and alerts will be refreshed on your next visit. Your saved locations are not affected."
                confirmLabel="Clear cache"
                icon={Database}
            />
        </PageTransition>
    );
}

export { Settings };
export default Settings;