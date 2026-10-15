// src/components/download/AppIcon.jsx
import logoImage from '@/assets/app_icon.webp';

function AppIcon({ size = 72, className = '' }) {
    return (
        <div
            className={`relative shrink-0 overflow-hidden rounded-[22%] bg-stone-900 shadow-[0_6px_20px_-4px_rgba(0,0,0,0.25)] dark:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.6)] ring-1 ring-black/[0.06] dark:ring-white/[0.08] ${className}`}
            style={{ width: size, height: size }}
        >
            <img src={logoImage} alt="" className="w-full h-full object-cover" draggable={false} />
            <div className="pointer-events-none absolute inset-0 rounded-[22%] ring-1 ring-inset ring-white/10" />
        </div>
    );
}

export { AppIcon };
export default AppIcon;