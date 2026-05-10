import * as Sentry from '@sentry/react-native';

export function initSentry() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,
    debug: __DEV__,
  });
}

export function sendSentryTestEvent() {
  Sentry.captureMessage('Woods Phase 0 bootstrap — Sentry connected', 'info');
}
