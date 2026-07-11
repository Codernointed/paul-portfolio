import React from 'react';
import ReactDOM from 'react-dom';
import posthog from 'posthog-js';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Analytics (PostHog). No-ops when the key is absent, so local dev without a
// key runs fine. Set REACT_APP_PUBLIC_POSTHOG_KEY in Vercel to enable it.
if (process.env.REACT_APP_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.REACT_APP_PUBLIC_POSTHOG_KEY, {
        api_host:
            process.env.REACT_APP_PUBLIC_POSTHOG_HOST ||
            'https://us.i.posthog.com',
        person_profiles: 'identified_only',
    });
}

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
