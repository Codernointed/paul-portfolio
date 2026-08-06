import { getViewportSize } from './useViewport';

export default function useInitialWindowSize({ margin }: { margin?: number }) {
    const m = margin || 0;

    // Uses the CSS viewport, not window.innerWidth - see useViewport.ts for
    // why those two can disagree on Android.
    const { width, height } = getViewportSize();

    return { initWidth: width - m, initHeight: height - m };
}
