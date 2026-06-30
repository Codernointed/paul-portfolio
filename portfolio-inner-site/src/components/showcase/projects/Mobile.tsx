import React from 'react';
import ResumeDownload from '../ResumeDownload';

export interface MobileProjectsProps {}

const MobileProjects: React.FC<MobileProjectsProps> = (props) => {
    return (
        <div className="site-page-content">
            <h1>Mobile</h1>
            <h3>Development</h3>
            <br />
            <p>
                Mobile is where I spend most of my time. I build cross-platform
                apps with Flutter &amp; Dart — from delivery platforms shipped to
                the Google Play Store to AI-powered utilities. Here are a few of
                my favorites.
            </p>
            <br />
            <ResumeDownload />
            <br />
            <div className="text-block">
                <h2>Somayen Delivery</h2>
                <br />
                <p>
                    A full delivery platform built with the Orctatech
                    Engineering Team and published on the Google Play Store.
                    Somayen connects customers, vendors, and riders with live
                    order tracking, in-app payments, and a clean, fast Flutter
                    front end.
                </p>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://play.google.com/store/apps/details?id=com.orctatech.somayendeliveryapp"
                        >
                            <p>
                                <b>[Google Play]</b> - Somayen Delivery App
                            </p>
                        </a>
                    </li>
                </ul>
            </div>
            <div className="text-block">
                <h2>Utim8</h2>
                <br />
                <p>
                    Utim8 is a mobile product I shipped to the Play Store, built
                    in Flutter with a focus on a smooth, responsive user
                    experience and a maintainable codebase.
                </p>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://play.google.com/store/apps/details?id=io.utim8.app"
                        >
                            <p>
                                <b>[Google Play]</b> - Utim8
                            </p>
                        </a>
                    </li>
                </ul>
            </div>
            <div className="text-block">
                <h2>Outfit Matcher</h2>
                <br />
                <p>
                    A Flutter app that helps users put together outfits — pairing
                    computer-vision ideas with a polished mobile interface. One of
                    my favorite intersections of mobile development and machine
                    learning.
                </p>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://github.com/Codernointed/outfit_matcher"
                        >
                            <p>
                                <b>[GitHub]</b> - outfit_matcher
                            </p>
                        </a>
                    </li>
                </ul>
            </div>
            <div className="text-block">
                <h2>AI Lecturer</h2>
                <br />
                <p>
                    An AI-powered learning companion built in Flutter that turns
                    lecture material into an interactive study experience.
                </p>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://github.com/Codernointed/ai_lecturer"
                        >
                            <p>
                                <b>[GitHub]</b> - ai_lecturer
                            </p>
                        </a>
                    </li>
                </ul>
            </div>
            <div className="text-block">
                <h2>U-Clinic</h2>
                <br />
                <p>
                    A healthcare-focused Flutter application designed to make
                    clinic services more accessible from a phone — appointments,
                    records, and patient-friendly flows.
                </p>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://github.com/Codernointed/u_clinic"
                        >
                            <p>
                                <b>[GitHub]</b> - u_clinic
                            </p>
                        </a>
                    </li>
                    <li>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://github.com/Codernointed/sign_language_app"
                        >
                            <p>
                                <b>[GitHub]</b> - sign_language_app
                            </p>
                        </a>
                    </li>
                    <li>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://github.com/Codernointed/mil-mobile-game"
                        >
                            <p>
                                <b>[GitHub]</b> - mil-mobile-game
                            </p>
                        </a>
                    </li>
                </ul>
            </div>
            <ResumeDownload />
        </div>
    );
};

export default MobileProjects;
