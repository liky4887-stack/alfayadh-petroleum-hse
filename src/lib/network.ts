import { useState, useEffect } from 'react';
import { flushQueue, getQueueSize } from './syncQueue';
import { supabase } from './supabase';

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${supabase.supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          signal: controller.signal,
          headers: { apikey: supabase.supabaseKey },
        });
        clearTimeout(timeout);
        if (mounted) setOnline(res.ok);
      } catch {
        if (mounted) setOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return online;
}

export function useSyncStatus(): { online: boolean; pending: number; syncing: boolean } {
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let mounted = true;
    const checkQueue = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${supabase.supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          signal: controller.signal,
          headers: { apikey: supabase.supabaseKey },
        });
        clearTimeout(timeout);
        if (mounted) setOnline(res.ok);
      } catch {
        if (mounted) setOnline(false);
      }

      const size = await getQueueSize();
      if (mounted) setPending(size);
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
  }, []);

  return { online, pending, syncing };
}
