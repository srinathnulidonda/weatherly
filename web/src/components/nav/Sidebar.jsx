// web/src/components/nav/Sidebar.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CloudSun, CalendarDays, BarChart3, ShieldAlert, Search, Settings, Download, Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SIDEBAR_NAV } from '@/utils/constants';
import { useActiveAlertCount } from '@/hooks/useAlerts';
import { useTheme } from '@/hooks/useTheme';
import logoImage from '@/assets/logo-weatherly.png';

const icons = { CloudSun, CalendarDays, BarChart3, ShieldAlert, Search, Settings, Download };
const THEME_ICONS = { dark: Moon, light: Sun, system: Monitor };
const THEME_ORDER = ['light', 'dark', 'system'];

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
            className={cn(
                'relative w-full flex items-center gap-2.5 h-9 px-2.5 rounded-md text-[13px] transition-colors duration-100 group',
                isActive
                    ? 'bg-stone-200/60 dark:bg-white/[0.06] text-stone-900 dark:text-stone-50 font-medium'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/40 dark:hover:bg-white/[0.03] hover:text-stone-900 dark:hover:text-stone-200'
            )}
        >
            {isActive && (
                <motion.span
                    layoutId="sidebarActiveBar"
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-orange-500"
                    transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                />
            )}
            {Icon && (
                <Icon
                    size={15}
                    strokeWidth={1.8}
                    className={cn(
                        'shrink-0 transition-colors',
                        isActive ? 'text-orange-500' : 'text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300'
                    )}
                />
            )}
            <span className="flex-1 text-left truncate">{item.label}</span>
            {isAlerts && alertCount > 0 && (
                <span className="min-w-[16px] h-4 flex items-center justify-center text-[9px] font-semibold rounded bg-red-500/15 text-red-600 dark:text-red-400 px-1 shrink-0">
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
            <div className="flex items-center justify-center py-3">
                <img
                    src={logoImage}
                    alt="Logo"
                    onClick={() => handleNav('/')}
                    className="w-40 h-auto object-contain cursor-pointer"
                />
            </div>

            <button
                onClick={() => handleNav('/search')}
                className="mx-4 mb-3 flex items-center gap-2 h-9 px-2.5 rounded-md border border-stone-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] text-[12.5px] text-stone-400 dark:text-stone-500 hover:border-stone-300 dark:hover:border-white/[0.12] hover:text-stone-600 dark:hover:text-stone-400 transition-colors"
            >
                <Search size={13} className="shrink-0" />
                <span className="flex-1 text-left">Search a city…</span>
            </button>

            <nav className="flex-1 px-4 pb-3 space-y-4 overflow-y-auto scrollbar-hide">
                {NAV_SECTIONS.map((section) => (
                    <div key={section.label}>
                        <p className="px-2.5 mb-1 text-[10px] font-medium uppercase tracking-[0.08em] text-stone-400 dark:text-stone-600">
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
                                        isActive={pathname === item.path}
                                        onNavigate={handleNav}
                                        alertCount={alertCount}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="px-4 pb-4 pt-3 border-t border-stone-200 dark:border-white/[0.07]">
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-stone-100 dark:bg-white/[0.03] mb-3">
                    {THEME_ORDER.map((t) => {
                        const Icon = THEME_ICONS[t];
                        const active = theme === t;
                        return (
                            <button
                                key={t}
                                onClick={() => setTheme(t)}
                                className={cn(
                                    'flex-1 flex items-center justify-center h-8 rounded-md transition-all duration-150',
                                    active
                                        ? 'bg-white dark:bg-white/[0.08] text-stone-900 dark:text-stone-100 shadow-sm'
                                        : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                                )}
                                aria-label={`${t} theme`}
                            >
                                <Icon size={13} strokeWidth={1.8} />
                            </button>
                        );
                    })}
                </div>

                <p className="text-[10px] text-stone-400 dark:text-stone-600 px-1">
                    © {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME || 'Weatherly'} · v1.0
                </p>
            </div>
        </aside>
    );
}

export { Sidebar };
export default Sidebar;