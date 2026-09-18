import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useConfirm } from '@/components/ConfirmDialog';
import { C } from '@/theme/colors';
import { useHapticFeedback } from '@/lib/haptics';
import { Trash2, Pencil, ChevronLeft, Circle, CircleCheck, Clock, Tag, RefreshCw } from '@/lib/icons';
import { softDelete, restoreRow } from '@/lib/softDelete';
import { useRole } from '@/lib/useRole';
import { requireAdmin } from '@/lib/requireAdmin';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

interface Enrollment {
  id: string;
  status: string;
  completed_at: string | null;
  employee: {
    id: string;
    full_name: string;
    job_title: string | null;
    department: string | null;
  };
}

interface CourseData {
  id: string;
  title: string;
  description: string | null;
  duration: string | null;
  category: string | null;
  thumbnail_url: string | null;
  deleted_at: string | null;
}

export default function CourseDetailScreen({ navigation, route }: { navigation: NativeStackNavigationProp<RootStackParamList>; route: any }) {
  const haptics = useHapticFeedback();
  const { confirm } = useConfirm();
  const { isAdmin } = useRole();
  const courseId: string = route.params?.courseId ?? '';
  const [course, setCourse] = useState<CourseData | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [archivedModal, setArchivedModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: courseData }, { data: enrollData }] = await Promise.all([
      supabase.from('training_courses').select('*').eq('id', courseId).maybeSingle(),
      supabase.from('enrollments').select('id, status, completed_at, employee:employees(id, full_name, job_title, department)').eq('course_id', courseId),
    ]);
    setCourse(courseData as CourseData | null);
    setEnrollments((enrollData ?? []) as unknown as Enrollment[]);
    setLoading(false);
  }, [courseId]);

  useEffect(() => { navigation.addListener('focus', loadData); return () => navigation.removeListener('focus', loadData); }, [navigation, loadData]);

  const toggleComplete = async (enrollmentId: string, currentStatus: string) => {
    haptics.impactMedium();
    setUpdating(enrollmentId);
    const newStatus = currentStatus === 'completed' ? 'assigned' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;
    await supabase.from('enrollments').update({ status: newStatus, completed_at: completedAt }).eq('id', enrollmentId);
    setUpdating(null);
    haptics.notificationSuccess();
    loadData();
  };

  const handleDelete = async () => {
    const isAdmin = await requireAdmin();
    if (!isAdmin) { Alert.alert('Access Denied', 'Admin access required to delete courses.'); return; }
    haptics.impactMedium();
    const confirmed = await confirm({
      title: 'Archive Course?',
      message: 'It will be moved to archive. You can restore it later.',
      confirmLabel: 'Archive',
      destructive: true,
    });
    if (!confirmed) return;
    try {
      const result = await softDelete('training_courses', courseId);
      if (!result.ok) {
        haptics.notificationError();
        Alert.alert('Error', result.error ?? 'Delete failed');
        return;
      }
      haptics.notificationSuccess();
      setDeleteModal(false);
      setTimeout(() => navigation.navigate('TrainingManage'), 500);
    } catch (err) {
      haptics.notificationError();
    }
  };

  const handleRestore = async () => {
    haptics.impactMedium();
    try {
      const result = await restoreRow('training_courses', courseId);
      if (!result.ok) {
        haptics.notificationError();
        Alert.alert('Error', result.error ?? 'Restore failed');
        return;
      }
      haptics.notificationSuccess();
      setArchivedModal(false);
      loadData();
    } catch (err) {
      haptics.notificationError();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={S.screen} edges={['top']}>
        <View style={S.loadingWrap}><ActivityIndicator size="large" color={C.accent} /></View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={S.screen} edges={['top']}>
        <View style={S.loadingWrap}>
          <Text style={S.emptyText}>Course not found.</Text>
          <Pressable onPress={() => navigation.goBack()} style={S.backBtn}><Text style={S.backText}>Go Back</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isDeleted = !!course.deleted_at;
  const completedCount = enrollments.filter((e) => e.status === 'completed').length;

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={S.header}>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.goBack(); }} style={({ pressed }) => [S.backBtn, pressed && S.pressed]}>
          <ChevronLeft size={20} color={C.ink} />
          <Text style={S.backText}>Back</Text>
        </Pressable>
        <Text style={S.headerTitle} numberOfLines={1}>Course Details</Text>
        <View style={{ width: 70 }} />
      </View>

      {isDeleted && (
        <View style={S.archivedBanner}>
          <Text style={S.archivedBannerText}>
            ⚠ This course is archived (deleted on {new Date(course.deleted_at).toLocaleDateString()})
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={S.thumbWrap}>
          {course.thumbnail_url ? (
            <Image source={{ uri: course.thumbnail_url }} style={S.thumb} />
          ) : (
            <View style={[S.thumb, S.thumbPlaceholder]}>
              <Tag size={40} color="#94A3B8" strokeWidth={1.5} />
            </View>
          )}
        </View>

        <Text style={S.courseTitle}>{course.title}</Text>
        {course.description && <Text style={S.courseDescription}>{course.description}</Text>}
        {(course.duration || course.category) && (
          <View style={S.metaRow}>
            {course.duration && (
              <View style={S.metaItem}>
                <Clock size={14} color={C.muted} strokeWidth={2} />
                <Text style={S.metaText}>{course.duration}</Text>
              </View>
            )}
            {course.category && (
              <View style={S.metaItem}>
                <Tag size={14} color={C.muted} strokeWidth={2} />
                <Text style={S.metaText}>{course.category}</Text>
              </View>
            )}
          </View>
        )}

        <View style={S.progressCard}>
          <View style={S.progressTop}>
            <Text style={S.progressTitle}>Progress</Text>
            <Text style={S.progressPct}>{Math.round((completedCount / Math.max(enrollments.length, 1)) * 100)}%</Text>
          </View>
          <View style={S.progressTrack}><View style={S.progressFill} style={{ width: `${(completedCount / Math.max(enrollments.length, 1)) * 100}%` }} /></View>
          <Text style={S.progressMeta}>{completedCount} of {enrollments.length} employees completed</Text>
        </View>
      </ScrollView>

      <View style={S.footer}>
        {isDeleted ? (
          <Pressable onPress={() => setArchivedModal(true)} style={({ pressed }) => [S.restoreBtn, pressed && S.pressed]}>
            <RefreshCw size={16} color={C.accent} strokeWidth={2} />
            <Text style={[S.restoreBtnText, { color: C.accent }]}>Restore</Text>
          </Pressable>
        ) : (
          <>
            {isAdmin && (
              <>
                <Pressable onPress={() => { haptics.impactMedium(); navigation.navigate('NewCourse', { mode: 'edit', courseId: course.id }); }} style={({ pressed }) => [S.editBtn, pressed && S.pressed]}>
                  <Pencil size={16} color="#0EA5E9" strokeWidth={2} />
                  <Text style={S.editBtnText}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => setDeleteModal(true)} style={({ pressed }) => [S.deleteBtn, pressed && S.pressed]}>
                  <Trash2 size={16} color={C.red} strokeWidth={2} />
                  <Text style={S.deleteBtnText}>Delete</Text>
                </Pressable>
              </>
            )}
          </>
        )}
      </View>

      <Modal transparent animationType="fade" visible={deleteModal} onRequestClose={() => setDeleteModal(false)}>
        <Pressable style={S.modalOverlay} onPress={() => setDeleteModal(false)}>
          <View style={S.modalCard}>
            <Text style={S.modalTitle}>Archive Course?</Text>
            <Text style={S.modalSubtitle}>It will be moved to archive. You can restore it later.</Text>
            <View style={S.modalBtns}>
              <Pressable onPress={() => setDeleteModal(false)} style={S.modalCancelBtn}>
                <Text style={S.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleDelete} style={S.modalDeleteBtn}>
                <Text style={S.modalDeleteText}>Archive</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal transparent animationType="fade" visible={archivedModal} onRequestClose={() => setArchivedModal(false)}>
        <Pressable style={S.modalOverlay} onPress={() => setArchivedModal(false)}>
          <View style={S.modalCard}>
            <Text style={S.modalTitle}>Restore Course?</Text>
            <Text style={S.modalSubtitle}>This will unarchive the course and make it visible again.</Text>
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
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 15, fontFamily: 'Chevalon-SemiBold', color: C.ink },
  headerTitle: { fontSize: 17, fontFamily: 'Chevalon-ExtraBold', color: C.ink, flex: 1, textAlign: 'center' },
  archivedBanner: { backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FCA5A5' },
  archivedBannerText: { fontSize: 13, fontFamily: 'Chevalon-SemiBold', color: '#DC2626', textAlign: 'center' },
  scrollContent: { paddingBottom: 110 },
  thumbWrap: { paddingHorizontal: 20 },
  thumb: { width: '100%', height: 180, borderRadius: 16, resizeMode: 'cover' },
  thumbPlaceholder: { backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  courseTitle: { fontSize: 22, fontFamily: 'Chevalon-ExtraBold', color: C.ink, marginTop: 16, paddingHorizontal: 20 },
  courseDescription: { fontSize: 15, color: C.muted, lineHeight: 22, marginTop: 8, paddingHorizontal: 20 },
  metaRow: { flexDirection: 'row', gap: 20, paddingHorizontal: 20, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, fontFamily: 'Chevalon-Medium', color: C.muted },
  progressCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginHorizontal: 20, marginTop: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressTitle: { fontSize: 15, fontFamily: 'Chevalon-Bold', color: C.ink },
  progressPct: { fontSize: 15, fontFamily: 'Chevalon-ExtraBold', color: C.accent, fontVariant: ['tabular-nums'] },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: C.accentSoft, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.accent, borderRadius: 4 },
  progressMeta: { fontSize: 13, color: C.muted, marginTop: 8 },
  footer: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFF' },
  editBtn: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#0EA5E9', backgroundColor: '#E0F2FE', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  editBtnText: { fontSize: 15, fontFamily: 'Chevalon-Bold', color: '#0EA5E9' },
  deleteBtn: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#DC2626', backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  deleteBtnText: { fontSize: 15, fontFamily: 'Chevalon-Bold', color: '#DC2626' },
  restoreBtn: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#0EA5E9', backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  restoreBtnText: { fontSize: 16, fontFamily: 'Chevalon-Bold', color: '#0EA5E9' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', gap: 8 },
  modalTitle: { fontSize: 18, fontFamily: 'Chevalon-ExtraBold', color: C.ink },
  modalSubtitle: { fontSize: 14, fontFamily: 'Chevalon-Regular', color: C.muted, marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: 16, fontFamily: 'Chevalon-SemiBold', color: C.muted },
  modalDeleteBtn: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  modalDeleteText: { fontSize: 16, fontFamily: 'Chevalon-Bold', color: '#FFF' },
  pressed: { opacity: 0.7 },
});
