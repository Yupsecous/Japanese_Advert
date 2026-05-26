import type { ExpoConfig } from 'expo/config';

// Dynamic Expo config. The backend URL is read from BACKEND_URL at build
// time and baked into the JavaScript bundle — prospects never configure
// anything. Default falls back to the emulator loopback so `expo start`
// still works for local dev when no env var is set.
//
// Usage:
//   BACKEND_URL=https://api.your-domain.com eas build -p android --profile preview
//   BACKEND_URL=https://api.your-domain.com npx expo start
//
// Icon and splash are intentionally omitted: Expo bakes in defaults at
// prebuild time. Drop real branding assets at assets/icon.png and
// assets/splash.png plus the matching config entries later to override.

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://10.0.2.2:3001';

const config: ExpoConfig = {
  name: "Director's Cockpit",
  slug: 'directors-cockpit',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  scheme: 'advert',
  android: {
    package: 'com.advert.directorscockpit',
    minSdkVersion: 29,
    targetSdkVersion: 34,
    // Required for the app to talk to non-https backends during development.
    // Production builds use https; this only matters when BACKEND_URL is http.
    usesCleartextTraffic: BACKEND_URL.startsWith('http://'),
  },
  extra: {
    backendUrl: BACKEND_URL,
    eas: {
      projectId: 'bb53ff7e-08b7-4021-91e7-b1c52fd41a37',
    },
  },
};

export default config;
