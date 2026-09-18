import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager } from 'react-native';
import AppNavigation from '@/navigation/AppNavigation';
import { useHSEStore } from '@/lib/store';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { I18nProvider } from '@/lib/i18n';
import { DepartmentProvider } from '@/lib/department';
import SplashScreen from '@/screens/SplashScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';

export default function App() {
  const subscribeToReports = useHSEStore((s) => s.subscribeToReports);
  const flushQueue = useHSEStore((s) => s.flushQueue);
  const [phase, setPhase] = useState<'splash' | 'onboarding' | 'app'>('splash');

  useEffect(() => {
    I18nManager.forceRTL(false);
    const unsub = subscribeToReports();
    flushQueue();
    return unsub;
  }, [subscribeToReports, flushQueue]);

  if (phase === 'splash') {
    return (
      <SafeAreaProvider>
        <SplashScreen onFinish={() => setPhase('onboarding')} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  if (phase === 'onboarding') {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onFinish={() => setPhase('app')} />
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
