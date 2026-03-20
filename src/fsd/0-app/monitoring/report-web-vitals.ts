import { onCLS, onINP, onLCP, onTTFB, onFCP, MetricWithAttribution } from 'web-vitals/attribution';

import analytics from './analytics';

const reportWebVitals = (onReport: (metric: MetricWithAttribution) => void) => {
    const sendMetric = (metric: MetricWithAttribution) => {
        if (onReport) {
            onReport(metric); // Optional: handle metrics in your own function
        }
        const eventParameters = {
            // Built-in params:
            value: metric.delta, // Use `delta` so the value can be summed.
            // Custom params:
            metric_id: metric.id, // Needed to aggregate events.
            metric_value: metric.value, // Optional.
            metric_delta: metric.delta, // Optional.
            debug_target: '',
        };

        switch (metric.name) {
            case 'CLS':
                eventParameters.debug_target = metric.attribution.largestShiftTarget ?? '';
                break;
            case 'INP':
                eventParameters.debug_target = metric.attribution.interactionTarget;
                break;
            case 'LCP':
                eventParameters.debug_target = metric.attribution.element ?? '';
                break;
            case 'TTFB':
                eventParameters.debug_target = metric.attribution.navigationEntry?.name ?? '';
                break;
            case 'FCP':
                eventParameters.debug_target = metric.attribution.fcpEntry?.name ?? '';
                break;
        }

        // Track the metric to Google Analytics via `analytics`
        analytics.track(metric.name, {
            category: 'Web Vitals',
            label: metric.name, // Metric name (e.g., CLS, LCP)
            ...eventParameters,
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
