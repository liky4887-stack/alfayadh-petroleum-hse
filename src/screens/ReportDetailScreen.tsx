import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { C, TYPE_LABELS, STATUS_LABELS, formatDate } from '@/theme/colors';
import { useHapticFeedback } from '@/lib/haptics';
import { ChevronLeft, MapPin, Trash2, CircleCheck, Link2 } from '@/lib/icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';
import type { HSEReport } from '@/lib/types';

export default function ReportDetailScreen({ navigation, route }: { navigation: NativeStackNavigationProp<RootStackParamList>; route: any }) {
  const haptics = useHapticFeedback();
  const reportId: string = route.params?.reportId ?? '';
  const [report, setReport] = useState<HSEReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('hse_reports').select('*').eq('id', reportId).maybeSingle();
    setReport(data as HSEReport | null);
    setLoading(false);
  }, [reportId]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const handleMarkClosed = async () => {
    if (!report) return;
    haptics.impactMedium();
    setUpdating(true);
    await supabase.from('hse_reports').update({ status: 'closed' }).eq('id', report.id);
    setUpdating(false);
    haptics.notificationSuccess();
    loadReport();
  };

  const handleDelete = () => {
    haptics.impactMedium();
    Alert.alert(
      'Delete Report',
      'Are you sure you want to permanently delete this report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('hse_reports').delete().eq('id', reportId);
            haptics.notificationSuccess();
            navigation.goBack();
          },
        },
      ]
    );
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
          <Text style={S.emptyText}>Report not found.</Text>
          <Pressable onPress={() => navigation.goBack()}><Text style={S.backText}>Go Back</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const typeColor = report.type === 'safe' ? C.green : C.red;
  const typeBg = report.type === 'safe' ? C.greenBg : C.redBg;
  const isOpen = report.status === 'open';

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
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

        <Text style={S.sectionLabel}>Note</Text>
        <Text style={S.noteText}>{report.note}</Text>

        {report.corrective_action && (
          <>
            <Text style={S.sectionLabel}>Corrective Action</Text>
            <Text style={S.bodyText}>{report.corrective_action}</Text>
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

        <Pressable onPress={handleDelete} style={({ pressed }) => [S.deleteBtn, pressed && S.pressed]}>
          <Trash2 size={16} color={C.red} strokeWidth={2} />
          <Text style={S.deleteBtnText}>Delete Report</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 15, fontWeight: '600', color: C.ink },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.ink, flex: 1, textAlign: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40, gap: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  typeBadgeText: { fontSize: 12, fontWeight: '700' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  timeText: { fontSize: 12, fontWeight: '400', color: C.faint },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: C.ink, marginTop: 4 },
  noteText: { fontSize: 16, fontWeight: '500', color: C.ink, lineHeight: 24 },
  bodyText: { fontSize: 15, fontWeight: '400', color: C.muted, lineHeight: 22 },
  imageWrap: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  image: { width: '100%', height: 220, resizeMode: 'cover' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  coordsText: { fontSize: 14, fontWeight: '500', color: C.muted, fontVariant: ['tabular-nums'] },
  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accentSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  mapBtnText: { fontSize: 13, fontWeight: '700', color: C.accent },
  closeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.accent, paddingVertical: 16, borderRadius: 14, minHeight: 52, marginTop: 12 },
  closeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.red, paddingVertical: 14, borderRadius: 14, marginTop: 12 },
  deleteBtnText: { fontSize: 15, fontWeight: '700', color: C.red },
  emptyText: { fontSize: 16, fontWeight: '600', color: C.muted },
  pressed: { opacity: 0.7 },
});
