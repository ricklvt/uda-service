import { HistogramBuckets } from '@lvt/telemetry';

export const DURATION_HISTOGRAM_BOUNDARIES_MS = [
  100, 200, 500, 1000, 2000, 4000, 8000, 12000, 16000,
];
export const SPAN_WITH_DOMAIN_OPTIONS = {
  durationMetrics: {
    bucketParams: new HistogramBuckets().withBoundaries(DURATION_HISTOGRAM_BOUNDARIES_MS),
  },
  trafficMetrics: true,
};
