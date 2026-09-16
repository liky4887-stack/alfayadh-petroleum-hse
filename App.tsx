import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager } from 'react-native';
import AppNavigation from '@/navigation/AppNavigation';
import { useHSEStore } from '@/lib/store';

export default function App() {
  const subscribeToReports = useHSEStore((s) => s.subscribeToReports);
  const flushQueue = useHSEStore((s) => s.flushQueue);

  useEffect(() => {
    I18nManager.forceRTL(false);
    const unsub = subscribeToReports();
    flushQueue();
    return unsub;
  }, [subscribeToReports, flushQueue]);

  return (
    <SafeAreaProvider>
      <AppNavigation />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
