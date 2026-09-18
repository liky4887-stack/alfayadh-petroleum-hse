import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import AppNavigation from '@/navigation/AppNavigation';
import SplashScreen from '@/screens/SplashScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import { useHSEStore } from '@/lib/store';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { I18nProvider } from '@/lib/i18n';
import { DepartmentProvider } from '@/lib/department';

type Stage = 'splash' | 'onboarding' | 'app';
const ONBOARDING_KEY = '@alfayadh/onboarding_seen_v1';

export default function App() {
  const [stage, setStage] = useState<Stage>('splash');
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

  const subscribeToReports = useHSEStore((s) => s.subscribeToReports);
  const flushQueue = useHSEStore((s) => s.flushQueue);

  useEffect(() => {
    I18nManager.forceRTL(false);
    const unsub = subscribeToReports();
    flushQueue();
    return unsub;
  }, [subscribeToReports, flushQueue]);

  // Load fonts + check onboarding flag
  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          'Chevalon-Regular': require('./assets/fonts/Chevalon-Regular.otf'),
          'Chevalon-Medium': require('./assets/fonts/Chevalon-Medium.otf'),
          'Chevalon-SemiBold': require('./assets/fonts/Chevalon-SemiBold.otf'),
          'Chevalon-Bold': require('./assets/fonts/Chevalon-Bold.otf'),
          'Chevalon-ExtraBold': require('./assets/fonts/Chevalon-ExtraBold.otf'),
        });
      } catch (e) {
        console.warn('Font load failed:', e);
      }

      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        setOnboardingSeen(seen === 'true');
      } catch {
        setOnboardingSeen(false);
      }

      setFontsLoaded(true);
    })();
  }, []);

  // When splash finishes — decide where to go
  const handleSplashFinish = () => {
    if (onboardingSeen) {
      setStage('app');
    } else {
      setStage('onboarding');
    }
  };

  // When onboarding finishes — persist the flag
  const handleOnboardingFinish = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {}
    setStage('app');
  };

  if (!fontsLoaded || onboardingSeen === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A2540', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#0EA5E9" />
      </View>
    );
  }

  if (stage === 'splash') {
    return (
      <SafeAreaProvider>
        <SplashScreen onFinish={handleSplashFinish} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  if (stage === 'onboarding') {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onFinish={handleOnboardingFinish} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <I18nProvider>
          <DepartmentProvider>
            <AppNavigation />
            <StatusBar style="dark" />
          </DepartmentProvider>
        </I18nProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
