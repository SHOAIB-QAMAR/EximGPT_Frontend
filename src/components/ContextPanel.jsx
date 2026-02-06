import React, { useEffect, useState } from 'react';
import { FaXmark, FaArrowUpRightFromSquare, FaGlobe } from "react-icons/fa6";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const ContextPanel = ({ isOpen, onClose, data }) => {
    const [renderParams, setRenderParams] = useState({ show: false, animate: false });
    const [iframeLoading, setIframeLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setRenderParams({ show: true, animate: true });
            setIframeLoading(true); // Reset loading on open
        } else {
            setRenderParams(prev => ({ ...prev, animate: false }));
            const timer = setTimeout(() => setRenderParams({ show: false, animate: false }), 400); // Match refined duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Reset loading when data changes
    useEffect(() => {
        if (data?.type === 'link') {
            setIframeLoading(true);
        }
    }, [data]);

    if (!renderParams.show) return null;

    return (
        <>
            {/* Backdrop for mobile - smooth fade */}
            <div
                className={`md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] ${renderParams.animate ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
                style={{ pointerEvents: renderParams.show ? 'auto' : 'none' }}
            />

            {/* Panel Container */}
            <div
                className={`
                    z-50 flex flex-col bg-[var(--bg-card)]/95 backdrop-blur-2xl overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]
                    
                    /* Mobile: Fixed overlay, full width, slide-in */
                    fixed top-0 right-0 h-full w-full
                    ${renderParams.animate ? 'translate-x-0' : 'translate-x-full'}

                    /* Desktop: Relative sidebar, width transition (Squeeze), no transform */
                    md:relative md:top-auto md:right-auto md:h-full md:transform-none md:translate-x-0
                    ${renderParams.animate ? 'md:w-[400px] md:opacity-100' : 'md:w-0 md:opacity-0'}
                `}
            >
                {/* Inner Container - Fixed width to prevent squash effect during width transition */}
                <div className="w-full md:w-[400px] h-full flex flex-col min-w-[320px]">
                    {/* Header - Styled to match main Header.jsx for unified look */}
                    <div className="flex items-center justify-between px-3 md:px-5 py-2 md:py-3 h-14 md:h-16 border-b border-[var(--border-color)] bg-[var(--bg-card)]/95 backdrop-blur-md shrink-0 shadow-sm text-[var(--text-primary)]">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)] shrink-0">
                                {data?.type === 'link' ? <FaGlobe className="text-sm md:text-base" /> : <span className="font-bold text-xs">Txt</span>}
                            </div>
                            <h3 className="font-semibold text-base md:text-lg text-[var(--text-primary)] truncate leading-none">
                                {data?.title || 'Context'}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95"
                            title="Close Panel"
                        >
                            <FaXmark className="text-lg" />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative bg-[var(--bg-card)]">
                        {data?.type === 'link' && (
                            <div className="flex flex-col h-full relative">
                                {/* Loading Indicator */}
                                {iframeLoading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-secondary)] z-10">
                                        <AiOutlineLoading3Quarters className="animate-spin text-3xl text-[var(--brand-primary)] mb-3" />
                                        <span className="text-sm text-[var(--text-secondary)] animate-pulse">Loading preview...</span>
                                    </div>
                                )}

                                {/* Iframe */}
                                <iframe
                                    src={data.content}
                                    title="Preview"
                                    className={`w-full h-full bg-white transition-opacity duration-500 ${iframeLoading ? 'opacity-0' : 'opacity-100'}`}
                                    sandbox="allow-scripts allow-same-origin allow-forms"
                                    onLoad={() => setIframeLoading(false)}
                                />

                                {/* Floating Open Button - Bottom Right Overlay */}
                                <a
                                    href={data.content}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-highlight)] rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 z-20"
                                >
                                    <span>Open</span>
                                    <FaArrowUpRightFromSquare className="text-xs" />
                                </a>
                            </div>
                        )}

                        {data?.type === 'text' && (
                            <div className="p-6">
                                <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--text-primary)] leading-relaxed">
                                    {data.content}
                                </div>
                            </div>
                        )}

                        {!data?.type && (
                            <div className="flex-1 flex items-center justify-center p-6 text-[var(--text-secondary)] italic">
                                No content available.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ContextPanel;
