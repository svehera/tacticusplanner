import React from 'react';
import ReactDOM from 'react-dom/client';

import 'react-medium-image-zoom/dist/styles.css';
import './index.css';

import reportWebVitals from './monitoring/reportWebVitals';
import { FirstPartyProviders } from './providers/first-party.providers';
import { ThirdPartyProviders } from './providers/third-party.providers';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');
const root = ReactDOM.createRoot(container);
root.render(
    <FirstPartyProviders>
        <ThirdPartyProviders />
    </FirstPartyProviders>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(metric => {
    // console.log(`[Web Vitals] ${metric.name}:`, metric.value);
});
