import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { C } from '@/theme/colors';
import { useHapticFeedback } from '@/lib/haptics';
import { Trash2, Pencil, ChevronLeft, Circle, CircleCheck, Clock, Tag } from '@/lib/icons';
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
}

export default function CourseDetailScreen({ navigation, route }: { navigation: NativeStackNavigationProp<RootStackParamList>; route: any }) {
  const haptics = useHapticFeedback();
  const { isAdmin } = useRole();
  const courseId: string = route.params?.courseId ?? '';
  const [course, setCourse] = useState<CourseData | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

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
    const ok = await requireAdmin();
    if (!ok) { Alert.alert('Access Denied', 'Admin access required to delete courses.'); return; }
    haptics.impactMedium();
    Alert.alert(
      'Delete Course',
      'Are you sure you want to delete this course? All enrollments will also be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('training_courses').delete().eq('id', courseId);
            haptics.notificationSuccess();
            navigation.navigate('TrainingManage');
          },
        },
      ]
    );
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
      <ScrollView contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={S.thumbWrap}>
          {course.thumbnail_url ? (
            <Image source={{ uri: course.thumbnail_url }} style={S.thumb} />
          ) : (
            <View style={[S.thumb, S.thumbPlaceholder]} />
          )}
        </View>

        <Text style={S.title}>{course.title}</Text>

        <View style={S.metaRow}>
          {course.category && (
            <View style={S.metaChip}>
              <Tag size={13} color={C.accent} strokeWidth={2} />
              <Text style={S.metaChipText}>{course.category}</Text>
            </View>
          )}
          {course.duration && (
            <View style={S.metaChip}>
              <Clock size={13} color={C.accent} strokeWidth={2} />
              <Text style={S.metaChipText}>{course.duration}</Text>
            </View>
          )}
        </View>

        {course.description && <Text style={S.description}>{course.description}</Text>}

        <View style={S.sectionHeader}>
          <Text style={S.sectionTitle}>Enrolled Employees</Text>
          <Text style={S.sectionMeta}>{completedCount}/{enrollments.length} completed</Text>
        </View>

        {enrollments.length === 0 ? (
          <View style={S.emptyEnroll}>
            <Text style={S.emptyText}>No employees enrolled yet.</Text>
            <Text style={S.emptySub}>Go to Manage and use Assign to add employees.</Text>
          </View>
        ) : (
          <View style={S.enrollList}>
            {enrollments.map((enr) => {
              const isCompleted = enr.status === 'completed';
              const initials = enr.employee.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('');
              return (
                <View key={enr.id} style={S.enrollRow}>
                  <View style={[S.avatar, isCompleted && S.avatarCompleted]}>
                    <Text style={S.avatarText}>{initials}</Text>
                  </View>
                  <View style={S.enrollInfo}>
                    <Text style={S.enrollName}>{enr.employee.full_name}</Text>
                    <Text style={S.enrollMeta}>{enr.employee.job_title ?? '—'}{enr.employee.department ? ` · ${enr.employee.department}` : ''}</Text>
                  </View>
                  <Pressable
                    onPress={() => updating !== enr.id && toggleComplete(enr.id, enr.status)}
                    disabled={updating === enr.id}
                    style={({ pressed }) => [S.toggleBtn, pressed && S.pressed]}
                  >
                    {updating === enr.id ? (
                      <ActivityIndicator size="small" color={C.accent} />
                    ) : isCompleted ? (
                      <CircleCheck size={26} color={C.green} strokeWidth={2} />
                    ) : (
                      <Circle size={26} color={C.borderStrong} strokeWidth={2} />
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        <View style={S.actionBtns}>
          <Pressable
            onPress={() => { haptics.impactMedium(); navigation.navigate('NewCourse'); }}
            style={({ pressed }) => [S.editBtn, pressed && S.pressed]}
          >
            <Pencil size={16} color={C.accent} strokeWidth={2} />
            <Text style={S.editBtnText}>Edit Course</Text>
          </Pressable>
          {isAdmin && (
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [S.deleteBtn, pressed && S.pressed]}
            >
              <Trash2 size={16} color={C.red} strokeWidth={2} />
              <Text style={S.deleteBtnText}>Delete Course</Text>
            </Pressable>
          )}
        </View>
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
  scrollContent: { padding: 20, paddingBottom: 40 },
  thumbWrap: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  thumb: { width: '100%', height: 180, resizeMode: 'cover' },
  thumbPlaceholder: { backgroundColor: C.accentSoft },
  title: { fontSize: 24, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.accentSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  metaChipText: { fontSize: 13, fontWeight: '600', color: C.accent },
  description: { fontSize: 15, fontWeight: '400', color: C.muted, lineHeight: 22, marginTop: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: C.ink },
  sectionMeta: { fontSize: 13, fontWeight: '600', color: C.muted, fontVariant: ['tabular-nums'] },
  enrollList: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  enrollRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  avatarCompleted: { backgroundColor: C.greenBg },
  avatarText: { fontSize: 14, fontWeight: '800', color: C.accent },
  enrollInfo: { flex: 1, minWidth: 0 },
  enrollName: { fontSize: 15, fontWeight: '700', color: C.ink },
  enrollMeta: { fontSize: 12, fontWeight: '500', color: C.muted, marginTop: 2 },
  toggleBtn: { padding: 4 },
  emptyEnroll: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: C.muted },
  emptySub: { fontSize: 13, fontWeight: '400', color: C.faint },
  actionBtns: { flexDirection: 'row', gap: 12, marginTop: 28 },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.accent, paddingVertical: 14, borderRadius: 12 },
  editBtnText: { fontSize: 14, fontWeight: '700', color: C.accent },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.red, paddingVertical: 14, borderRadius: 12 },
  deleteBtnText: { fontSize: 14, fontWeight: '700', color: C.red },
  pressed: { opacity: 0.7 },
});
