import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to detect mobile keyboard visibility using the Visual Viewport API.
 * This provides ChatGPT-like keyboard handling behavior on mobile devices.
 * 
 * @returns {Object} - Object containing keyboard visibility state and viewport height
 */
const useKeyboardVisibility = () => {
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [viewportHeight, setViewportHeight] = useState(
        typeof window !== 'undefined' ? window.innerHeight : 0
    );
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const handleResize = useCallback(() => {
        if (typeof window === 'undefined') return;

        const vv = window.visualViewport;
        if (vv) {
            const currentHeight = vv.height;
            const windowHeight = window.innerHeight;
            const heightDiff = windowHeight - currentHeight;

            // Consider keyboard visible if height difference is more than 150px
            // (to account for browser chrome changes and not trigger on small changes)
            const isKeyboardOpen = heightDiff > 150;

            setKeyboardVisible(isKeyboardOpen);
            setViewportHeight(currentHeight);
            setKeyboardHeight(isKeyboardOpen ? heightDiff : 0);

            // Set CSS custom property for use in styles
            document.documentElement.style.setProperty('--visual-viewport-height', `${currentHeight}px`);
            document.documentElement.style.setProperty('--keyboard-height', `${isKeyboardOpen ? heightDiff : 0}px`);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const vv = window.visualViewport;

        // Initial setup
        handleResize();

        if (vv) {
            vv.addEventListener('resize', handleResize);
            vv.addEventListener('scroll', handleResize);
        }

        // Fallback for browsers without visualViewport
        window.addEventListener('resize', handleResize);

        return () => {
            if (vv) {
                vv.removeEventListener('resize', handleResize);
                vv.removeEventListener('scroll', handleResize);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, [handleResize]);

    return {
        keyboardVisible,
        viewportHeight,
        keyboardHeight
    };
};

export default useKeyboardVisibility;
