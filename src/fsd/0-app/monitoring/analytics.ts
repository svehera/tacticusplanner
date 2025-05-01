import Analytics from 'analytics';
// @ts-expect-error googleAnalytics does not provide types
import googleAnalytics from '@analytics/google-analytics';

const analytics = Analytics({
    app: 'Tacticus Planner',
    plugins: [
        googleAnalytics({
            measurementIds: [import.meta.env.VITE_GTAG],
        }),
    ],
});

export default analytics;
