import { supabase } from './supabase';

type SoftDeleteTable = 'actions' | 'assets' | 'hse_reports' | 'training_courses' | 'employees';

/**
 * Soft-delete a row by setting deleted_at + deleted_by.
 * Never hard-deletes. Preserves data for audit trail.
 */
export async function softDelete(table: SoftDeleteTable, id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from(table)
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user?.id ?? null,
      })
      .eq('id', id);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: String(err?.message ?? err) };
  }
}

/**
 * Restore a soft-deleted row by clearing deleted_at + deleted_by.
 */
export async function restoreRow(table: SoftDeleteTable, id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from(table)
      .update({ deleted_at: null, deleted_by: null })
      .eq('id', id);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: String(err?.message ?? err) };
  }
}
