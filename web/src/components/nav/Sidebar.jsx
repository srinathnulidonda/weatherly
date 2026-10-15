// src/components/nav/Sidebar.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CloudSun, CalendarDays, BarChart3, ShieldAlert, Search, Settings, Download, Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SIDEBAR_NAV } from '@/utils/constants';
import { useActiveAlertCount } from '@/hooks/useAlerts';
import { useTheme } from '@/hooks/useTheme';
import logoImage from '@/assets/logo-weatherly.png';
import { isNavActive } from '@/utils/nav';

const icons = { CloudSun, CalendarDays, BarChart3, ShieldAlert, Search, Settings, Download };

const THEME_OPTIONS = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
];

const NAV_SECTIONS = [
    { label: 'Overview', items: ['/', '/forecast'] },
    { label: 'Insights', items: ['/analytics', '/alerts'] },
    { label: 'General', items: ['/search', '/settings'] },
    { label: 'Android', items: ['/apk'] },
];

function NavItem({ item, isActive, onNavigate, alertCount }) {
    const Icon = icons[item.icon];
    const isAlerts = item.path === '/alerts';

    return (
        <button
            onClick={() => onNavigate(item.path)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
                'relative flex w-full items-center gap-2.5 rounded-lg px-2.5 h-9 text-[13px] transition-colors duration-150',
                isActive
                    ? 'text-orange-600 dark:text-orange-400 font-medium'
                    : 'text-stone-600 hover:bg-stone-900/[0.04] hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/[0.04] dark:hover:text-stone-200'
            )}
        >
            {isActive && (
                <motion.span
                    layoutId="sidebarActivePill"
                    className="absolute inset-0 rounded-lg bg-orange-500/10"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
            )}
            {Icon && (
                <Icon
                    size={15}
                    strokeWidth={isActive ? 2.1 : 1.8}
                    className={cn(
                        'relative z-10 shrink-0',
                        isActive ? 'text-orange-500' : 'text-stone-400 dark:text-stone-500'
                    )}
                />
            )}
            <span className="relative z-10 flex-1 truncate text-left">{item.label}</span>
            {isAlerts && alertCount > 0 && (
                <span className="relative z-10 inline-flex h-[17px] min-w-[17px] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[9.5px] font-bold text-white">
                    {alertCount > 99 ? '99+' : alertCount}
                </span>
            )}
        </button>
    );
}

function Sidebar() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { count: alertCount } = useActiveAlertCount();
    const { theme, setTheme } = useTheme();

    const findNavItem = (path) => SIDEBAR_NAV.find((n) => n.path === path);
    const handleNav = (path) => navigate(path);

    return (
        <aside className="hidden md:flex flex-col w-[280px] h-dvh fixed left-0 top-0 z-sidebar bg-stone-50 dark:bg-stone-950 border-r border-stone-200 dark:border-white/[0.07]">
            {/* Logo */}
            <div className="flex items-center justify-center py-4">
                <img
                    src={logoImage}
                    alt="Logo"
                    onClick={() => handleNav('/')}
                    className="h-auto w-36 cursor-pointer object-contain transition-opacity hover:opacity-80"
                />
            </div>

            {/* Search shortcut */}
            <div className="px-4 pb-3">
                <button
                    onClick={() => handleNav('/search')}
                    className="flex h-9 w-full items-center gap-2 rounded-full bg-stone-100/80 px-3 text-[12.5px] text-stone-500 ring-1 ring-black/[0.04] transition-colors hover:bg-stone-200/60 dark:bg-white/[0.05] dark:text-stone-500 dark:ring-white/[0.07] dark:hover:bg-white/[0.08]"
                >
                    <Search size={13} className="shrink-0 text-stone-400 dark:text-stone-500" />
                    <span className="flex-1 text-left">Search a city…</span>
                </button>
            </div>

            {/* Nav */}
            <div className="relative min-h-0 flex-1">
                <nav className="h-full space-y-5 overflow-y-auto px-4 pb-6 scrollbar-hide">
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.label}>
                            <p className="mb-1 px-2.5 text-[10px] font-medium uppercase tracking-[0.08em] text-stone-400 dark:text-stone-600">
                                {section.label}
                            </p>
                            <div className="space-y-0.5">
                                {section.items.map((path) => {
                                    const item = findNavItem(path);
                                    if (!item) return null;
                                    return (
                                        <NavItem
                                            key={item.path}
                                            item={item}
                                            isActive={isNavActive(pathname, item.path)}
                                            onNavigate={handleNav}
                                            alertCount={alertCount}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-stone-50 to-transparent dark:from-stone-950" />
            </div>

            {/* Footer */}
            <div className="border-t border-stone-200 px-4 pb-4 pt-3 dark:border-white/[0.07]">
                <div
                    role="group"
                    aria-label="Theme"
                    className="mb-3 flex items-center gap-1 rounded-full bg-stone-100/80 p-1 ring-1 ring-black/[0.04] dark:bg-white/[0.05] dark:ring-white/[0.07]"
                >
                    {THEME_OPTIONS.map((option) => {
                        const active = theme === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setTheme(option.value)}
                                className={cn(
                                    'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-[11px] font-semibold transition-colors duration-150',
                                    active
                                        ? 'bg-white text-orange-600 shadow-soft dark:bg-stone-800 dark:text-orange-400'
                                        : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                                )}
                            >
                                <option.icon size={13} strokeWidth={1.8} aria-hidden="true" />
                                {option.label}
                            </button>
                        );
                    })}
                </div>

                <p className="px-1 text-center text-[10px] text-stone-400 dark:text-stone-600">
                    © {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME || 'Weatherly'} · v2.1.0
                </p>
            </div>
        </aside>
    );
}

export { Sidebar };
export default Sidebar;