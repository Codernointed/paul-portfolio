import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import LoadingScreen from './components/LoadingScreen';
import HelpPrompt from './components/HelpPrompt';
import InterfaceUI from './components/InterfaceUI';
import ViewToggle from './components/ViewToggle';
import eventBus from './EventBus';
import './style.css';

const App = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        eventBus.on('loadingScreenDone', () => {
            setLoading(false);
        });
    }, []);

    return (
        <div id="ui-app">
            {!loading && <HelpPrompt />}
            <LoadingScreen />
        </div>
    );
};

const createUI = () => {
    ReactDOM.render(<App />, document.getElementById('ui'));
};

const createVolumeUI = () => {
    // #ui-interactive (not #ui-app, which InterfaceUI/MuteToggle/FreeCamToggle
    // deliberately avoid) is the one DOM root that reliably receives clicks
    // above the CSS3DRenderer layer: #ui is `position: absolute; overflow:
    // hidden`, which traps position:fixed descendants for hit-testing (they
    // still paint correctly, but document.elementFromPoint never reaches
    // them - confirmed directly, not assumed). ViewToggle is a sibling of
    // InterfaceUI here, not nested inside it, so it isn't subject to
    // InterfaceUI's own camera-driven show/hide state - it must stay
    // reachable however the visitor is looking at the scene.
    ReactDOM.render(
        <>
            <InterfaceUI />
            <ViewToggle />
        </>,
        document.getElementById('ui-interactive')
    );
};

export { createUI, createVolumeUI };
