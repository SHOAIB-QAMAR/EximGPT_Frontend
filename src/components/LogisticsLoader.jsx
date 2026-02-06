import React, { useState, useEffect } from 'react';
import { FaShip, FaPlane, FaTruck, FaBox } from "react-icons/fa6";

/**
 * LogisticsLoader Component
 * Displays a rotating icon animation to indicate AI processing state.
 * Cycles through logistics-related icons (Ship, Plane, Truck, Box).
 */
const LogisticsLoader = () => {
    const icons = [FaShip, FaPlane, FaTruck, FaBox];
    const [index, setIndex] = useState(0);

    // Rotate through icons every 1.2s
    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % icons.length);
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    const CurrentIcon = icons[index];

    return (
        <div className="flex items-center gap-4 p-3 pr-5 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 backdrop-blur-sm">
            <div className="relative flex items-center justify-center w-10 h-10">
                {/* Outer Pulsing Glow */}
                <div className="absolute inset-0 bg-[var(--brand-primary)] rounded-full animate-pulse-ring"></div>

                {/* Rotating Scanner Ring */}
                <div className="absolute inset-0 border-2 border-t-[var(--brand-primary)] border-r-transparent border-b-[var(--brand-primary)]/30 border-l-transparent rounded-full animate-spin-slow"></div>

                {/* Inner Icon Container */}
                <div className="relative z-10 w-8 h-8 bg-[var(--bg-card)] rounded-full flex items-center justify-center shadow-inner border border-[var(--border-color)]">
                    <CurrentIcon className="text-[var(--brand-primary)] text-xs transition-all duration-300 transform scale-100" />
                </div>
            </div>

            <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-[var(--text-primary)] tracking-wide uppercase">AI Processing...</span>
            </div>
        </div>
    );
};

export default LogisticsLoader;