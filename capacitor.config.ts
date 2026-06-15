import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mocaemtui.app',
  appName: 'Mocaemtui',
  webDir: 'public',
  server: {
    url: 'https://mocaemtui.vercel.app',
    cleartext: true
  }
};

export default config;
