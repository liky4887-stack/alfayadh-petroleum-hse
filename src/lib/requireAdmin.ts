import { supabase } from './supabase';

export async function requireAdmin(): Promise<boolean> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return false;

    const { data: roleRow, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError || !roleRow) return false;
    return roleRow.role === 'admin';
  } catch {
    return false;
  }
}
