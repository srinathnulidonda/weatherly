// web/src/pages/Settings.jsx
import { useState } from 'react';
import { Sun, Moon, Monitor, RefreshCw, Trash2, Plus, Database, ChevronRight, Mail, FileText, Shield, Cookie, AlertTriangle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/common/PageTransition';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LocationManager } from '@/components/settings/LocationManager';
import { ConfirmDialog } from '@/components/settings/ConfirmDialog';
import { CurrentLocationCard } from '@/components/settings/CurrentLocationCard';
import { AppIcon } from '@/components/download/AppIcon';
import { InfoStrip } from '@/components/download/InfoStrip';
import { useTheme } from '@/hooks/useTheme';
import { useLocation } from '@/hooks/useLocation';
import { useStore } from '@/stores/store';
import { cn } from '@/lib/cn';

const THEME_OPTIONS = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
];

const UNIT_OPTIONS = [
    { value: 'metric', label: 'Metric', detail: '°C · m/s · hPa' },
    { value: 'imperial', label: 'Imperial', detail: '°F · mph · inHg' },
    { value: 'standard', label: 'Standard', detail: 'K · m/s · hPa' },
];

function capitalize(str) {
    if (!str) return '—';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function SettingsSection({ label, children, action, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.35 }}
            className="stack-y !gap-2 sm:!gap-3"
        >
            <div className="flex items-center justify-between px-1">
                <h2 className="label text-[9px] sm:text-[10px]">{label}</h2>
                {action}
            </div>
            <div className="stack-y !gap-2 sm:!gap-3">{children}</div>
        </motion.div>
    );
}

