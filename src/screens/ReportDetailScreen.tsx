import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, Linking, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { C, TYPE_LABELS, STATUS_LABELS, formatDate } from '@/theme/colors';
import { useHapticFeedback } from '@/lib/haptics';
import { useConfirm } from '@/components/ConfirmDialog';
import { Toast } from '@/components/Toast';
import { ChevronLeft, MapPin, Trash2, CircleCheck, Link2, Pencil, Check, X, RefreshCw } from '@/lib/icons';
import { softDelete, restoreRow } from '@/lib/softDelete';
import { useRole } from '@/lib/useRole';
import { requireAdmin } from '@/lib/requireAdmin';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';
import type { HSEReport } from '@/lib/types';

export default function ReportDetailScreen({ navigation, route }: { navigation: NativeStackNavigationProp<RootStackParamList>; route: any }) {
  const haptics = useHapticFeedback();
  const reportId: string = route.params?.reportId ?? '';
  const hasReportId = !!route.params?.reportId;
  const [report, setReport] = useState<HSEReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editNote, setEditNote] = useState('');
  const [editAction, setEditAction] = useState('');
  const [toast, setToast] = useState({ visible: false, msg: '', type: 'success' as 'success' | 'error' });
  const [archivedModal, setArchivedModal] = useState(false);
  const { confirm, dialog } = useConfirm();
  const { isAdmin } = useRole();
  const isDeleted = !!report?.deleted_at;

  const loadReport = useCallback(async () => {
    if (!hasReportId) {
      setLoading(false);
      setReport(null);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('hse_reports').select('*').eq('id', reportId).maybeSingle();
    setReport(data as HSEReport | null);
    setLoading(false);
  }, [reportId, hasReportId]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, msg, type });
  };

  const handleMarkClosed = async () => {
    if (!report) return;
    haptics.impactMedium();
    setUpdating(true);
    const { error } = await supabase.from('hse_reports').update({ status: 'closed' }).eq('id', report.id);
    setUpdating(false);
    if (error) {
      console.error('Mark closed error:', error);
      haptics.notificationError();
      showToast(`Failed: ${error.message}`, 'error');
      return;
    }
    haptics.notificationSuccess();
    showToast('Report closed');
    loadReport();
  };

  const handleDelete = async () => {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      haptics.notificationError();
      setToast({ visible: true, msg: 'Admin access required', type: 'error' });
      return;
    }
    const confirmed = await confirm({
      title: 'Delete Report?',
      message: 'It will be moved to archive. You can restore it later.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;
    haptics.impactMedium();
    try {
      const result = await softDelete('hse_reports', reportId);
      if (!result.ok) {
        haptics.notificationError();
        setToast({ visible: true, msg: result.error ?? 'Delete failed', type: 'error' });
        return;
      }
      haptics.notificationSuccess();
      setToast({ visible: true, msg: 'Report archived', type: 'success' });
      setTimeout(() => navigation.goBack(), 500);
    } catch (err) {
      haptics.notificationError();
      setToast({ visible: true, msg: 'Failed to delete', type: 'error' });
    }
  };

  const handleRestore = async () => {
    haptics.impactMedium();
    try {
      const result = await restoreRow('hse_reports', reportId);
      if (!result.ok) {
        haptics.notificationError();
        setToast({ visible: true, msg: result.error ?? 'Restore failed', type: 'error' });
        return;
      }
      haptics.notificationSuccess();
      setToast({ visible: true, msg: 'Report restored', type: 'success' });
      setArchivedModal(false);
      loadReport();
    } catch (err) {
      haptics.notificationError();
    }
  };

  const handleSaveEdit = async () => {
    if (!report) return;
    haptics.impactMedium();
    setUpdating(true);
    const { error } = await supabase
      .from('hse_reports')
      .update({ note: editNote.trim(), corrective_action: editAction.trim() || null })
      .eq('id', report.id);
    setUpdating(false);
    if (error) {
      console.error('Edit save error:', error);
      haptics.notificationError();
      showToast(`Failed: ${error.message}`, 'error');
      return;
    }
    haptics.notificationSuccess();
    showToast('Report updated');
    setEditing(false);
    loadReport();
  };

  const startEdit = () => {
    if (!report) return;
    haptics.impactMedium();
    setEditNote(report.note);
    setEditAction(report.corrective_action ?? '');
    setEditing(true);
  };

  const openMap = () => {
    if (!report?.location_lat || !report?.location_lng) return;
    haptics.impactMedium();
    const url = `https://www.google.com/maps?q=${report.location_lat},${report.location_lng}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <SafeAreaView style={S.screen} edges={['top']}>
        <View style={S.loadingWrap}><ActivityIndicator size="large" color={C.accent} /></View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={S.screen} edges={['top']}>
        <View style={S.loadingWrap}>
          <Text style={S.emptyText}>{hasReportId ? 'Report not found.' : 'No report ID provided.'}</Text>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [S.backBtn, pressed && S.pressed]}>
            <ChevronLeft size={20} color="#0F172A" />
            <Text style={S.backText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const typeColor = report.type === 'safe' ? C.green : C.red;
  const typeBg = report.type === 'safe' ? C.greenBg : C.redBg;
  const isOpen = report.status === 'open';

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      {isDeleted && (
        <View style={S.archivedBanner}>
          <Text style={S.archivedBannerText}>
            ⚠ This report is archived (deleted on {formatDate(report.deleted_at ?? report.created_at)})
          </Text>
        </View>
      )}
      <View style={S.header}>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.goBack(); }} style={({ pressed }) => [S.backBtn, pressed && S.pressed]}>
          <ChevronLeft size={20} color={C.ink} />
          <Text style={S.backText}>Back</Text>
        </Pressable>
        <Text style={S.headerTitle}>Report Detail</Text>
        <View style={{ width: 70 }} />
      </View>
      <ScrollView contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={S.topRow}>
          <View style={[S.typeBadge, { backgroundColor: typeBg }]}>
            <Text style={[S.typeBadgeText, { color: typeColor }]}>{TYPE_LABELS[report.type] ?? report.type}</Text>
          </View>
          <View style={[S.statusPill, { backgroundColor: isOpen ? C.orangeBg : C.greenBg }]}>
            <Text style={[S.statusPillText, { color: isOpen ? C.orange : C.green }]}>{isOpen ? 'Open' : 'Closed'}</Text>
          </View>
          <Text style={S.timeText}>{formatDate(report.created_at)}</Text>
        </View>

        {editing ? (
          <>
            <Text style={S.sectionLabel}>Note</Text>
            <View style={S.editInputWrap}>
              <TextInput
                value={editNote}
                onChangeText={setEditNote}
                multiline
                style={S.editInput}
                placeholder="Edit note..."
                placeholderTextColor={C.faint}
              />
            </View>
            <Text style={S.sectionLabel}>Corrective Action</Text>
            <View style={S.editInputWrap}>
              <TextInput
                value={editAction}
                onChangeText={setEditAction}
                multiline
                style={S.editInput}
                placeholder="Edit corrective action..."
                placeholderTextColor={C.faint}
              />
            </View>
            <View style={S.editBtnRow}>
              <Pressable onPress={() => { haptics.impactMedium(); setEditing(false); }} style={({ pressed }) => [S.cancelEditBtn, pressed && S.pressed]}>
                <X size={16} color={C.muted} strokeWidth={2} />
                <Text style={S.cancelEditText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={updating ? null : handleSaveEdit} disabled={updating} style={({ pressed }) => [S.saveEditBtn, pressed && S.pressed, updating && S.btnDisabled]}>
                {updating ? <ActivityIndicator size="small" color="#FFF" /> : (
                  <>
                    <Check size={16} color="#FFF" strokeWidth={2.5} />
                    <Text style={S.saveEditText}>Save</Text>
                  </>
                )}
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={S.noteHeader}>
              <Text style={S.sectionLabel}>Note</Text>
              <Pressable onPress={startEdit} style={({ pressed }) => [S.editBtn, pressed && S.pressed]}>
                <Pencil size={14} color={C.accent} strokeWidth={2} />
                <Text style={S.editBtnText}>Edit</Text>
              </Pressable>
            </View>
            <Text style={S.noteText}>{report.note}</Text>

            {report.corrective_action && (
              <>
                <Text style={S.sectionLabel}>Corrective Action</Text>
                <Text style={S.bodyText}>{report.corrective_action}</Text>
              </>
            )}
          </>
        )}

        {report.department && (
          <>
            <Text style={S.sectionLabel}>Department</Text>
            <Text style={S.bodyText}>{report.department}{report.subcategory ? ` · ${report.subcategory}` : ''}</Text>
          </>
        )}

        {report.image_url && (
          <>
            <Text style={S.sectionLabel}>Attached Image</Text>
            <View style={S.imageWrap}>
              <Image source={{ uri: report.image_url }} style={S.image} resizeMode="cover" />
            </View>
          </>
        )}

        {report.location_lat && report.location_lng && (
          <>
            <Text style={S.sectionLabel}>Location</Text>
            <View style={S.locationRow}>
              <MapPin size={16} color={C.accent} strokeWidth={2} />
              <Text style={S.coordsText}>{report.location_lat.toFixed(4)}, {report.location_lng.toFixed(4)}</Text>
              <Pressable onPress={openMap} style={({ pressed }) => [S.mapBtn, pressed && S.pressed]}>
                <Link2 size={14} color={C.accent} strokeWidth={2} />
                <Text style={S.mapBtnText}>View on map</Text>
              </Pressable>
            </View>
          </>
        )}

        {isOpen && (
          <Pressable
            onPress={updating ? null : handleMarkClosed}
            disabled={updating}
            style={({ pressed }) => [S.closeBtn, pressed && S.pressed, updating && S.btnDisabled]}
          >
            {updating ? <ActivityIndicator size="small" color="#FFF" /> : (
              <>
                <CircleCheck size={18} color="#FFF" strokeWidth={2.5} />
                <Text style={S.closeBtnText}>Mark as Closed</Text>
              </>
            )}
          </Pressable>
        )}

        {isDeleted ? (
          <Pressable onPress={() => setArchivedModal(true)} style={({ pressed }) => [S.restoreBtn, pressed && S.pressed]}>
            <RefreshCw size={16} color={C.accent} strokeWidth={2} />
            <Text style={[S.deleteBtnText, { color: C.accent }]}>Restore</Text>
          </Pressable>
        ) : isAdmin && (
          <Pressable onPress={handleDelete} style={({ pressed }) => [S.deleteBtn, pressed && S.pressed]}>
            <Trash2 size={16} color={C.red} strokeWidth={2} />
            <Text style={S.deleteBtnText}>Delete Report</Text>
          </Pressable>
        )}
      </ScrollView>
      {dialog}
      <Toast message={toast.msg} type={toast.type} visible={toast.visible} onHide={() => setToast({ visible: false, msg: '', type: 'success' })} />
      {archivedModal && (
        <Modal transparent animationType="fade" visible={true} onRequestClose={() => setArchivedModal(false)}>
          <Pressable style={S.modalOverlay} onPress={() => setArchivedModal(false)}>
            <View style={S.modalCard}>
              <Text style={S.modalTitle}>Restore Report?</Text>
              <Text style={S.modalSubtitle}>This will unarchive the report and make it visible again.</Text>
              <View style={S.modalBtns}>
                <Pressable onPress={() => setArchivedModal(false)} style={S.modalCancelBtn}>
                  <Text style={S.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleRestore} style={[S.modalDeleteBtn, { backgroundColor: '#0EA5E9' }]}>
                  <Text style={S.modalDeleteText}>Restore</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 15, fontFamily: 'Chevalon-SemiBold', color: C.ink },
  headerTitle: { fontSize: 17, fontFamily: 'Chevalon-ExtraBold', color: C.ink, flex: 1, textAlign: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40, gap: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  typeBadgeText: { fontSize: 12, fontFamily: 'Chevalon-Bold' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusPillText: { fontSize: 12, fontFamily: 'Chevalon-Bold' },
  timeText: { fontSize: 12, fontFamily: 'Chevalon-Regular', color: C.faint },
  noteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  sectionLabel: { fontSize: 14, fontFamily: 'Chevalon-Bold', color: C.ink, marginTop: 4 },
  noteText: { fontSize: 16, fontFamily: 'Chevalon-Medium', color: C.ink, lineHeight: 24 },
  bodyText: { fontSize: 15, fontFamily: 'Chevalon-Regular', color: C.muted, lineHeight: 22 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accentSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  editBtnText: { fontSize: 13, fontFamily: 'Chevalon-Bold', color: C.accent },
  editInputWrap: { borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 },
  editInput: { fontSize: 15, color: C.ink, minHeight: 80, textAlignVertical: 'top' },
  editBtnRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  cancelEditBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: '#FFF' },
  cancelEditText: { fontSize: 15, fontFamily: 'Chevalon-SemiBold', color: C.muted },
  saveEditBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: C.accent },
  saveEditText: { fontSize: 15, fontFamily: 'Chevalon-Bold', color: '#FFF' },
  imageWrap: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  image: { width: '100%', height: 220, resizeMode: 'cover' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  coordsText: { fontSize: 14, fontFamily: 'Chevalon-Medium', color: C.muted, fontVariant: ['tabular-nums'] },
  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accentSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  mapBtnText: { fontSize: 13, fontFamily: 'Chevalon-Bold', color: C.accent },
  closeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.accent, paddingVertical: 16, borderRadius: 14, minHeight: 52, marginTop: 12 },
  closeBtnText: { color: '#FFF', fontSize: 16, fontFamily: 'Chevalon-Bold' },
  btnDisabled: { opacity: 0.5 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.red, paddingVertical: 14, borderRadius: 14, marginTop: 12 },
  deleteBtnText: { fontSize: 15, fontFamily: 'Chevalon-Bold', color: C.red },
  emptyText: { fontSize: 16, fontFamily: 'Chevalon-SemiBold', color: C.muted },
  pressed: { opacity: 0.7 },

  archivedBanner: { backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FCA5A5' },
  archivedBannerText: { fontSize: 13, fontFamily: 'Chevalon-SemiBold', color: '#DC2626', textAlign: 'center' },
  restoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#0EA5E9', paddingVertical: 14, borderRadius: 14, marginTop: 12 },});
