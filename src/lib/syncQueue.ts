import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export type SyncOp = {
  id: string;
  table: 'hse_reports' | 'actions' | 'assets' | 'training_courses' | 'enrollments';
  operation: 'insert' | 'update' | 'delete';
  payload: Record<string, unknown>;
  matchKey?: string;
  createdAt: number;
  retries: number;
};

const QUEUE_KEY = 'hse_sync_queue';

async function getQueue(): Promise<SyncOp[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) as SyncOp[] : [];
  } catch {
    return [];
  }
}

async function saveQueue(q: SyncOp[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export async function enqueue(op: Omit<SyncOp, 'id' | 'createdAt' | 'retries'>): Promise<void> {
  const queue = await getQueue();
  const full: SyncOp = {
    ...op,
    id: `op_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    retries: 0,
  };
  queue.push(full);
  await saveQueue(queue);
}

export async function flushQueue(): Promise<{ succeeded: number; failed: number }> {
  const queue = await getQueue();
  if (queue.length === 0) return { succeeded: 0, failed: 0 };

  const remaining: SyncOp[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const op of queue) {
    let query = supabase.from(op.table);
    if (op.operation === 'insert') {
      const { error } = await (query as any).insert(op.payload);
      if (error) { failed++; op.retries++; remaining.push(op); }
      else succeeded++;
    } else if (op.operation === 'update' && op.matchKey) {
      const { error } = await (query as any).update(op.payload).eq('id', op.matchKey);
      if (error) { failed++; op.retries++; remaining.push(op); }
      else succeeded++;
    } else if (op.operation === 'delete' && op.matchKey) {
      const { error } = await (query as any).delete().eq('id', op.matchKey);
      if (error) { failed++; op.retries++; remaining.push(op); }
      else succeeded++;
    }
  }

  await saveQueue(remaining);
  return { succeeded, failed };
}

export async function getQueueSize(): Promise<number> {
  const q = await getQueue();
  return q.length;
}
