import React, { useEffect, useState } from 'react';
import { Link } from '../general';
import { useLocation, useNavigate } from 'react-router-dom';
import useIsMobile from '../../hooks/useIsMobile';

export interface VerticalNavbarProps {}

const VerticalNavbar: React.FC<VerticalNavbarProps> = (props) => {
    const isMobile = useIsMobile();
    const location = useLocation();
    const [projectsExpanded, setProjectsExpanded] = useState(false);
    const [isHome, setIsHome] = useState(false);

    const navigate = useNavigate();
    const goToContact = () => {
        navigate('/contact');
    };

    useEffect(() => {
        if (location.pathname.includes('/projects')) {
            setProjectsExpanded(true);
        } else {
            setProjectsExpanded(false);
        }
        if (location.pathname === '/') {
            setIsHome(true);
        } else {
            setIsHome(false);
        }
        return () => {};
    }, [location.pathname]);

    const linkStyle = isMobile ? styles.linkMobile : styles.link;
    const insetLinkStyle = isMobile ? styles.insetLinkMobile : styles.insetLink;

    return !isHome ? (
        <div style={isMobile ? styles.navbarMobile : styles.navbar}>
            {!isMobile && (
                <div style={styles.header}>
                    <h1 style={styles.headerText}>Paul</h1>
                    <h1 style={styles.headerText}>Botchwey</h1>
                    <h3 style={styles.headerShowcase}>Showcase '26</h3>
                </div>
            )}
            <div style={isMobile ? styles.linksMobile : styles.links}>
                <Link containerStyle={linkStyle} to="" text="HOME" />
                <Link containerStyle={linkStyle} to="about" text="ABOUT" />
                <Link
                    containerStyle={linkStyle}
                    to="experience"
                    text="EXPERIENCE"
                />
                <Link
                    containerStyle={Object.assign(
                        {},
                        linkStyle,
                        !isMobile && projectsExpanded && styles.expandedLink
                    )}
                    to="projects"
                    text="PROJECTS"
                />
                {
                    // if current path contains projects
                    projectsExpanded && (
                        <div
                            style={
                                isMobile
                                    ? styles.insetLinksMobile
                                    : styles.insetLinks
                            }
                        >
                            <Link
                                containerStyle={insetLinkStyle}
                                to="projects/mobile"
                                text="MOBILE"
                            />
                            <Link
                                containerStyle={insetLinkStyle}
                                to="projects/web"
                                text="WEB"
                            />
                            <Link
                                containerStyle={insetLinkStyle}
                                to="projects/data"
                                text="DATA SCIENCE"
                            />
                        </div>
                    )
                }
                <Link containerStyle={linkStyle} to="contact" text="CONTACT" />
            </div>
            {!isMobile && (
                <>
                    <div style={styles.spacer} />
                    <div
                        style={styles.forHireContainer}
                        onMouseDown={goToContact}
                    />
                </>
            )}
        </div>
    ) : (
        <></>
    );
};

const styles: StyleSheetCSS = {
    navbar: {
        width: 300,
        height: '100%',
        flexDirection: 'column',
        padding: 48,
        boxSizing: 'border-box',
        position: 'fixed',
        overflow: 'hidden',
    },
    navbarMobile: {
        width: '100%',
        flexDirection: 'row',
        padding: 12,
        boxSizing: 'border-box',
        position: 'relative',
        borderBottom: '1px solid #86898d',
        flexShrink: 0,
    },
    linksMobile: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    linkMobile: {
        marginRight: 16,
        marginBottom: 4,
    },
    insetLinksMobile: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginRight: 8,
        marginBottom: 4,
    },
    insetLinkMobile: {
        marginRight: 12,
        marginBottom: 4,
    },
    header: {
        flexDirection: 'column',
        marginBottom: 64,
    },
    headerText: {
        fontSize: 38,
        lineHeight: 1,
    },
    headerShowcase: {
        marginTop: 12,
    },
    logo: {
        width: '100%',
        marginBottom: 8,
    },
    link: {
        marginBottom: 32,
    },
    expandedLink: {
        marginBottom: 16,
    },
    insetLinks: {
        flexDirection: 'column',
        marginLeft: 32,
        marginBottom: 16,
    },
    insetLink: {
        marginBottom: 8,
    },
    links: {
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'center',
    },
    image: {
        width: '80%',
    },
    spacer: {
        flex: 1,
    },
    forHireContainer: {
        cursor: 'pointer',

        width: '100%',
    },
};

export default VerticalNavbar;
