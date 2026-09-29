import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Easing } from '../Animation';

interface ViewToggleProps {}

// Round-trip partner to the "3D VIEW" button in the 2D OS's toolbar
// (portfolio-inner-site/src/components/os/Toolbar.tsx): both just navigate
// to /__view/<mode>, which the edge middleware (site/request-router.mjs)
// turns into a cookie + redirect. Always rendered, on both desktop and
// mobile, so a visitor who reached the 3D shell any way (default on
// desktop, or by switching from the 2D OS on mobile) can always get back.
const ViewToggle: React.FC<ViewToggleProps> = ({}) => {
    const [isHovering, setIsHovering] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const switchToOS = useCallback((event: React.MouseEvent) => {
        setIsActive(true);
        event.preventDefault();
        const to = encodeURIComponent(
            window.location.pathname + window.location.search
        );
        window.location.href = `/__view/os?to=${to}`;
    }, []);

    return (
        <motion.div
            id="prevent-click"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseDown={switchToOS}
            style={styles.container}
            animate={isActive ? 'active' : isHovering ? 'hovering' : 'default'}
            variants={labelVars}
            title="Switch to the 2D view"
        >
            <p id="prevent-click" style={styles.label}>
                2D VIEW
            </p>
        </motion.div>
    );
};

const labelVars = {
    hovering: {
        opacity: 0.8,
        transition: { duration: 0.1, ease: 'easeOut' },
    },
    active: {
        scale: 0.95,
        opacity: 0.5,
        transition: { duration: 0.1, ease: Easing.expOut },
    },
    default: {
        scale: 1,
        opacity: 1,
        transition: { duration: 0.2, ease: 'easeOut' },
    },
};

const styles: StyleSheetCSS = {
    container: {
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 100000,
        background: 'black',
        padding: 6,
        paddingLeft: 10,
        paddingRight: 10,
        boxSizing: 'border-box',
        cursor: 'pointer',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        color: 'white',
        fontSize: 10,
        letterSpacing: 1,
    },
};

export default ViewToggle;
