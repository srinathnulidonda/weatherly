// web/src/components/ui/ErrorBoundary.jsx
import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
        this.handleReload = this.handleReload.bind(this);
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        if (import.meta.env.VITE_ENABLE_DEBUG_TOOLS === 'true') {
            console.error('[Weatherly] Uncaught render error:', error, info);
        }
    }

    handleReload() {
        this.setState({ error: null });
    }

    render() {
        const { error } = this.state;
        const { children, variant = 'full', fallback: Fallback } = this.props;

        if (!error) return children;

        if (Fallback) return <Fallback error={error} onReload={this.handleReload} />;

        if (variant === 'inline') {
            return (
                <div className="glass p-6 flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle size={22} className="text-red-500" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                            This section failed to load
                        </h2>
                        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                            {error?.message || 'An unexpected error occurred.'}
                        </p>
                    </div>
                    <button onClick={this.handleReload} className="btn-outline" type="button">
                        <RefreshCw size={14} />
                        Try again
                    </button>
                </div>
            );
        }

        return (
            <div className="min-h-dvh flex items-center justify-center p-6 bg-stone-50 dark:bg-stone-950">
                <div className="w-full max-w-md glass-elevated p-6 sm:p-8 flex flex-col items-center text-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle size={26} className="text-red-500" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                            Something went wrong
                        </h1>
                        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                            {error?.message || 'The app encountered an unexpected error.'}
                        </p>
                    </div>
                    <button onClick={this.handleReload} className="btn-primary" type="button">
                        <RefreshCw size={14} />
                        Try again
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                        type="button"
                    >
                        Reload the page
                    </button>
                </div>
            </div>
        );
    }
}

export { ErrorBoundary };
export default ErrorBoundary;