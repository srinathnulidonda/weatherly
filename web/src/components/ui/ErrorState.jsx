// web/src/components/ui/ErrorState.jsx
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

function ErrorState({ error, onRetry, className, compact = false }) {
    const isNetwork = error?.code === 'NETWORK_ERROR' || error?.code === 'TIMEOUT';
    const isRateLimit = error?.code === 'RATE_LIMIT_EXCEEDED' || error?.status === 429;

    const Icon = isNetwork ? WifiOff : AlertTriangle;

    const title = isRateLimit
        ? 'Too Many Requests'
        : isNetwork
            ? 'Connection Error'
            : 'Something went wrong';

    const message = isRateLimit
        ? `Please wait ${error.retryAfter || 60} seconds before trying again.`
        : typeof error === 'string'
            ? error
            : error?.message || 'An unexpected error occurred.';

    if (compact) {
        return (
            <div className={cn('flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20', className)}>
                <Icon size={16} className="shrink-0 text-red-500" />
                <p className="text-sm text-red-600 dark:text-red-400 flex-1 min-w-0 truncate">{message}</p>
                {onRetry && (
                    <Button variant="ghost" size="sm" onClick={onRetry} className="shrink-0 text-red-500 hover:text-red-400">
                        <RefreshCw size={14} />
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                <Icon size={28} className="text-red-500" />
            </div>
            <h3 className="text-base font-medium text-stone-700 dark:text-stone-300 mb-1">{title}</h3>
            <p className="text-sm text-stone-500 max-w-sm mb-4">{message}</p>
            {onRetry && !isRateLimit && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw size={14} />
                    Try again
                </Button>
            )}
        </div>
    );
}

export { ErrorState };
export default ErrorState;