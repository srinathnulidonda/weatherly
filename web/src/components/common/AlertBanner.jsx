// web/src/components/alerts/AlertBanner.jsx
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useAlerts } from '@/hooks/useAlerts';
import { getSeverityConfig } from '@/utils/formatters';

const CRITICAL_SEVERITIES = ['extreme', 'severe'];
const DISMISS_KEY = 'weatherly_dismissed_alerts';

function loadDismissed() {
    try {
        return JSON.parse(sessionStorage.getItem(DISMISS_KEY) || '[]');
    } catch {
        return [];
    }
}

function AlertBanner() {
    const { data } = useAlerts({ activeOnly: true, size: 5 });
    const [dismissed, setDismissed] = useState(loadDismissed);
    const navigate = useNavigate();

    const alert = useMemo(() => {
        const alerts = data?.alerts || [];
        return alerts.find((a) => CRITICAL_SEVERITIES.includes(a.severity?.toLowerCase()) && !dismissed.includes(a.id)) || null;
    }, [data, dismissed]);

    const dismiss = (id) => {
        const next = [...dismissed, id];
        setDismissed(next);
        sessionStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    };

    const severity = alert ? getSeverityConfig(alert.severity) : null;

    return (
        <AnimatePresence>
            {alert && (
                <motion.div
                    key={alert.id}
                    role="alertdialog"
                    aria-live="assertive"
                    aria-label={alert.headline}
                    initial={{ y: -24, opacity: 0, scale: 0.97 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -24, opacity: 0, scale: 0.97 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 340 }}
                    className={cn(
                        'rounded-3xl p-4 shadow-elevated flex items-start gap-3',
                        severity.bg, severity.text
                    )}
                >
                    <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                        <AlertTriangle size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold leading-tight">{alert.headline}</p>
                        <p className="text-xs opacity-85 mt-0.5 capitalize">{alert.event_type} · {alert.severity}</p>
                        <button
                            onClick={() => { navigate('/alerts'); dismiss(alert.id); }}
                            className="inline-flex items-center gap-1 text-xs font-semibold mt-2 underline underline-offset-2"
                        >
                            View details <ArrowRight size={12} />
                        </button>
                    </div>
                    <button onClick={() => dismiss(alert.id)} className="p-1.5 rounded-full hover:bg-white/15 transition-colors shrink-0 min-touch" aria-label="Dismiss alert">
                        <X size={16} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export { AlertBanner };
export default AlertBanner;