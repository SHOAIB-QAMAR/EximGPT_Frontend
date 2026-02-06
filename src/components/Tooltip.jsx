import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Reusable Tooltip component using React Portal and Tailwind CSS.
 * 
 * @param {Object} props
 * @param {string|React.ReactNode} props.content - Content to display inside the tooltip
 * @param {React.ReactNode} props.children - The element that triggers the tooltip
 * @param {string} props.position - Preferred position: 'top', 'bottom', 'left', 'right' (default: 'top')
 * @param {boolean} props.disabled - specific manual disable flag
 * @param {boolean} props.forceOpen - For manually controlling visibility (e.g. for error messages)
 * @param {string} props.className - Custom classes for the trigger wrapper
 * @param {number} props.delay - Delay in ms before showing tooltip (default: 200)
 */

const Tooltip = ({
    content,
    children,
    position = 'top',
    disabled = false,
    forceOpen = undefined,
    className = '',
    delay = 200
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const timerRef = useRef(null);

    // Handle controlled vs uncontrolled state
    const show = forceOpen !== undefined ? forceOpen : isVisible;

    const updatePosition = () => {
        if (!triggerRef.current || !show) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        // Gap between trigger and tooltip
        const gap = 8;

        let top = 0;
        let left = 0;

        // Simple positioning logic
        switch (position) {
            case 'top':
                top = rect.top + scrollY - gap;
                left = rect.left + scrollX + rect.width / 2;
                break;
            case 'bottom':
                top = rect.bottom + scrollY + gap;
                left = rect.left + scrollX + rect.width / 2;
                break;
            case 'left':
                top = rect.top + scrollY + rect.height / 2;
                left = rect.left + scrollX - gap;
                break;
            case 'right':
                top = rect.top + scrollY + rect.height / 2;
                left = rect.right + scrollX + gap;
                break;
            default:
                top = rect.bottom + scrollY + gap;
                left = rect.left + scrollX + rect.width / 2;
        }

        setCoords({ top, left });
    };

    useEffect(() => {
        if (show) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);
        }
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [show, position]);

    const handleMouseEnter = () => {
        if (disabled) return;
        timerRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsVisible(false);
    };

    // Calculate transform based on position to center/align the tooltip
    const getTransform = () => {
        switch (position) {
            case 'top': return 'translate(-50%, -100%)';
            case 'bottom': return 'translate(-50%, 0)';
            case 'left': return 'translate(-100%, -50%)';
            case 'right': return 'translate(0, -50%)';
                return 'translate(-50%, 0)';
        }
    };

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`inline-block ${className}`}
            >
                {children}
            </div>

            {show && createPortal(
                <div
                    className="fixed z-[10000] px-3 py-1.5 text-xs font-medium bg-white dark:bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-md shadow-lg pointer-events-none transition-opacity duration-200 animate-in fade-in"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        transform: getTransform(),
                        // Add some max width constraints if needed
                        maxWidth: '200px',
                        whiteSpace: 'normal',
                        textAlign: 'center'
                    }}
                >
                    {content}
                    {/* Optional Arrow could be added here if desired */}
                </div>,
                document.body
            )}
        </>
    );
};

export default Tooltip;
