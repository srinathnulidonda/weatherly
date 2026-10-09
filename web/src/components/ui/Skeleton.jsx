// web/src/components/ui/Skeleton.jsx
import { cn } from '@/lib/cn';

function Skeleton({ className, ...props }) {
    return <div className={cn('skeleton-surface', className)} {...props} />;
}

function SkeletonCard({ className }) {
    return (
        <div className={cn('glass-metric p-4 space-y-3 min-h-[100px]', className)}>
            <div className="flex items-center justify-between">
                <Skeleton className="h-2.5 w-16 rounded-full" />
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
            </div>
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-2.5 w-24 rounded-full" />
        </div>
    );
}

function SkeletonRow({ className }) {
    return (
        <div className={cn('flex items-center gap-3 py-3', className)}>
            <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-28 rounded-full" />
                <Skeleton className="h-2.5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-10 rounded-full shrink-0" />
        </div>
    );
}

function SkeletonHero({ className }) {
    return (
        <div className={cn('relative rounded-5xl overflow-hidden min-h-[440px] p-6 sm:p-8 flex flex-col justify-between skeleton-surface', className)}>
            <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-28 rounded-full !bg-white/15" />
                <Skeleton className="h-7 w-16 rounded-full !bg-white/15" />
            </div>
            <div className="flex items-end justify-between gap-4 mt-8">
                <div className="space-y-3">
                    <Skeleton className="h-16 sm:h-20 w-40 rounded-2xl !bg-white/20" />
                    <Skeleton className="h-4 w-32 rounded-full !bg-white/15" />
                </div>
                <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-full !bg-white/15" />
            </div>
            <div className="flex items-center gap-2 mt-8">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-28 rounded-full !bg-white/10 shrink-0" />
                ))}
            </div>
        </div>
    );
}

export { Skeleton, SkeletonCard, SkeletonRow, SkeletonHero };
export default Skeleton;