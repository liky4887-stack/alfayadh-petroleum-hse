import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager } from 'react-native';
import AppNavigation from '@/navigation/AppNavigation';
import SplashScreen from '@/screens/SplashScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import { useHSEStore } from '@/lib/store';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { I18nProvider } from '@/lib/i18n';
import { DepartmentProvider } from '@/lib/department';

type Stage = 'splash' | 'onboarding' | 'app';

export default function App() {
  const [stage, setStage] = useState<Stage>('splash');
  const subscribeToReports = useHSEStore((s) => s.subscribeToReports);
  const flushQueue = useHSEStore((s) => s.flushQueue);

  useEffect(() => {
    I18nManager.forceRTL(false);
    const unsub = subscribeToReports();
    flushQueue();
    return unsub;
  }, [subscribeToReports, flushQueue]);

  if (stage === 'splash') {
    return (
      <SafeAreaProvider>
        <SplashScreen onFinish={() => setStage('onboarding')} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  if (stage === 'onboarding') {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onFinish={() => setStage('app')} />
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
