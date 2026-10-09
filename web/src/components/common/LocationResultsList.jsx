// web/src/components/common/LocationResultsList.jsx
import { MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getFlagEmoji } from '@/utils/flags';

function LocationResultsList({ results, onSelect, className, showAddress = false, showFlag = false, size = 'md' }) {
    if (!results?.length) return null;
    const iconSize = size === 'sm' ? 11 : 12;
    const textSize = size === 'sm' ? 'text-[11px]' : 'text-[13px] sm:text-sm';

    return (
        <ul className={cn('divide-y divide-stone-100 dark:divide-white/[0.04]', className)}>
            {results.map((r, idx) => {
                const flag = showFlag ? getFlagEmoji(r.country_code) : null;
                return (
                    <li key={`${r.latitude}-${r.longitude}-${idx}`}>
                        <button
                            type="button"
                            onClick={() => onSelect(r)}
                            className="w-full flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 py-2.5 sm:py-3 text-left hover:bg-stone-50 dark:hover:bg-white/[0.03] active:bg-stone-100 dark:active:bg-white/[0.05] transition-colors group min-h-[46px] sm:min-h-[52px] focus-ring"
                        >
                            {flag ? (
                                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-stone-100 dark:bg-white/[0.05] flex items-center justify-center shrink-0 text-sm sm:text-base" aria-hidden="true">
                                    {flag}
                                </span>
                            ) : (
                                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-stone-100 dark:bg-white/[0.05] flex items-center justify-center shrink-0" aria-hidden="true">
                                    <MapPin size={iconSize} className="text-stone-400" />
                                </span>
                            )}
                            <div className="min-w-0 flex-1">
                                <span className={cn(textSize, 'font-medium text-stone-900 dark:text-stone-100 truncate block')}>
                                    {r.name || r.city}
                                </span>
                                {showAddress && r.formatted_address && r.formatted_address !== r.name && (
                                    <span className="text-[10px] sm:text-[11px] text-stone-500 truncate block mt-0.5">
                                        {r.formatted_address}
                                    </span>
                                )}
                            </div>
                            {r.country_code && !flag && (
                                <span className="text-[9px] sm:text-[10px] text-stone-400 uppercase shrink-0">{r.country_code}</span>
                            )}
                            <ChevronRight size={13} className="text-stone-300 dark:text-stone-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150" aria-hidden="true" />
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

export { LocationResultsList };
export default LocationResultsList;