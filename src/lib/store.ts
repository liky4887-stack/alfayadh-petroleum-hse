import { create } from 'zustand';
import { supabase } from './supabase';
import type { HSEReport, QueuedReport, ReportType, ReportStatus } from './types';

interface ReportInput {
  type: ReportType;
  note: string;
  corrective_action?: string | null;
  image_url?: string | null;
  department?: string | null;
  subcategory?: string | null;
  status: ReportStatus;
  location_lat?: number | null;
  location_lng?: number | null;
}

interface HSEStore {
  reports: HSEReport[];
  loading: boolean;
  isOnline: boolean;
  syncPending: number;
  loadReports: () => Promise<void>;
  submitReport: (input: ReportInput) => Promise<{ success: boolean; offline: boolean }>;
  subscribeToReports: () => () => void;
  setOnline: (online: boolean) => void;
  flushQueue: () => Promise<void>;
}

const QUEUE_KEY = 'hse_offline_queue';

function getQueue(): QueuedReport[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(q: QueuedReport[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export const useHSEStore = create<HSEStore>((set, get) => ({
  reports: [],
  loading: true,
  isOnline: navigator.onLine,
  syncPending: getQueue().length,

  loadReports: async () => {
    const { data, error } = await supabase
      .from('hse_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      console.error('Failed to load reports:', error.message);
      set({ loading: false });
      return;
    }
    set({ reports: data ?? [], loading: false });
  },

  submitReport: async (input) => {
    const { isOnline } = get();

    if (!isOnline) {
      const queue = getQueue();
      const item: QueuedReport = {
        tempId: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        data: {
          type: input.type,
          note: input.note,
          corrective_action: input.corrective_action ?? null,
          image_url: input.image_url ?? null,
          department: input.department ?? null,
          subcategory: input.subcategory ?? null,
          status: input.status,
          location_lat: input.location_lat ?? null,
          location_lng: input.location_lng ?? null,
        },
        createdAt: new Date().toISOString(),
      };
      queue.push(item);
      saveQueue(queue);
      set({ syncPending: queue.length });
      return { success: true, offline: true };
    }

    const { data, error } = await supabase
      .from('hse_reports')
      .insert({
        type: input.type,
        note: input.note,
        corrective_action: input.corrective_action ?? null,
        image_url: input.image_url ?? null,
        department: input.department ?? null,
        subcategory: input.subcategory ?? null,
        status: input.status,
        location_lat: input.location_lat ?? null,
        location_lng: input.location_lng ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Insert failed:', error.message);
      const queue = getQueue();
      const item: QueuedReport = {
        tempId: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        data: {
          type: input.type,
          note: input.note,
          corrective_action: input.corrective_action ?? null,
          image_url: input.image_url ?? null,
          department: input.department ?? null,
          subcategory: input.subcategory ?? null,
          status: input.status,
          location_lat: input.location_lat ?? null,
          location_lng: input.location_lng ?? null,
        },
        createdAt: new Date().toISOString(),
      };
      queue.push(item);
      saveQueue(queue);
      set({ syncPending: queue.length });
      return { success: true, offline: true };
    }

    if (data) {
      set((state) => ({ reports: [data, ...state.reports] }));
    }
    return { success: true, offline: false };
  },

  subscribeToReports: () => {
    const channel = supabase
      .channel('hse_reports_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hse_reports' }, (payload) => {
        const newReport = payload.new as HSEReport;
        set((state) => {
          if (state.reports.some((r) => r.id === newReport.id)) return state;
          return { reports: [newReport, ...state.reports] };
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'hse_reports' }, (payload) => {
        const updated = payload.new as HSEReport;
        set((state) => ({
          reports: state.reports.map((r) => (r.id === updated.id ? updated : r)),
        }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'hse_reports' }, (payload) => {
        const deleted = payload.old as HSEReport;
        set((state) => ({ reports: state.reports.filter((r) => r.id !== deleted.id) }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  setOnline: (online) => {
    set({ isOnline: online });
    if (online) {
      get().flushQueue();
    }
  },

  flushQueue: async () => {
    const queue = getQueue();
    if (queue.length === 0) return;

    const remaining: QueuedReport[] = [];
    for (const item of queue) {
      const { error } = await supabase.from('hse_reports').insert({
        type: item.data.type,
        note: item.data.note,
        corrective_action: item.data.corrective_action ?? null,
        image_url: item.data.image_url ?? null,
        department: item.data.department ?? null,
        subcategory: item.data.subcategory ?? null,
        status: item.data.status,
        location_lat: item.data.location_lat ?? null,
        location_lng: item.data.location_lng ?? null,
      });
      if (error) {
        remaining.push(item);
      }
    }
    saveQueue(remaining);
    set({ syncPending: remaining.length });
    if (remaining.length < queue.length) {
      get().loadReports();
    }
  },
}));
