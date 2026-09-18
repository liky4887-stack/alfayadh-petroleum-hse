import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager } from 'react-native';
import AppNavigation from '@/navigation/AppNavigation';
import SplashScreen from '@/screens/SplashScreen';
import { useHSEStore } from '@/lib/store';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { I18nProvider } from '@/lib/i18n';
import { DepartmentProvider } from '@/lib/department';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const subscribeToReports = useHSEStore((s) => s.subscribeToReports);
  const flushQueue = useHSEStore((s) => s.flushQueue);

  useEffect(() => {
    I18nManager.forceRTL(false);
    const unsub = subscribeToReports();
    flushQueue();
    return unsub;
  }, [subscribeToReports, flushQueue]);

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <SplashScreen onFinish={() => setShowSplash(false)} />
        <StatusBar style="dark" />
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
