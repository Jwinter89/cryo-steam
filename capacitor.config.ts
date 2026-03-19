import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.coldcreek.gasplantsim',
  appName: 'Cold Creek',
  webDir: 'www',
  // Server config — remove or comment out for production builds
  // server: {
  //   url: 'http://localhost:3000',
  //   cleartext: true,
  // },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1a1a1a',
    preferredContentMode: 'mobile',
    scheme: 'Cold Creek',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: '#1a1a1aff',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#1a1a1a',
    },
    Preferences: {
      // Uses native key-value storage — survives WKWebView purges
    },
  },
};

export default config;
