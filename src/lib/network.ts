import { useState, useEffect } from 'react';
import { flushQueue, getQueueSize } from './syncQueue';

export function useOnline(): boolean {
  return true;
}

export function useSyncStatus(): { online: boolean; pending: number; syncing: boolean } {
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkQueue = async () => {
      const size = await getQueueSize();
      if (mounted) setPending(size);
      if (size > 0) {
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
  }, []);

  return { online: true, pending, syncing };
}
