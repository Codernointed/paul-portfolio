import { useEffect, useState } from 'react';

export const MOBILE_BREAKPOINT = 768;

/**
 * Reads the CSS viewport rather than window.innerWidth.
 *
 * These disagree when a page overflows horizontally: Chrome on Android
 * expands the layout viewport to fit the content, so window.innerWidth can
 * report ~873 on a 360px phone while documentElement.clientWidth (and every
 * CSS media query) correctly stays at 360. Trusting innerWidth silently
 * turned off the entire mobile layout on those devices.
 */
export function getViewportSize(): { width: number; height: number } {
    const el = document.documentElement;
    return {
        width: Math.min(
            el.clientWidth || window.innerWidth,
            window.innerWidth || el.clientWidth
        ),
        height: Math.min(
            el.clientHeight || window.innerHeight,
            window.innerHeight || el.clientHeight
        ),
    };
}

export default function useViewport() {
    const [size, setSize] = useState(getViewportSize);

    useEffect(() => {
        const onResize = () => setSize(getViewportSize());
        window.addEventListener('resize', onResize, false);
        window.addEventListener('orientationchange', onResize, false);
        return () => {
            window.removeEventListener('resize', onResize, false);
            window.removeEventListener('orientationchange', onResize, false);
        };
    }, []);

    return { ...size, isMobile: size.width < MOBILE_BREAKPOINT };
}
