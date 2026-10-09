// web/src/pages/NotFound.jsx
import { useNavigate } from 'react-router-dom';
import { CloudOff, Home } from 'lucide-react';
import { PageTransition } from '@/components/common/PageTransition';
import { Button } from '@/components/ui/Button';

function NotFound() {
    const navigate = useNavigate();

    return (
        <PageTransition>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-20 h-20 rounded-2xl bg-stone-100 dark:bg-white/[0.05] flex items-center justify-center mb-6">
                    <CloudOff size={40} className="text-stone-400 dark:text-stone-500" />
                </div>
                <h1 className="text-6xl font-extralight text-stone-300 dark:text-stone-700 mb-2">404</h1>
                <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
                    Page not found
                </h2>
                <p className="text-sm text-stone-500 max-w-sm mb-6">
                    The page you're looking for doesn't exist or has been moved.
                    Let's get you back to the weather.
                </p>
                <Button onClick={() => navigate('/')}>
                    <Home size={16} />
                    Back to Weather
                </Button>
            </div>
        </PageTransition>
    );
}

export default NotFound;