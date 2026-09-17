import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from './supabase';

export async function exportHSEReport(): Promise<string | null> {
  try {
    const [activeReportsRes, archivedReportsRes, activeActionsRes, archivedActionsRes, activeAssetsRes, archivedAssetsRes] = await Promise.all([
      supabase.from('hse_reports').select('*').is('deleted_at', null).order('created_at', { ascending: false }).limit(100),
      supabase.from('hse_reports').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }).limit(100),
      supabase.from('actions').select('*').is('deleted_at', null).order('created_at', { ascending: false }).limit(100),
      supabase.from('actions').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }).limit(100),
      supabase.from('assets').select('*').is('deleted_at', null).order('created_at', { ascending: false }).limit(100),
      supabase.from('assets').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }).limit(100),
    ]);

    const activeReports = activeReportsRes.data ?? [];
    const archivedReports = archivedReportsRes.data ?? [];
    const activeActions = activeActionsRes.data ?? [];
    const archivedActions = archivedActionsRes.data ?? [];
    const activeAssets = activeAssetsRes.data ?? [];
    const archivedAssets = archivedAssetsRes.data ?? [];

    const activeReportsCount = activeReports.length;
    const archivedReportsCount = archivedReports.length;
    const activeActionsCount = activeActions.length;
    const archivedActionsCount = archivedActions.length;
    const activeAssetsCount = activeAssets.length;
    const archivedAssetsCount = archivedAssets.length;

    const totalReports = activeReportsCount + archivedReportsCount;
    const totalActions = activeActionsCount + archivedActionsCount;
    const totalAssets = activeAssetsCount + archivedAssetsCount;

    const today = new Date().toLocaleDateString('en-GB');

    const buildReportTable = (rows: any[], cols: (string | null)[]) => {
      if (rows.length === 0) return '<tr><td colspan="' + cols.length + '" style="text-align:center;color:#94A3B8;padding:12px;">No items</td></tr>';
      return rows.map((r) =>
        '<tr>' + cols.map((c) => {
          const v = r[c ?? ''] ?? '—';
          return '<td>' + String(v).replace(/</g, '&lt;') + '</td>';
        }).join('') + '</tr>'
      ).join('');
    };

    const buildArchivedTable = (rows: any[], cols: (string | null)[]) => {
      if (rows.length === 0) return '<tr><td colspan="' + cols.length + '" style="text-align:center;color:#94A3B8;padding:12px;">No items</td></tr>';
      return rows.map((r) =>
        '<tr style="border-left:3px solid #FCA5A5;">' + cols.map((c) => {
          let v = r[c ?? ''] ?? '—';
          const isTitle = c === 'title' || c === 'note' || c === 'name' || c === 'asset_code';
          if (isTitle) {
            v = '<span style="text-decoration:line-through;color:#64748B;">' + String(v).replace(/</g, '&lt;') + '</span>';
          } else {
            v = '<span style="color:#64748B;">' + String(v).replace(/</g, '&lt;') + '</span>';
          }
          return '<td>' + v + '</td>';
        }).join('') + '</tr>'
      ).join('');
    };

    const html = `
      <html><head><meta charset="utf-8"><style>
        @page { size: A4; margin: 16px; }
        body { font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #0F172A; font-size: 10px; line-height: 1.4; }
        h1 { color: #0EA5E9; font-size: 20px; margin: 0 0 4px 0; }
        .date { color: #64748B; font-size: 11px; margin-bottom: 20px; }
        h2 { font-size: 14px; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #0EA5E9; padding-bottom: 4px; color: #0F172A; }
        .archived-section { border: 1px dashed #FCA5A5; border-radius: 8px; padding: 12px; margin-top: 8px; background: #FFF5F5; }
        .archived-label { color: #DC2626; font-size: 11px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        th { background: #F1F5F9; color: #334155; font-weight: 700; text-align: left; padding: 6px 8px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.3px; border-bottom: 2px solid #CBD5E1; }
        td { padding: 5px 8px; border-bottom: 1px solid #E2E8F0; font-size: 9px; color: #0F172A; }
        tr:hover td { background: #F8FAFC; }
        .summary-grid { display: flex; gap: 12px; margin: 12px 0 20px 0; }
        .summary-card { flex: 1; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px; background: #FFFFFF; }
        .summary-card h3 { margin: 0 0 4px 0; font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
        .summary-card .big { font-size: 28px; font-weight: 800; color: #0EA5E9; }
        .summary-card .sub { font-size: 9px; color: #94A3B8; margin-top: 2px; }
        .summary-card.active .big { color: #16A34A; }
        .summary-card.archived .big { color: #DC2626; }
        .footer { margin-top: 32px; text-align: center; color: #94A3B8; font-size: 9px; border-top: 1px solid #E2E8F0; padding-top: 12px; }
      </style></head>
      <body>
        <h1>ALFAYADH PETROLEUM HSE — Executive Report</h1>
        <div class="date">Generated: ${today}</div>

        <h2>Summary</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total Reports</h3>
            <div class="big">${totalReports}</div>
            <div class="sub">${activeReportsCount} active &middot; ${archivedReportsCount} archived</div>
          </div>
          <div class="summary-card">
            <h3>Total Actions</h3>
            <div class="big">${totalActions}</div>
            <div class="sub">${activeActionsCount} active &middot; ${archivedActionsCount} archived</div>
          </div>
          <div class="summary-card">
            <h3>Total Assets</h3>
            <div class="big">${totalAssets}</div>
            <div class="sub">${activeAssetsCount} active &middot; ${archivedAssetsCount} archived</div>
          </div>
        </div>

        <h2>Active HSE Reports</h2>
        <table>
          <thead><tr><th>Type</th><th>Note</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>${buildReportTable(activeReports, ['type', 'note', 'status', 'created_at'])}</tbody>
        </table>

        <h2>Active Actions</h2>
        <table>
          <thead><tr><th>Title</th><th>Type</th><th>Priority</th><th>Status</th><th>Due</th></tr></thead>
          <tbody>${buildReportTable(activeActions, ['title', 'type', 'priority', 'status', 'due_date'])}</tbody>
        </table>

        <h2>Active Assets</h2>
        <table>
          <thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Location</th><th>Status</th></tr></thead>
          <tbody>${buildReportTable(activeAssets, ['asset_code', 'name', 'type', 'location', 'status'])}</tbody>
        </table>

        <div class="archived-section">
          <div class="archived-label">Archived HSE Reports</div>
          <table>
            <thead><tr><th>Type</th><th>Note</th><th>Status</th><th>Date</th><th>Deleted At</th></tr></thead>
            <tbody>${buildArchivedTable(archivedReports, ['type', 'note', 'status', 'created_at', 'deleted_at'])}</tbody>
          </table>
        </div>

        <div class="archived-section">
          <div class="archived-label">Archived Actions</div>
          <table>
            <thead><tr><th>Title</th><th>Type</th><th>Priority</th><th>Status</th><th>Due</th><th>Deleted At</th></tr></thead>
            <tbody>${buildArchivedTable(archivedActions, ['title', 'type', 'priority', 'status', 'due_date', 'deleted_at'])}</tbody>
          </table>
        </div>

        <div class="archived-section">
          <div class="archived-label">Archived Assets</div>
          <table>
            <thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Location</th><th>Status</th><th>Deleted At</th></tr></thead>
            <tbody>${buildArchivedTable(archivedAssets, ['asset_code', 'name', 'type', 'location', 'status', 'deleted_at'])}</tbody>
          </table>
        </div>

        <div class="footer">
          Alfayadh Petroleum HSE — Confidential<br/>
          Generated on ${today} via Alfayadh HSE Mobile App
        </div>
      </body></html>
    `;

    return await Print.printAsync({ html, base64: true });
  } catch (err: any) {
    console.error('exportHSEReport error:', err);
    return null;
  }
}
