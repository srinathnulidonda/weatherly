// web/src/hooks/useTheme.js
import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../stores/store';

export function useTheme() {
    const theme = useStore((s) => s.theme);
    const setThemeStore = useStore((s) => s.setTheme);

    const [systemDark, setSystemDark] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    );

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => setSystemDark(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        const isDark = theme === 'dark' || (theme === 'system' && systemDark);
        root.classList.toggle('dark', isDark);

        const metaTheme = document.getElementById('theme-color-meta');
        if (metaTheme) {
            metaTheme.setAttribute('content', isDark ? '#0C0A09' : '#FAFAF9');
        }
    }, [theme, systemDark]);

    const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

    const setTheme = useCallback((t) => setThemeStore(t), [setThemeStore]);

    const toggleTheme = useCallback(() => {
        const order = ['dark', 'light', 'system'];
        const idx = order.indexOf(theme);
        setThemeStore(order[(idx + 1) % order.length]);
    }, [theme, setThemeStore]);

    return { theme, resolvedTheme, setTheme, toggleTheme, isDark: resolvedTheme === 'dark' };
}