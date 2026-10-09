// web/src/components/home/LocationBar.jsx
import { MapPin, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useStore } from '@/stores/store';
import { useActiveLocation } from '@/hooks/useActiveLocation';

function LocationBar({ className }) {
    const setLocationPanelOpen = useStore((s) => s.setLocationPanelOpen);
    const { label, ready } = useActiveLocation();

    return (
        <button
            onClick={() => setLocationPanelOpen(true)}
            className={cn(
                'flex items-center gap-1.5 px-3.5 rounded-full glass-pill min-touch hover:bg-white/90 dark:hover:bg-white/[0.08] transition-all duration-200 active:scale-[0.97] focus-ring shrink-0',
                className
            )}
        >
            <MapPin size={14} className={cn('shrink-0', ready ? 'text-orange-500' : 'text-amber-500')} />
            <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate max-w-[140px]">
                {label}
            </span>
            <ChevronDown size={12} className="shrink-0 text-stone-400" />
        </button>
    );
}

export { LocationBar };
export default LocationBar;