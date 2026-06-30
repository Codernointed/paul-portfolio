import React, { useState } from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';

export interface MobileAppsProps extends WindowAppProps {}

// Auto-load every screenshot dropped into assets/pictures/mobile.
// Name files "<prefix>-<n>.png" (e.g. somayen-1.png) — see that folder's README.
// @ts-ignore - webpack require.context
const screenshotCtx = (require as any).context(
    '../../assets/pictures/mobile',
    false,
    /\.(png|jpe?g|webp)$/
);
const ALL_SCREENS: { key: string; src: string }[] = screenshotCtx
    .keys()
    .map((k: string) => ({
        key: k.replace('./', '').toLowerCase(),
        src: screenshotCtx(k) as string,
    }));

const screensFor = (prefix: string): string[] =>
    ALL_SCREENS.filter((s) => s.key.startsWith(prefix))
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((s) => s.src);

interface App {
    name: string;
    prefix: string;
    tagline: string;
    description: string;
    playStore?: string;
    github?: string;
}

const APPS: App[] = [
    {
        name: 'Somayen Delivery',
        prefix: 'somayen',
        tagline: 'On-demand delivery · Orctatech',
        description:
            'A full delivery platform built for the Ghanaian market — ' +
            'real-time order tracking, vendor and rider management, and ' +
            'in-app ordering. Built with Flutter at Orctatech and published ' +
            'to the Google Play Store.',
        playStore:
            'https://play.google.com/store/apps/details?id=com.orctatech.somayendeliveryapp',
    },
    {
        name: 'Utim8',
        prefix: 'utim8',
        tagline: 'Published on Google Play',
        description:
            'A mobile app published to the Google Play Store (io.utim8.app). ' +
            'Built with Flutter.',
        playStore: 'https://play.google.com/store/apps/details?id=io.utim8.app',
    },
];

const MobileApps: React.FC<MobileAppsProps> = (props) => {
    const [active, setActive] = useState(0);
    const app = APPS[active];
    const screens = screensFor(app.prefix);

    return (
        <Window
            top={32}
            left={32}
            width={1000}
            height={760}
            windowTitle="Mobile Apps"
            windowBarIcon="windowGameIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={'Mobile apps built & shipped by Paul Botchwey'}
        >
            <div style={styles.container}>
                {/* App switcher */}
                <div style={styles.tabs}>
                    {APPS.map((a, i) => (
                        <div
                            key={a.prefix}
                            onMouseDown={() => setActive(i)}
                            className="big-button-container"
                            style={Object.assign(
                                {},
                                styles.tab,
                                i === active && styles.tabActive
                            )}
                        >
                            <p style={styles.tabText}>{a.name}</p>
                        </div>
                    ))}
                </div>

                <div style={styles.content}>
                    <h2 style={styles.appName}>{app.name}</h2>
                    <p style={styles.tagline}>{app.tagline}</p>
                    <br />
                    <p style={styles.description}>{app.description}</p>
                    <br />
                    <div style={styles.badges}>
                        {app.playStore && (
                            <a
                                href={app.playStore}
                                target="_blank"
                                rel="noreferrer"
                                style={styles.badge}
                            >
                                ▶ Get it on Google Play
                            </a>
                        )}
                        {app.github && (
                            <a
                                href={app.github}
                                target="_blank"
                                rel="noreferrer"
                                style={styles.badge}
                            >
                                ⌥ View source on GitHub
                            </a>
                        )}
                    </div>
                    <br />

                    {/* Screenshot gallery */}
                    {screens.length > 0 ? (
                        <div style={styles.gallery}>
                            {screens.map((src, i) => (
                                <div key={i} style={styles.phone}>
                                    <img
                                        src={src}
                                        alt={`${app.name} screenshot ${i + 1}`}
                                        style={styles.shot}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={styles.placeholder}>
                            <p style={styles.placeholderText}>
                                Screenshots coming soon.
                            </p>
                            {app.playStore && (
                                <a
                                    href={app.playStore}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={styles.placeholderLink}
                                >
                                    View {app.name} on the Play Store ↗
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Window>
    );
};

const styles: StyleSheetCSS = {
    container: {
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        backgroundColor: Colors.white,
    },
    tabs: {
        flexDirection: 'row',
        padding: 8,
        backgroundColor: Colors.lightGray,
        borderBottom: `1px solid ${Colors.darkGray}`,
    },
    tab: {
        padding: '6px 16px',
        marginRight: 6,
        cursor: 'pointer',
        backgroundColor: Colors.lightGray,
        border: `1px solid ${Colors.white}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
    },
    tabActive: {
        backgroundColor: Colors.darkGray,
        border: `1px solid ${Colors.black}`,
        borderBottomColor: Colors.white,
        borderRightColor: Colors.white,
    },
    tabText: {
        fontFamily: 'MSSerif',
        fontSize: 14,
    },
    content: {
        flex: 1,
        flexDirection: 'column',
        padding: 24,
        overflowY: 'auto',
    },
    appName: {
        fontSize: 32,
    },
    tagline: {
        color: Colors.blue,
        fontFamily: 'MSSerif',
        fontSize: 14,
        marginTop: 4,
    },
    description: {
        maxWidth: 700,
        lineHeight: 1.5,
    },
    badges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    badge: {
        fontFamily: 'MSSerif',
        fontSize: 14,
        marginRight: 12,
        marginBottom: 8,
        padding: '8px 16px',
        backgroundColor: Colors.lightGray,
        border: `1px solid ${Colors.white}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
        color: Colors.black,
        textDecoration: 'none',
        cursor: 'pointer',
    },
    gallery: {
        flexDirection: 'row',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        paddingBottom: 16,
    },
    phone: {
        flexShrink: 0,
        width: 220,
        marginRight: 16,
        border: `4px solid ${Colors.black}`,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: Colors.black,
    },
    shot: {
        width: '100%',
        display: 'block',
    },
    placeholder: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 32,
        border: `2px dashed ${Colors.darkGray}`,
        backgroundColor: Colors.lightGray,
    },
    placeholderText: {
        fontFamily: 'MSSerif',
        fontSize: 16,
        marginBottom: 12,
    },
    placeholderLink: {
        fontFamily: 'MSSerif',
        fontSize: 14,
        color: Colors.blue,
    },
};

export default MobileApps;
