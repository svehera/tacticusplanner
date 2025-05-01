import googleAnalytics from '@analytics/google-analytics';
import Analytics from 'analytics';

const analytics = Analytics({
    app: 'Tacticus Planner',
    plugins: [
        googleAnalytics({
            measurementIds: [import.meta.env.VITE_GTAG],
        }),
    ],
});

export default analytics;
