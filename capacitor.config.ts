import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dreamtells.sonhos',
  appName: 'DreamTells Sonhos',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // Client ID Web (obtido do google-services.json -> client_type: 3)
      serverClientId: '28214150046-d8nht99v068b3j1fbbtvbtsmb1l6ji58.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    }
  }
};

export default config;
