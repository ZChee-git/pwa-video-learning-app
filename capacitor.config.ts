import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartreview.videolearning',
  appName: '智能视频复习系统',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#3b82f6",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#ffffff"
    },
    Storage: {
      group: "SmartReviewGroup"
    },
    Filesystem: {
      iosFileContainer: "data",
      androidFileContainer: "data"
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#3b82f6'
    }
  }
};

export default config;
