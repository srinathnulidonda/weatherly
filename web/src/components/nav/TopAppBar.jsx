// web/src/components/nav/TopAppBar.jsx
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { MapPin, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useStore } from '@/stores/store';
import { useActiveLocation } from '@/hooks/useActiveLocation';
import logoImage from '@/assets/logo.png';

function TopAppBar() {
    const navigate = useNavigate();
    const setLocationPanelOpen = useStore((s) => s.setLocationPanelOpen);
    const { label, ready } = useActiveLocation();
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);
    const rafRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (rafRef.current != null) return;
            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null;
                const scrollY = window.pageYOffset;

                if (scrollY > lastScrollY.current && scrollY > 100) {
                    setIsVisible(false);
                } else if (scrollY <= lastScrollY.current || scrollY <= 100) {
                    setIsVisible(true);
                }

                lastScrollY.current = scrollY;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafRef.current != null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, []);

    return (
        <header
            className={cn(
                'md:hidden sticky top-0 z-topbar glass-topbar safe-area-top',
                isVisible ? 'translate-y-0' : '-translate-y-full',
                'transition-transform duration-300'
            )}
        >
            <div className="flex items-center gap-2 h-topbar px-3">
                <button
                    onClick={() => navigate('/')}
                    className="shrink-0 rounded-full active:scale-90 transition-transform duration-150"
                    aria-label="Go to home"
                >
                    <img src={logoImage} alt="Weatherly" className="w-7 h-7 object-contain" />
                </button>

                <button
                    onClick={() => setLocationPanelOpen(true)}
                    className="flex-1 min-w-0 flex items-center justify-center gap-1.5 h-9 rounded-full px-3 glass-pill active:scale-[0.98] transition-all duration-150"
                    aria-label="Change location"
                >
                    <span className="relative flex items-center justify-center shrink-0">
                        <MapPin
                            size={12}
                            className={cn(ready ? 'text-orange-500' : 'text-amber-500')}
                        />
                        {!ready && (
                            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        )}
                    </span>
                    <span className="text-[13px] font-semibold truncate text-stone-800 dark:text-stone-100 max-w-[150px]">
                        {label}
                    </span>
                    <ChevronDown size={12} className="text-stone-400 shrink-0" />
                </button>

                <button
                    onClick={() => navigate('/search')}
                    className="btn-icon !w-9 !h-9 shrink-0"
                    aria-label="Search for a city"
                >
                    <Search size={16} />
                </button>
            </div>
        </header>
    );
}

export { TopAppBar };
export default TopAppBar;