import React from 'react';
import ResumeDownload from './ResumeDownload';

export interface ExperienceProps {}

/*
 * NOTE (Paul): role titles and date ranges below are sensible placeholders.
 * Update the <h3> role and the <p> date on each entry to match reality.
 */

const Experience: React.FC<ExperienceProps> = (props) => {
    return (
        <div className="site-page-content">
            <ResumeDownload />
            <div style={styles.headerContainer}>
                <div style={styles.header}>
                    <div style={styles.headerRow}>
                        <h1>Orctatech</h1>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href={'https://github.com/Orctatech-Engineering-Team'}
                        >
                            <h4>Orctatech-Engineering-Team</h4>
                        </a>
                    </div>
                    <div style={styles.headerRow}>
                        <h3>Mobile &amp; Software Engineer</h3>
                        <b>
                            <p>2023 - Present</p>
                        </b>
                    </div>
                </div>
            </div>
            <div className="text-block">
                <p>
                    Building production mobile applications with the Orctatech
                    Engineering Team using Flutter &amp; Dart, and shipping them
                    to the Google Play Store.
                </p>
                <br />
                <ul>
                    <li>
                        <p>
                            Designed and developed the{' '}
                            <a
                                rel="noreferrer"
                                target="_blank"
                                href="https://play.google.com/store/apps/details?id=com.orctatech.somayendeliveryapp"
                            >
                                Somayen Delivery App
                            </a>
                            , a multi-sided delivery platform connecting
                            customers, vendors and riders.
                        </p>
                    </li>
                    <li>
                        <p>
                            Implemented live order tracking, in-app payments and
                            a responsive Flutter UI, with a focus on performance
                            and maintainability.
                        </p>
                    </li>
                    <li>
                        <p>
                            Collaborated within an engineering team on code
                            review, releases and Play Store deployment.
                        </p>
                    </li>
                </ul>
            </div>
            <div style={styles.headerContainer}>
                <div style={styles.header}>
                    <div style={styles.headerRow}>
                        <h1>Bookmie</h1>
                        <a
                            target="_blank"
                            rel="noreferrer"
                            href={'https://github.com/Bookmie-Devs'}
                        >
                            <h4>Bookmie-Devs</h4>
                        </a>
                    </div>
                    <div style={styles.headerRow}>
                        <h3>Founder &amp; Lead Developer</h3>
                        <b>
                            <p>2023 - Present</p>
                        </b>
                    </div>
                </div>
            </div>
            <div className="text-block">
                <p>
                    Bookmie is a management platform to control and track
                    activities in a hostel — handling bookings, rooms and
                    occupancy in one place.
                </p>
                <br />
                <ul>
                    <li>
                        <p>
                            Led product direction and development across mobile
                            and web, building the booking and management flows
                            end to end.
                        </p>
                    </li>
                    <li>
                        <p>
                            Coordinated a small developer team (Bookmie-Devs) to
                            iterate on features and ship improvements.
                        </p>
                    </li>
                </ul>
            </div>
            <div style={styles.headerContainer}>
                <div style={styles.header}>
                    <div style={styles.headerRow}>
                        <h1>HushSense</h1>
                        <a
                            target="_blank"
                            rel="noreferrer"
                            href={'https://github.com/Codernointed/hush-sense'}
                        >
                            <h4>github.com/Codernointed/hush-sense</h4>
                        </a>
                    </div>
                    <div style={styles.headerRow}>
                        <h3>Blockchain Developer</h3>
                        <b>
                            <p>2025</p>
                        </b>
                    </div>
                </div>
            </div>
            <div className="text-block">
                <p>
                    HushSense is a Web3 project that uses blockchain and sensing
                    to help tackle noise pollution, pairing environmental data
                    with on-chain incentives.
                </p>
                <br />
                <ul>
                    <li>
                        <p>
                            Contributed to the smart-contract and application
                            logic connecting sensor data to on-chain rewards.
                        </p>
                    </li>
                    <li>
                        <p>
                            Explored how decentralized incentives can drive
                            real-world behaviour change around noise.
                        </p>
                    </li>
                </ul>
            </div>
            <div style={styles.headerContainer}>
                <div style={styles.header}>
                    <div style={styles.headerRow}>
                        <h1>Data Science &amp; ML</h1>
                        <a
                            target="_blank"
                            rel="noreferrer"
                            href={'https://github.com/Codernointed'}
                        >
                            <h4>@Codernointed</h4>
                        </a>
                    </div>
                    <div style={styles.headerRow}>
                        <h3>Data Scientist &amp; ML Engineer</h3>
                        <b>
                            <p>2023 - Present</p>
                        </b>
                    </div>
                </div>
            </div>
            <div className="text-block">
                <p>
                    Independent and collaborative machine-learning work using
                    Python, TensorFlow and the scientific-Python stack.
                </p>
                <br />
                <ul>
                    <li>
                        <p>
                            Built <b>Vision Infinity</b>, a real-time eye-disease
                            detection and health-checking application powered by
                            deep learning.
                        </p>
                    </li>
                    <li>
                        <p>
                            Created a <b>sound-based anomaly detection</b> system
                            applying audio signal processing and ML to flag
                            irregularities in real time.
                        </p>
                    </li>
                    <li>
                        <p>
                            Completed the British Airways data-science job
                            simulation — web scraping, sentiment analysis and
                            predictive modelling in Jupyter.
                        </p>
                    </li>
                </ul>
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    header: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
    },
    skillRow: {
        flex: 1,
        justifyContent: 'space-between',
    },
    skillName: {
        minWidth: 56,
    },
    skill: {
        flex: 1,
        padding: 8,
        alignItems: 'center',
    },
    progressBar: {
        flex: 1,
        background: 'red',
        marginLeft: 8,
        height: 8,
    },
    hoverLogo: {
        height: 32,
        marginBottom: 16,
    },
    headerContainer: {
        alignItems: 'flex-end',
        width: '100%',
        justifyContent: 'center',
    },
    hoverText: {
        marginBottom: 8,
    },
    indent: {
        marginLeft: 24,
    },
    headerRow: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    row: {
        display: 'flex',
        justifyContent: 'space-between',
    },
};

export default Experience;
