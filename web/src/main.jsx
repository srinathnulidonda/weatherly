// web/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import App from './App';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './index.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15000),
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
        mutations: { retry: 1 },
    },
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <MotionConfig reduceMotion="user">
            <QueryClientProvider client={queryClient}>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <ErrorBoundary>
                        <App />
                    </ErrorBoundary>
                </BrowserRouter>
            </QueryClientProvider>
        </MotionConfig>
    </React.StrictMode>
);