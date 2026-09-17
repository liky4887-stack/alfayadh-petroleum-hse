import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, TextInput as RNTextInput, ActivityIndicator, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { C } from '@/theme/colors';
import { useHapticFeedback } from '@/lib/haptics';
import { Plus, ChevronRight, Search, Users, BookOpen, TrendingUp } from '@/lib/icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

interface Course {
  id: string;
  title: string;
  description: string | null;
  duration: string | null;
  category: string | null;
  thumbnail_url: string | null;
  created_at: string;
  enrollment_count: number;
}

interface Employee {
  id: string;
  full_name: string;
  email: string | null;
  job_title: string | null;
  department: string | null;
  selected: boolean;
}

export default function TrainingManageScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const haptics = useHapticFeedback();
  const [courses, setCourses] = useState<Course[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCourses: 0, totalEnrollments: 0, completionRate: 0 });
  const [assignMode, setAssignMode] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [coursePickerVisible, setCoursePickerVisible] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: coursesData }, { data: enrollmentsData }, { data: empData }] = await Promise.all([
      supabase.from('training_courses').select('*').order('created_at', { ascending: false }),
      supabase.from('enrollments').select('*'),
      supabase.from('employees').select('*').order('full_name', { ascending: true }),
    ]);

    const courseList: Course[] = (coursesData ?? []).map((c: any) => ({
      id: c.id, title: c.title, description: c.description, duration: c.duration,
      category: c.category, thumbnail_url: c.thumbnail_url, created_at: c.created_at,
      enrollment_count: (enrollmentsData ?? []).filter((e: any) => e.course_id === c.id).length,
    }));
    setCourses(courseList);

    const empList: Employee[] = (empData ?? []).map((e: any) => ({
      id: e.id, full_name: e.full_name, email: e.email, job_title: e.job_title,
      department: e.department, selected: false,
    }));
    setEmployees(empList);

    const totalEnrollments = enrollmentsData?.length ?? 0;
    const completed = enrollmentsData?.filter((e: any) => e.status === 'completed').length ?? 0;
    setStats({ totalCourses: courseList.length, totalEnrollments,
      completionRate: totalEnrollments > 0 ? Math.round((completed / totalEnrollments) * 100) : 0 });
    setLoading(false);
  }, []);

  useEffect(() => { navigation.addListener('focus', loadData); return () => navigation.removeListener('focus', loadData); }, [navigation, loadData]);

  const filteredEmployees = employees.filter((e) =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.job_title ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (e.department ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleEmployee = (id: string) => { haptics.selection(); setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e))); };

  const handleAssign = async (courseId: string) => {
    haptics.impactMedium();
    const selectedIds = employees.filter((e) => e.selected).map((e) => e.id);
    if (selectedIds.length === 0) return;
    setAssigning(true);
    const rows = selectedIds.map((empId) => ({ course_id: courseId, employee_id: empId, status: 'assigned' }));
    await supabase.from('enrollments').insert(rows);
    setAssigning(false); setCoursePickerVisible(false); setAssignMode(false);
    setEmployees((prev) => prev.map((e) => ({ ...e, selected: false })));
    haptics.notificationSuccess(); loadData();
  };

  const renderCourse: ListRenderItem<Course> = ({ item }) => (
    <Pressable onPress={() => { haptics.impactMedium(); navigation.navigate('CourseDetail', { courseId: item.id }); }} style={({ pressed }) => [S.courseRow, pressed && S.pressed]}>
      <View style={S.courseThumb}>{item.thumbnail_url ? <View style={S.thumbPlaceholder} /> : <BookOpen size={20} color={C.accent} strokeWidth={1.8} />}</View>
      <View style={S.courseInfo}>
        <Text style={S.courseTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={S.courseMeta}>{item.enrollment_count} enrolled{item.category ? ` · ${item.category}` : ''}</Text>
      </View>
      <ChevronRight size={18} color={C.faint} strokeWidth={2} />
    </Pressable>
  );

  if (loading) return (<SafeAreaView style={S.screen} edges={['top']}><View style={S.loadingWrap}><ActivityIndicator size="large" color={C.accent} /></View></SafeAreaView>);

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={S.header}>
        <Text style={S.headerTitle}>Manage Training</Text>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.navigate('NewCourse'); }} style={({ pressed }) => [S.addBtn, pressed && S.pressed]}>
          <Plus size={18} color="#FFF" strokeWidth={2.5} /><Text style={S.addBtnText}>Add Course</Text>
        </Pressable>
      </View>
      <View style={S.statsRow}>
        <StatCard icon={<BookOpen size={16} color={C.accent} />} value={stats.totalCourses} label="Courses" />
        <StatCard icon={<Users size={16} color={C.accent} />} value={stats.totalEnrollments} label="Enrollments" />
        <StatCard icon={<TrendingUp size={16} color={C.accent} />} value={`${stats.completionRate}%`} label="Completion" />
      </View>
      {!assignMode ? (
        <FlatList data={courses} keyExtractor={(item) => item.id} renderItem={renderCourse} contentContainerStyle={S.listContent}
          ListHeaderComponent={<View style={S.sectionHeader}><Text style={S.sectionTitle}>Courses</Text>
            <Pressable onPress={() => { haptics.impactMedium(); setAssignMode(true); }} style={({ pressed }) => [S.assignToggle, pressed && S.pressed]}>
              <Users size={15} color={C.accent} strokeWidth={2} /><Text style={S.assignToggleText}>Assign</Text></Pressable></View>}
          ListEmptyComponent={<View style={S.emptyState}><BookOpen size={40} color={C.faint} strokeWidth={1.5} />
            <Text style={S.emptyTitle}>No courses yet</Text><Text style={S.emptyText}>Tap "Add Course" to create your first training course.</Text></View>}
        />
      ) : (
        <View style={S.assignSection}>
          <View style={S.assignHeader}>
            <Pressable onPress={() => { haptics.impactMedium(); setAssignMode(false); }} style={({ pressed }) => [S.backBtn, pressed && S.pressed]}><Text style={S.backText}>Back</Text></Pressable>
            <Text style={S.assignTitle}>Assign Employees</Text><View style={{ width: 50 }} />
          </View>
          <View style={S.searchWrap}><Search size={18} color={C.faint} strokeWidth={2} />
            <RNTextInput value={search} onChangeText={setSearch} placeholder="Search employees..." placeholderTextColor={C.faint} style={S.searchInput} /></View>
          <FlatList data={filteredEmployees} keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable onPress={() => toggleEmployee(item.id)} style={({ pressed }) => [S.empRow, pressed && S.pressed]}>
                <View style={[S.checkbox, item.selected && S.checkboxSelected]}>{item.selected && <Text style={S.checkmark}>✓</Text>}</View>
                <View style={S.empInfo}><Text style={S.empName}>{item.full_name}</Text>
                  <Text style={S.empMeta}>{item.job_title ?? '—'}{item.department ? ` · ${item.department}` : ''}</Text></View>
              </Pressable>)}
            contentContainerStyle={S.empList}
            ListEmptyComponent={<View style={S.emptyState}><Users size={36} color={C.faint} strokeWidth={1.5} /><Text style={S.emptyText}>No employees found. Add employees in the database first.</Text></View>}
          />
          {employees.filter((e) => e.selected).length > 0 && (
            <Pressable onPress={() => { haptics.impactMedium(); setCoursePickerVisible(true); }} style={({ pressed }) => [S.assignBtn, pressed && S.pressed]}>
              <Text style={S.assignBtnText}>Assign {employees.filter((e) => e.selected).length} to course</Text>
            </Pressable>)}
          {coursePickerVisible && (
            <View style={S.pickerOverlay}><View style={S.pickerCard}><Text style={S.pickerTitle}>Select Course</Text>
              <FlatList data={courses} keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable onPress={() => assigning ? null : handleAssign(item.id)} style={({ pressed }) => [S.pickerRow, pressed && S.pressed]} disabled={assigning}>
                    <Text style={S.pickerRowText}>{item.title}</Text><ChevronRight size={16} color={C.faint} />
                  </Pressable>)} style={{ maxHeight: 300 }} />
              <Pressable onPress={() => setCoursePickerVisible(false)} style={({ pressed }) => [S.pickerCancel, pressed && S.pressed]}><Text style={S.pickerCancelText}>Cancel</Text></Pressable>
            </View></View>)}
        </View>)}
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (<View style={S.statCard}><View style={S.statIconWrap}>{icon}</View><Text style={S.statValue}>{value}</Text><Text style={S.statLabel}>{label}</Text></View>);
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 16 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center', gap: 6 },
  statIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: C.ink, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11, fontWeight: '600', color: C.muted },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: C.ink, letterSpacing: -0.2 },
  assignToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.accentSoft, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  assignToggleText: { fontSize: 13, fontWeight: '700', color: C.accent },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  courseThumb: { width: 48, height: 48, borderRadius: 10, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbPlaceholder: { width: '100%', height: '100%', backgroundColor: C.accentSoft },
  courseInfo: { flex: 1, minWidth: 0 },
  courseTitle: { fontSize: 15, fontWeight: '700', color: C.ink, letterSpacing: -0.1 },
  courseMeta: { fontSize: 12, fontWeight: '500', color: C.muted, marginTop: 3 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  emptyText: { fontSize: 14, fontWeight: '400', color: C.muted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  assignSection: { flex: 1 },
  assignHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  backText: { fontSize: 14, fontWeight: '600', color: C.accent },
  assignTitle: { fontSize: 17, fontWeight: '800', color: C.ink },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 20, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, fontSize: 15, color: C.ink, paddingVertical: 4 },
  empList: { paddingHorizontal: 20, paddingBottom: 120 },
  empRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: C.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: C.accent, borderColor: C.accent },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  empInfo: { flex: 1 },
  empName: { fontSize: 15, fontWeight: '700', color: C.ink },
  empMeta: { fontSize: 12, fontWeight: '500', color: C.muted, marginTop: 2 },
  assignBtn: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: C.accent, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  assignBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 20 },
  pickerCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, maxHeight: 400 },
  pickerTitle: { fontSize: 18, fontWeight: '800', color: C.ink, marginBottom: 14 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerRowText: { fontSize: 15, fontWeight: '600', color: C.ink },
  pickerCancel: { marginTop: 14, paddingVertical: 12, alignItems: 'center' },
  pickerCancelText: { fontSize: 15, fontWeight: '600', color: C.muted },
  pressed: { opacity: 0.7 },
});
