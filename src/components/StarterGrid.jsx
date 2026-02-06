import React from 'react';
import { FaSackDollar, FaBarcode, FaShip, FaCalculator, FaMapLocationDot, FaFileInvoiceDollar } from "react-icons/fa6";

const starters = [
    {
        title: "Freight Rates",
        description: "View transport costs for sea, air, or land shipments",
        icon: <FaSackDollar />
    },
    {
        title: "HSN Code",
        description: "Find correct HSN codes for customs and tax purposes",
        icon: <FaBarcode />
    },
    {
        title: "Vessel Schedule",
        description: "Check vessel arrival, departure, and transit details",
        icon: <FaShip />
    },
    {
        title: "Import Duty Calculation",
        description: "Estimate import duties and applicable taxes easily",
        icon: <FaCalculator />
    }
];

const StarterGrid = ({ onStarterClick }) => {
    return (
        <div className="w-full max-w-[1000px] mx-auto">
            {/* Mobile/Compact: Pills */}
            {/* Visibility controlled by strictly defined constraints via index.css */}
            <div className="flex flex-wrap justify-center gap-2 mobile-ui-visible px-2">
                {starters.map((starter, idx) => (
                    <button
                        key={idx}
                        className="px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] rounded-full shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-[13px] font-medium text-[var(--text-primary)] hover:text-[var(--brand-primary)]"
                        onClick={() => onStarterClick && onStarterClick(starter.description)}
                    >
                        {starter.title}
                    </button>
                ))}
            </div>

            {/* Desktop/Tablet: Full cards */}
            {/* Visibility strictly controlled via index.css: Requires Width >= 768px AND Height >= 600px */}
            <div className="hidden desktop-ui-visible flex-wrap justify-center gap-4">
                {starters.map((starter, idx) => (
                    <div
                        key={idx}
                        className="group relative flex flex-col p-5 bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer w-[180px] h-[180px] overflow-hidden hover:-translate-y-1 hover:scale-[1.02]"
                        onClick={() => onStarterClick && onStarterClick(starter.description)}
                    >
                        {/* Gradient Blob Effect */}
                        <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-[var(--brand-primary)] text-xl">
                                    {starter.icon}
                                </span>
                                <h4 className="text-[16px] font-semibold text-[var(--text-primary)] leading-tight">
                                    {starter.title}
                                </h4>
                            </div>

                            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-2 line-clamp-3">
                                {starter.description}
                            </p>
                            <div className="mt-auto">
                                <button
                                    className={`w-full py-2 text-[13px] font-medium rounded-lg transition-all duration-300 shadow-sm
                                        ${idx === 0
                                            ? 'bg-[var(--brand-primary)] text-white shadow-md'
                                            : 'bg-white text-gray-900 border border-[var(--border-color)] group-hover:bg-[var(--brand-primary)] group-hover:text-white group-hover:border-transparent'
                                        }`}
                                >
                                    Get started
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StarterGrid;
