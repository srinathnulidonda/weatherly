// web/src/components/settings/LocationManager.jsx
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, X, MapPin, Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useStore } from '@/stores/store';

function LocationRow({ item, onRemove, onSelect, isActive }) {
    const controls = useDragControls();

    return (
        <Reorder.Item value={item} dragListener={false} dragControls={controls} className="list-none">
            <div
                className={cn(
                    'flex items-center gap-1 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border transition-colors',
                    isActive
                        ? 'bg-orange-500/10 border-orange-500/20'
                        : 'bg-white dark:bg-white/[0.03] border-stone-200 dark:border-white/[0.06]'
                )}
            >
                <button
                    onPointerDown={(e) => controls.start(e)}
                    className="min-touch shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-stone-300 dark:text-stone-600 touch-none"
                    aria-label="Reorder"
                >
                    <GripVertical size={15} />
                </button>
                <button onClick={() => onSelect(item.id)} className="flex-1 flex items-center gap-2 sm:gap-2.5 min-w-0 text-left min-h-[40px] sm:min-h-[44px] px-1">
                    <div className={cn(
                        'w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0',
                        isActive ? 'bg-orange-500/15' : 'bg-stone-100 dark:bg-white/[0.05]'
                    )}>
                        <MapPin size={13} className={isActive ? 'text-orange-500' : 'text-stone-400'} />
                    </div>
                    <span className={cn(
                        'text-[13px] sm:text-sm font-medium truncate flex-1',
                        isActive ? 'text-orange-600 dark:text-orange-400' : 'text-stone-700 dark:text-stone-300'
                    )}>
                        {item.city || item.name}
                    </span>
                    {isActive && <Star size={11} className="text-orange-500 fill-orange-500 shrink-0" />}
                </button>
                <button
                    onClick={() => onRemove(item.id)}
                    className="min-touch shrink-0 flex items-center justify-center rounded-full text-stone-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    aria-label="Remove location"
                >
                    <X size={14} />
                </button>
            </div>
        </Reorder.Item>
    );
}

function LocationManager({ className }) {
    const savedLocations = useStore((s) => s.savedLocations);
    const activeLocationId = useStore((s) => s.activeLocationId);
    const setActiveLocationId = useStore((s) => s.setActiveLocationId);
    const removeSavedLocation = useStore((s) => s.removeSavedLocation);
    const reorderSavedLocations = useStore((s) => s.reorderSavedLocations);

    if (savedLocations.length === 0) {
        return (
            <div className={cn('flex flex-col items-center py-6 sm:py-8 text-center', className)}>
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-stone-100 dark:bg-white/[0.05] flex items-center justify-center mb-2 sm:mb-2.5">
                    <MapPin size={16} className="text-stone-400" />
                </div>
                <p className="text-xs sm:text-sm text-stone-400 max-w-[220px]">
                    No saved locations yet. Search for a city to add one.
                </p>
            </div>
        );
    }

    return (
        <Reorder.Group axis="y" values={savedLocations} onReorder={reorderSavedLocations} className={cn('space-y-1.5 sm:space-y-2', className)}>
            {savedLocations.map((loc) => (
                <LocationRow
                    key={loc.id}
                    item={loc}
                    isActive={activeLocationId === loc.id}
                    onSelect={setActiveLocationId}
                    onRemove={removeSavedLocation}
                />
            ))}
        </Reorder.Group>
    );
}

export { LocationManager };
export default LocationManager;