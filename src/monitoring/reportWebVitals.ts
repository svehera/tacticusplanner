import { onCLS, onINP, onLCP, onTTFB, onFCP } from 'web-vitals';
import analytics from './analytics';
import { Metric } from 'web-vitals/src/types/base';

const reportWebVitals = (onReport: (metric: Metric) => void) => {
    const sendMetric = (metric: Metric) => {
        if (onReport) {
            onReport(metric); // Optional: handle metrics in your own function
        }
        // Track the metric to Google Analytics via `analytics`
        analytics.track('Web Vitals', {
            category: 'Web Vitals',
            label: metric.name, // Metric name (e.g., CLS, LCP)
            value: metric.value, // Metric value
            id: metric.id, // Metric ID
            delta: metric.delta,
        });
    };

    // Subscribe to Web Vitals metrics
    onCLS(sendMetric);
    onLCP(sendMetric);
    onTTFB(sendMetric);
    onFCP(sendMetric);
    onINP(sendMetric);
};

export default reportWebVitals;