function SettingsRow({ icon: Icon, iconColor, title, description, control, last = false }) {
    return (
        <div className={cn('flex items-center gap-2.5 sm:gap-3 py-3 sm:py-3.5 flex-wrap sm:flex-nowrap', !last && 'border-b border-stone-100 dark:border-white/[0.06]')}>
            {Icon && (
                <div className={cn('w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0', iconColor || 'bg-stone-100 dark:bg-white/[0.05]')} aria-hidden="true">
                    <Icon size={14} className="text-stone-500 dark:text-stone-400" />
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className="text-[13px] sm:text-sm font-medium text-stone-900 dark:text-stone-100">{title}</p>
                {description && <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5">{description}</p>}
            </div>
            <div className="shrink-0 w-full sm:w-auto">{control}</div>
        </div>
    );
}

function SegmentedControl({ options, value, onChange, renderLabel, groupId }) {
    return (
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-white/[0.05] rounded-full p-1 w-full sm:w-auto">
            {options.map((opt) => {
                const active = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            'relative flex-1 sm:flex-none px-2.5 sm:px-3.5 h-9 sm:h-10 min-w-[40px] sm:min-w-[44px] text-[11px] sm:text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap',
                            active ? 'text-orange-500' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                        )}
                    >
                        {active && (
                            <motion.span
                                layoutId={`segbg-${groupId}`}
                                className="absolute inset-0 bg-white dark:bg-white/[0.10] shadow-soft rounded-full"
                                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                            />
                        )}
                        <span className="relative z-10">
                            {renderLabel ? renderLabel(opt) : opt.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function LinkRow({ icon: Icon, title, href, to, external = false, last = false }) {
    const rowClass = cn(
        'flex items-center gap-2.5 sm:gap-3 py-3 sm:py-3.5 group',
        !last && 'border-b border-stone-100 dark:border-white/[0.06]'
    );

    const content = (
        <>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-stone-100 dark:bg-white/[0.05] flex items-center justify-center shrink-0" aria-hidden="true">
                <Icon size={14} className="text-stone-500 dark:text-stone-400" />
            </div>
            <span className="text-[13px] sm:text-sm font-medium text-stone-900 dark:text-stone-100 flex-1">{title}</span>
            <ChevronRight size={14} className="text-stone-300 dark:text-stone-600 group-hover:translate-x-0.5 transition-transform duration-150" aria-hidden="true" />
        </>
    );

    if (to) {
        return (
            <Link to={to} className={rowClass}>
                {content}
            </Link>
        );
    }

    return (
        <a
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className={rowClass}
        >
            {content}
        </a>
    );
}

function Settings() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const units = useStore((s) => s.units);
    const setUnits = useStore((s) => s.setUnits);
    const { location, locationConfirmed, locationLoading, locationError, refreshLocation, clearLocation, cityDisplay } = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [clearLocationConfirm, setClearLocationConfirm] = useState(false);
    const [clearCacheConfirm, setClearCacheConfirm] = useState(false);
    const [cacheCleared, setCacheCleared] = useState(false);

    const selectedUnit = UNIT_OPTIONS.find((o) => o.value === units);
    const appName = import.meta.env.VITE_APP_NAME || 'Weatherly';
    const appVersion = import.meta.env.VITE_APP_VERSION || 'dev';

    const handleClearCache = async () => {
        await queryClient.invalidateQueries();
        setClearCacheConfirm(false);
        setCacheCleared(true);
        setTimeout(() => setCacheCleared(false), 2500);
    };

    return (
        <PageTransition className="page-shell">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12 pb-28 md:pb-16">
                <motion.header
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 sm:mb-8"
                >
                    <h1 className="text-[22px] sm:text-[26px] font-bold text-stone-900 dark:text-stone-50 tracking-tight">
                        Settings
                    </h1>
                    <p className="text-[13.5px] text-stone-500 dark:text-stone-400 mt-1.5 max-w-prose">
                        Customize appearance, units, and manage your saved locations and data.
                    </p>
                </motion.header>

                <div className="grid lg:grid-cols-[1fr_340px] gap-6 lg:gap-8 items-start">
                    <div className="space-y-6 sm:space-y-8 min-w-0">
                        <SettingsSection label="Preferences" delay={0.05}>
                            <Card padding="sm">
                                <SettingsRow
                                    icon={resolvedTheme === 'dark' ? Moon : Sun}
                                    iconColor="bg-indigo-100 dark:bg-indigo-500/10"
                                    title="Appearance"
                                    description="Choose how Weatherly looks"
                                    control={
                                        <SegmentedControl
                                            groupId="theme"
                                            options={THEME_OPTIONS}
                                            value={theme}
                                            onChange={setTheme}
                                            renderLabel={(opt) => (
                                                <span className="flex items-center justify-center gap-1 sm:gap-1.5">
                                                    <opt.icon size={12} aria-hidden="true" />
                                                    <span className="hidden xs:inline">{opt.label}</span>
                                                </span>
                                            )}
                                        />
                                    }
                                />
                                <SettingsRow
                                    icon={Database}
                                    iconColor="bg-blue-100 dark:bg-blue-500/10"
                                    title="Units"
                                    description={selectedUnit?.detail}
                                    control={
                                        <SegmentedControl
                                            groupId="units"
                                            options={UNIT_OPTIONS}
                                            value={units}
                                            onChange={setUnits}
                                        />
                                    }
                                    last
                                />
                            </Card>
                        </SettingsSection>

                        <SettingsSection
                            label="Locations"
                            delay={0.1}
                            action={
                                <button
                                    type="button"
                                    onClick={() => navigate('/search')}
                                    aria-label="Add location"
                                    className="min-touch flex items-center justify-center rounded-full text-orange-500 hover:bg-orange-500/10 transition-colors"
                                >
                                    <Plus size={15} aria-hidden="true" />
                                </button>
                            }
                        >
                            {locationError && (
                                <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/20" role="alert">
                                    <AlertTriangle size={14} className="text-red-500 shrink-0" aria-hidden="true" />
                                    <p className="text-xs text-red-600 dark:text-red-400 flex-1 min-w-0">{locationError}</p>
                                </div>
                            )}

                            <CurrentLocationCard
                                location={location}
                                confirmed={locationConfirmed}
                                loading={locationLoading}
                                cityDisplay={cityDisplay}
                                onRefresh={refreshLocation}
                                onClear={() => setClearLocationConfirm(true)}
                            />

                            <Card padding="sm">
                                <div className="flex items-center justify-between mb-2.5 sm:mb-3 px-1 pt-1">
                                    <p className="text-[13px] sm:text-sm font-semibold text-stone-700 dark:text-stone-300">Saved Locations</p>
                                </div>
                                <LocationManager />
                            </Card>
                        </SettingsSection>

                        <SettingsSection label="Data & Storage" delay={0.15}>
                            <Card padding="sm">
                                <SettingsRow
                                    icon={RefreshCw}
                                    iconColor="bg-teal-100 dark:bg-teal-500/10"
                                    title="Clear cached weather data"
                                    description="Force refresh all weather information"
                                    control={
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setClearCacheConfirm(true)}
                                            className={cn(cacheCleared && 'text-green-500 border-green-300')}
                                        >
                                            {cacheCleared ? 'Cleared ✓' : 'Clear cache'}
                                        </Button>
                                    }
                                    last
                                />
                            </Card>
                        </SettingsSection>
                    </div>

                    <aside className="space-y-6 lg:sticky lg:top-24">
                        <Card padding="lg" className="text-center">
                            <AppIcon size={56} className="mx-auto mb-3" />
                            <p className="text-[15px] sm:text-base font-bold text-stone-900 dark:text-stone-50">
                                {appName}
                            </p>
                            <p className="text-[11px] sm:text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                                Version {appVersion}
                            </p>
                            <InfoStrip
                                className="mt-4"
                                items={[
                                    { icon: resolvedTheme === 'dark' ? Moon : Sun, value: capitalize(resolvedTheme), label: 'Theme' },
                                    { icon: Database, value: capitalize(units), label: 'Units' },
                                ]}
                            />
                        </Card>

                        <Card padding="sm">
                            <h2 className="text-[13.5px] font-bold text-stone-900 dark:text-stone-50 px-1 pt-1 pb-2 flex items-center gap-2">
                                <Shield size={15} className="text-orange-500" aria-hidden="true" />
                                Legal &amp; policies
                            </h2>
                            <LinkRow icon={FileText} title="Terms of Service" to="/legal/terms" />
                            <LinkRow icon={Shield} title="Privacy Policy" to="/legal/privacy" />
                            <LinkRow icon={Cookie} title="Cookie Policy" to="/legal/cookies" last />
                        </Card>

                        <Card padding="sm">
                            <LinkRow icon={Mail} title="Send feedback" href="mailto:feedback@weatherly.app" last />
                        </Card>

                        <p className="text-center text-[10px] sm:text-[11px] text-stone-400 dark:text-stone-600">
                            © {new Date().getFullYear()} {appName}
                        </p>
                    </aside>
                </div>
            </div>

            <ConfirmDialog
                open={clearLocationConfirm}
                onClose={() => setClearLocationConfirm(false)}
                onConfirm={() => { clearLocation(); setClearLocationConfirm(false); }}
                title="Clear current location?"
                description="This will remove your detected location. You can re-detect it anytime."
                confirmLabel="Clear location"
                icon={Trash2}
                danger
            />

            <ConfirmDialog
                open={clearCacheConfirm}
                onClose={() => setClearCacheConfirm(false)}
                onConfirm={handleClearCache}
                title="Clear cached data?"
                description="All weather data will be refreshed from the server. This may take a moment."
                confirmLabel="Clear cache"
                icon={RefreshCw}
            />
        </PageTransition>
    );
}

export default Settings;