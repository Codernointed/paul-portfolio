import React, { useState } from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';

export interface LiveSitesProps extends WindowAppProps {}

interface Site {
    name: string;
    tagline: string;
    url: string;
}

const SITES: Site[] = [
    {
        name: 'Nabi Fashion',
        tagline: 'Fashion e-commerce',
        url: 'https://nabifashion.com',
    },
    {
        name: 'AceTours',
        tagline: 'Travel & tours platform',
        url: 'https://acetours.vercel.app',
    },
    {
        name: 'Voyage Diaries',
        tagline: 'Travel journaling app',
        url: 'https://voyagediaries.vercel.app',
    },
    {
        name: 'Cornel Media',
        tagline: 'Media agency site',
        url: 'https://cornelmedia.vercel.app',
    },
    {
        name: 'Losung Optimum',
        tagline: 'Business solutions',
        url: 'https://losungoptimum.com',
    },
];

const LiveSites: React.FC<LiveSitesProps> = (props) => {
    const [active, setActive] = useState(0);
    const site = SITES[active];

    return (
        <Window
            top={24}
            left={24}
            width={1100}
            height={780}
            windowTitle="Live Sites — Web Projects"
            windowBarIcon="windowExplorerIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={'Live production sites built by Paul Botchwey'}
        >
            <div style={styles.container}>
                {/* Address bar */}
                <div style={styles.addressBar}>
                    <p style={styles.addressLabel}>Address</p>
                    <div style={styles.addressField}>
                        <p style={styles.addressText}>{site.url}</p>
                    </div>
                    <a
                        href={site.url}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.openButton}
                    >
                        Open ↗
                    </a>
                </div>
                <div style={styles.body}>
                    {/* Sidebar list */}
                    <div style={styles.sidebar}>
                        {SITES.map((s, i) => (
                            <div
                                key={s.url}
                                onMouseDown={() => setActive(i)}
                                className="big-button-container"
                                style={Object.assign(
                                    {},
                                    styles.siteItem,
                                    i === active && styles.siteItemActive
                                )}
                            >
                                <p style={styles.siteName}>{s.name}</p>
                                <p style={styles.siteTagline}>{s.tagline}</p>
                            </div>
                        ))}
                        <div style={styles.note}>
                            <p style={styles.noteText}>
                                If a site doesn't appear below, it blocks
                                embedding — use the <b>Open ↗</b> button to view
                                it in a new tab.
                            </p>
                        </div>
                    </div>
                    {/* Iframe viewport */}
                    <div style={styles.viewport}>
                        <iframe
                            key={site.url}
                            title={site.name}
                            src={site.url}
                            style={styles.iframe}
                        />
                    </div>
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
        backgroundColor: Colors.lightGray,
    },
    addressBar: {
        alignItems: 'center',
        padding: 6,
        borderBottom: `1px solid ${Colors.darkGray}`,
    },
    addressLabel: {
        fontFamily: 'MSSerif',
        fontSize: 13,
        marginRight: 8,
        marginLeft: 4,
    },
    addressField: {
        flex: 1,
        backgroundColor: Colors.white,
        border: `1px solid ${Colors.darkGray}`,
        borderBottomColor: Colors.white,
        borderRightColor: Colors.white,
        padding: '4px 8px',
        overflow: 'hidden',
    },
    addressText: {
        fontFamily: 'MSSerif',
        fontSize: 13,
        whiteSpace: 'nowrap',
    },
    openButton: {
        fontFamily: 'MSSerif',
        fontSize: 13,
        marginLeft: 8,
        padding: '4px 12px',
        backgroundColor: Colors.lightGray,
        border: `1px solid ${Colors.white}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
        color: Colors.black,
        textDecoration: 'none',
        cursor: 'pointer',
    },
    body: {
        flex: 1,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    sidebar: {
        width: 240,
        flexDirection: 'column',
        padding: 8,
        boxSizing: 'border-box',
        borderRight: `1px solid ${Colors.darkGray}`,
        backgroundColor: Colors.lightGray,
        overflowY: 'auto',
    },
    siteItem: {
        flexDirection: 'column',
        padding: 8,
        marginBottom: 6,
        cursor: 'pointer',
        backgroundColor: Colors.lightGray,
        border: `1px solid ${Colors.white}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
    },
    siteItemActive: {
        border: `1px solid ${Colors.black}`,
        borderBottomColor: Colors.white,
        borderRightColor: Colors.white,
        backgroundColor: Colors.darkGray,
    },
    siteName: {
        fontFamily: 'MSSerif',
        fontSize: 15,
        marginBottom: 2,
    },
    siteTagline: {
        fontFamily: 'MSSerif',
        fontSize: 12,
        color: Colors.blue,
    },
    note: {
        marginTop: 8,
        padding: 8,
        border: `1px solid ${Colors.darkGray}`,
    },
    noteText: {
        fontFamily: 'MSSerif',
        fontSize: 11,
        lineHeight: 1.4,
    },
    viewport: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    iframe: {
        width: '100%',
        height: '100%',
        border: 'none',
    },
};

export default LiveSites;
