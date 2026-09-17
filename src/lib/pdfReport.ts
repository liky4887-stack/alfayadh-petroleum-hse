import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from './supabase';

export async function exportHSEReport(): Promise<string | null> {
  try {
    const [reports, actions, assets] = await Promise.all([
      supabase.from('hse_reports').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('actions').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('assets').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    const today = new Date().toLocaleDateString('en-GB');
    const html = `
      <html><head><meta charset="utf-8"><style>
        body { font-family: Helvetica, Arial, sans-serif; padding: 32px; color: #0F172A; }
        h1 { color: #0EA5E9; font-size: 24px; margin: 0; }
        h2 { font-size: 15px; margin-top: 24px; border-bottom: 2px solid #0EA5E9; padding-bottom: 4px; }
        .sub { color: #64748B; font-size: 11px; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
        th { background: #F1F5F9; padding: 6px; text-align: left; }
        td { padding: 5px 6px; border-bottom: 1px solid #E5E7EB; }
        .badge { padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 700; }
        .open { background: #FFEDD5; color: #EA580C; }
        .closed { background: #DCFCE7; color: #16A34A; }
        .footer { margin-top: 32px; font-size: 9px; color: #94A3B8; text-align: center; }
      </style></head><body>
        <h1>ALFAYADH PETROLEUM</h1>
        <div class="sub">HSE Report — Generated ${today}</div>
        <h2>Summary</h2>
        <table><tr>
          <td><strong>Reports</strong> ${reports.data?.length || 0}</td>
          <td><strong>Actions</strong> ${actions.data?.length || 0}</td>
          <td><strong>Assets</strong> ${assets.data?.length || 0}</td>
        </tr></table>
        <h2>Recent Reports</h2>
        <table><tr><th>Type</th><th>Note</th><th>Status</th><th>Date</th></tr>
          ${(reports.data || []).slice(0, 25).map((r: any) => `
            <tr><td>${r.type || '—'}</td><td>${(r.note || '').slice(0, 70)}</td>
            <td><span class="badge ${r.status === 'open' ? 'open' : 'closed'}">${r.status}</span></td>
            <td>${new Date(r.created_at).toLocaleDateString('en-GB')}</td></tr>`).join('')}
        </table>
        <h2>Actions</h2>
        <table><tr><th>Title</th><th>Type</th><th>Priority</th><th>Status</th><th>Due</th></tr>
          ${(actions.data || []).slice(0, 25).map((a: any) => `
            <tr><td>${(a.title || '').slice(0, 40)}</td><td>${a.type || '—'}</td>
            <td>${a.priority || '—'}</td><td>${a.status || '—'}</td><td>${a.due_date || '—'}</td></tr>`).join('')}
        </table>
        <h2>Assets</h2>
        <table><tr><th>Code</th><th>Name</th><th>Type</th><th>Location</th><th>Status</th></tr>
          ${(assets.data || []).slice(0, 25).map((a: any) => `
            <tr><td>${a.asset_code || '—'}</td><td>${a.name || '—'}</td>
            <td>${a.type || '—'}</td><td>${a.location || '—'}</td><td>${a.status || '—'}</td></tr>`).join('')}
        </table>
        <div class="footer">Confidential • Alfayadh Petroleum HSE</div>
      </body></html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'HSE Report' });
    }
    return uri;
  } catch (err) {
    console.error('PDF export failed:', err);
    return null;
  }
}
