import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { flushQueue, getQueueSize } from './syncQueue';

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // Initial check
    NetInfo.fetch().then((state) => {
      setOnline(state.isConnected === true && state.isInternetReachable !== false);
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected === true && state.isInternetReachable !== false);
    });

    return () => unsubscribe();
  }, []);

  return online;
}

export function useSyncStatus(): { online: boolean; pending: number; syncing: boolean } {
  const online = useOnline();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkQueue = async () => {
      const size = await getQueueSize();
      if (!mounted) return;
      setPending(size);

      if (size > 0 && online) {
        setSyncing(true);
        const result = await flushQueue();
        if (mounted) {
          setPending(result.failed);
          setSyncing(false);
        }
      }
    };

    checkQueue();
    const interval = setInterval(checkQueue, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, [online]);

  return { online, pending, syncing };
}
