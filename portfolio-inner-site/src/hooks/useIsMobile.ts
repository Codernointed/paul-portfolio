import useViewport from './useViewport';

export default function useIsMobile(): boolean {
    return useViewport().isMobile;
}
