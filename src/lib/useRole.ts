import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export type Role = 'admin' | 'supervisor' | 'employee';

interface RoleData {
  role: Role;
  department: string | null;
  fullName: string | null;
}

export function useRole(): RoleData & { loading: boolean } {
  const [data, setData] = useState<RoleData>({ role: 'employee', department: null, fullName: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;
        if (!userId) { setLoading(false); return; }
        const { data: row } = await supabase
          .from('user_roles')
          .select('role, department, full_name')
          .eq('user_id', userId)
          .maybeSingle();
        if (mounted && row) {
          setData({
            role: (row.role as Role) ?? 'employee',
            department: row.department,
            fullName: row.full_name,
          });
        }
      } catch {
        // ignore - default to employee
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { ...data, loading };
}
