import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

export default function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(
        window.innerWidth < MOBILE_BREAKPOINT
    );

    useEffect(() => {
        const onResize = () =>
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        window.addEventListener('resize', onResize, false);
        return () => window.removeEventListener('resize', onResize, false);
    }, []);

    return isMobile;
}
