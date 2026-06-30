import React from 'react';
import { Link } from 'react-router-dom';
import ResumeDownload from './ResumeDownload';

export interface AboutProps {}

const About: React.FC<AboutProps> = (props) => {
    return (
        // add on resize listener
        <div className="site-page-content">
            <h1 style={{ marginLeft: -16 }}>Welcome</h1>
            <h3>I'm Paul Botchwey</h3>
            <br />
            <div className="text-block">
                <p>
                    I'm an enthusiastic programmer based in Accra, Ghana — a
                    Mobile App Developer, Data Scientist &amp; ML Engineer who
                    loves building things people actually use. On GitHub I go by{' '}
                    <a
                        rel="noreferrer"
                        target="_blank"
                        href="https://github.com/Codernointed"
                    >
                        @Codernointed
                    </a>
                    , where I've shipped 90+ repositories across mobile, web,
                    data science, cloud, and a little Web3.
                </p>
                <br />
                <p>
                    Thank you for taking the time to check out my portfolio. I
                    really hope you enjoy exploring it as much as I enjoyed
                    putting it together. If you have any questions or comments,
                    feel free to reach me through{' '}
                    <Link to="/contact">this form</Link> or shoot me an email at{' '}
                    <a href="mailto:botchweypaul0001@gmail.com">
                        botchweypaul0001@gmail.com
                    </a>
                    .
                </p>
            </div>
            <ResumeDownload />
            <div className="text-block">
                <h3>What I do</h3>
                <br />
                <p>
                    My main craft is <b>mobile development</b> with Flutter &amp;
                    Dart — I've shipped products like the{' '}
                    <a
                        rel="noreferrer"
                        target="_blank"
                        href="https://play.google.com/store/apps/details?id=com.orctatech.somayendeliveryapp"
                    >
                        Somayen Delivery App
                    </a>{' '}
                    and{' '}
                    <a
                        rel="noreferrer"
                        target="_blank"
                        href="https://play.google.com/store/apps/details?id=io.utim8.app"
                    >
                        Utim8
                    </a>{' '}
                    to the Google Play Store. You can see more on my{' '}
                    <Link to="/projects/mobile">Mobile Projects</Link> page.
                </p>
                <br />
                <p>
                    I'm also a <b>Data Scientist &amp; ML Engineer</b>. I build
                    and train models with Python and TensorFlow — like Vision
                    Infinity for real-time eye-disease detection and a
                    sound-based anomaly detector. Those live on my{' '}
                    <Link to="/projects/data">Data Science &amp; ML</Link> page.
                </p>
                <br />
                <p>
                    And I build for the <b>web</b> with React, Next.js and
                    TypeScript, shipping live client platforms such as Nabi
                    Fashion, AceTours, Voyage Diaries and Losung Optimum. Have a
                    look on my <Link to="/projects/web">Web Projects</Link> page.
                </p>
                <br />
                <h3>How I got here</h3>
                <br />
                <p>
                    I've always been curious about how things work, and that
                    curiosity turned into a love for building software. Over the
                    years I've grown from small experiments into shipping real
                    products — collaborating through engineering teams and
                    communities like Orctatech, Bookmie, ckodon and HushSense,
                    and contributing across the stack: mobile, web, machine
                    learning, and cloud (AWS).
                </p>
                <br />
                <p>
                    For the full picture of where I've worked and what I've
                    built, check out my <Link to="/experience">Experience</Link>{' '}
                    page.
                </p>
                <br />
                <br />
                <p>
                    Thanks for reading about me! I hope you enjoy exploring the
                    rest of the portfolio. If you'd like to build something
                    together, the <Link to="/contact">contact page</Link> is the
                    best place to reach me — or email{' '}
                    <a href="mailto:botchweypaul0001@gmail.com">
                        botchweypaul0001@gmail.com
                    </a>
                    . Good luck and have fun!
                </p>
            </div>
        </div>
    );
};

export default About;
