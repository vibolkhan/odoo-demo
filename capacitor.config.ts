import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'odoo-demo',
  webDir: 'dist',
  plugins: {
    Keyboard: {
      resizeOnFullScreen: true
    }
  }
};

export default config;
