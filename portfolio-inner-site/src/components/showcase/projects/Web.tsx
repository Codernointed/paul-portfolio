import React from 'react';
import ResumeDownload from '../ResumeDownload';

export interface WebProjectsProps {}

const WebProjects: React.FC<WebProjectsProps> = (props) => {
    return (
        <div className="site-page-content">
            <h1>Web</h1>
            <h3>Development</h3>
            <br />
            <p>
                On the web I build fast, modern product sites and platforms with
                React, Next.js and TypeScript, usually deployed on Vercel. Below
                are some live client and personal projects you can visit right
                now.
            </p>
            <br />
            <ResumeDownload />
            <br />
            <div className="text-block">
                <h2>Nabi Fashion</h2>
                <br />
                <p>
                    A modern fashion brand experience — clean product
                    storytelling, responsive layouts, and a polished shopping
                    feel.
                </p>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://nabifashion.com"
                        >
                            <p>
                                <b>[Live]</b> - nabifashion.com
                            </p>
                        </a>
                    </li>
                </ul>
            </div>
            <div className="text-block">
                <h2>AceTours</h2>
                <br />
                <p>
                    A tourism and travel platform showcasing tours and
                    destinations, built as a fast, content-rich web app.
                </p>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://acetours.vercel.app"
                        >
                            <p>
                                <b>[Live]</b> - acetours.vercel.app
                            </p>
                        </a>
                    </li>
                </ul>
            </div>
            <div className="text-block">
                <h2>Voyage Diaries</h2>
                <br />
                <p>
                    A travel-storytelling site that turns trips and itineraries
                    into a beautiful, immersive reading experience.
                </p>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://voyagediaries.vercel.app/"
                        >
                            <p>
                                <b>[Live]</b> - voyagediaries.vercel.app
                            </p>
                        </a>
                    </li>
                </ul>
            </div>
            <div className="text-block">
                <h2>Cornel Media</h2>
                <br />
                <p>
                    A media/agency website with a strong visual identity, built
                    for performance and easy content updates.
                </p>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://cornelmedia.vercel.app/"
                        >
                            <p>
                                <b>[Live]</b> - cornelmedia.vercel.app
                            </p>
                        </a>
                    </li>
                </ul>
            </div>
            <div className="text-block">
                <h2>Losung Optimum</h2>
                <br />
                <p>
                    A product site for Losung Optimum pet products — built to
                    present the catalogue cleanly and convert visitors.
                </p>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://losungoptimum.com"
                        >
                            <p>
                                <b>[Live]</b> - losungoptimum.com
                            </p>
                        </a>
                    </li>
                    <li>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://github.com/Codernointed"
                        >
                            <p>
                                <b>[GitHub]</b> - more projects @Codernointed
                            </p>
                        </a>
                    </li>
                </ul>
            </div>
            <ResumeDownload />
        </div>
    );
};

export default WebProjects;
