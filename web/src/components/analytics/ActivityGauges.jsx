// web/src/components/analytics/ActivityGauges.jsx
import { motion } from 'framer-motion';
import {
    Smile, Activity, Bike, TreePine, Flower2, Car, Sun, Footprints,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { getGaugeToken } from '@/lib/theme';

const ACTIVITIES = [
    { key: 'comfort_index', label: 'Comfort', icon: Smile },
    { key: 'outdoor_activity_index', label: 'Outdoor', icon: Activity },
    { key: 'running_index', label: 'Running', icon: Footprints },
    { key: 'cycling_index', label: 'Cycling', icon: Bike },
    { key: 'gardening_index', label: 'Gardening', icon: TreePine },
    { key: 'allergy_index', label: 'Allergy', icon: Flower2 },
    { key: 'driving_index', label: 'Driving', icon: Car },
];

function ActivityGauges({ data, className }) {
    if (!data) return null;

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Activity Indices</CardTitle>
                {data.uv_protection_needed && (
                    <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                        <Sun size={12} />
                        UV Protection Needed
                    </span>
                )}
            </CardHeader>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {ACTIVITIES.map((activity, i) => {
                    const value = data[activity.key];
                    if (value == null) return null;
                    const Icon = activity.icon;
                    const token = getGaugeToken(value);
                    const color = token.hex;
                    const label = token.label;
                    const normalized = Math.max(0, Math.min(100, value));
                    const circumference = 2 * Math.PI * 32;
                    const offset = circumference - (normalized / 100) * circumference;

                    return (
                        <motion.div
                            key={activity.key}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-stone-50 dark:bg-white/[0.02]"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05, duration: 0.3 }}
                        >
                            <div className="relative w-[76px] h-[76px]">
                                <svg viewBox="0 0 76 76" className="w-full h-full -rotate-90" aria-hidden="true">
                                    <circle
                                        cx="38" cy="38" r="32"
                                        fill="none"
                                        stroke="currentColor"
                                        className="text-stone-200 dark:text-white/[0.06]"
                                        strokeWidth="5"
                                    />
                                    <motion.circle
                                        cx="38" cy="38" r="32"
                                        fill="none"
                                        stroke={color}
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        initial={{ strokeDashoffset: circumference }}
                                        animate={{ strokeDashoffset: offset }}
                                        transition={{ duration: 1, delay: i * 0.08, ease: 'easeOut' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <Icon size={14} style={{ color }} className="mb-0.5" />
                                    <span className="text-base font-bold text-stone-900 dark:text-stone-100 leading-none">
                                        {Math.round(normalized)}
                                    </span>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
                                    {activity.label}
                                </p>
                                <p className="text-[10px] font-medium" style={{ color }}>
                                    {label}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </Card>
    );
}

export { ActivityGauges };
export default ActivityGauges;