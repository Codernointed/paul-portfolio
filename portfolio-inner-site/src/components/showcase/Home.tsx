import React from 'react';
import { Link } from '../general';
import { useNavigate } from 'react-router-dom';
import useIsMobile from '../../hooks/useIsMobile';

export interface HomeProps {}

const Home: React.FC<HomeProps> = (props) => {
    const isMobile = useIsMobile();
    const navigate = useNavigate();

    const goToContact = () => {
        navigate('/contact');
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={isMobile ? styles.nameMobile : styles.name}>
                    Paul Botchwey
                </h1>
                <h2 style={isMobile ? styles.subtitleMobile : undefined}>
                    Mobile App Developer · Data Scientist & ML Engineer
                </h2>
            </div>
            <div style={isMobile ? styles.buttonsMobile : styles.buttons}>
                <Link containerStyle={styles.link} to="about" text="ABOUT" />
                <Link
                    containerStyle={styles.link}
                    to="experience"
                    text="EXPERIENCE"
                />
                <Link
                    containerStyle={styles.link}
                    to="projects"
                    text="PROJECTS"
                />
                <Link
                    containerStyle={styles.link}
                    to="contact"
                    text="CONTACT"
                />
            </div>
            <div style={styles.forHireContainer} onMouseDown={goToContact}>
                {/* <img src={forhire} alt="" /> */}
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    page: {
        // Plain flex child instead of position:absolute + height:'100%' -
        // the latter needs every ancestor to have an explicitly resolved
        // height for the percentage to work, which some Android browser
        // engines don't propagate the same way through .site-page's
        // absolute-with-inset-zero sizing, letting this content render
        // outside the window's visible box. flex:1 with the default
        // align-items:stretch fills the same space without that dependency.
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        overflowY: 'auto',
    },
    header: {
        textAlign: 'center',
        marginBottom: 64,
        marginTop: 64,

        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttons: {
        justifyContent: 'space-between',
    },
    image: {
        width: 800,
    },
    link: {
        padding: 16,
    },
    nowHiring: {
        backgroundColor: 'red',
        padding: 16,
    },
    forHireContainer: {
        marginTop: 64,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
    },
    name: {
        fontSize: 72,
        marginBottom: 16,
        lineHeight: 0.9,
    },
    nameMobile: {
        fontSize: 34,
        marginBottom: 12,
        lineHeight: 1.05,
    },
    subtitleMobile: {
        fontSize: 14,
        padding: '0 16px',
    },
    buttonsMobile: {
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
};

export default Home;
