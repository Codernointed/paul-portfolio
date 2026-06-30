import React from 'react';
import ResumeDownload from '../ResumeDownload';

export interface DataScienceProjectsProps {}

const DataScienceProjects: React.FC<DataScienceProjectsProps> = (props) => {
    return (
        <div className="site-page-content">
            <h1>Data Science</h1>
            <h3>& Machine Learning</h3>
            <br />
            <p>
                Alongside building apps, I work as a Data Scientist &amp; ML
                Engineer — training models with Python, TensorFlow and the
                scientific-Python stack, and turning them into things people can
                actually use. Here are a few projects I'm proud of.
            </p>
            <br />
            <ResumeDownload />
            <br />
            <div className="text-block">
                <h2>Vision Infinity</h2>
                <br />
                <p>
                    An eye-disease detection and health-checking application. I
                    trained a deep-learning model (TensorFlow) to classify eye
                    conditions in real time, with the goal of making early
                    screening more accessible.
                </p>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://github.com/Codernointed/vision-infinity"
                        >
                            <p>
                                <b>[GitHub]</b> - vision-infinity
                            </p>
                        </a>
                    </li>
                </ul>
            </div>
            <div className="text-block">
                <h2>Sound-Based Anomaly Detection</h2>
                <br />
                <p>
                    A real-time application that analyzes sound data and detects
                    anomalies — applying audio signal processing and machine
                    learning to flag irregularities as they happen.
                </p>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://github.com/Codernointed/Sound-Based-Anomaly-Detection"
                        >
                            <p>
                                <b>[GitHub]</b> - Sound-Based-Anomaly-Detection
                            </p>
                        </a>
                    </li>
                </ul>
            </div>
            <div className="text-block">
                <h2>British Airways — Data Science</h2>
                <br />
                <p>
                    A data-science simulation exploring how analytics drives
                    decision-making at British Airways — from web-scraped
                    customer reviews to predictive modelling of buying behaviour,
                    delivered in Jupyter notebooks.
                </p>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://github.com/Codernointed/British-Airways-Data-Science"
                        >
                            <p>
                                <b>[GitHub]</b> - British-Airways-Data-Science
                            </p>
                        </a>
                    </li>
                </ul>
            </div>
            <div className="text-block">
                <h2>HushSense — Web3</h2>
                <br />
                <p>
                    A blockchain project tackling noise pollution: HushSense
                    combines sensing with on-chain incentives to encourage
                    quieter, healthier environments. A fun venture into the Web3
                    side of building.
                </p>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://github.com/Codernointed/hush-sense"
                        >
                            <p>
                                <b>[GitHub]</b> - hush-sense
                            </p>
                        </a>
                    </li>
                </ul>
            </div>
            <ResumeDownload />
        </div>
    );
};

export default DataScienceProjects;
