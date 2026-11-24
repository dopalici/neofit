import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.neovit.app',
  appName: 'NeoVitru',
  webDir: '../../build',
  ios: {
    contentInset: 'never',
    allowsLinkPreview: false,
    backgroundColor: '#0b1117',
    preferredContentMode: 'mobile',
  },
};

export default config;
