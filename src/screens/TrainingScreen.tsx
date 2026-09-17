import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GraduationCap, ChevronRight, MoreHorizontal } from '@/lib/icons';
import { C, IMG } from '@/theme/colors';
import { BrandHeader, IconButton } from '@/components/Shared';
import { useHapticFeedback } from '@/lib/haptics';
import { Image } from 'react-native';

export default function TrainingScreen({ navigation }: { navigation: any }) {
  const [quiz, setQuiz] = useState(false);
  const haptics = useHapticFeedback();

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <BrandHeader title="Training" />
      <View style={S.trainingTabs}>
        <Pressable onPress={() => undefined} style={S.trainingTabButton}><Text style={S.activeTab}>Learn</Text></Pressable>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.navigate('TrainingManage'); }} style={S.trainingTabButton}><Text style={S.inactiveTab}>Manage</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={S.body}>
          <Text style={S.subHeading}>Continue learning</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.courseStrip}>
            <CourseCard image={IMG.worker} title="Fuel line maintenance" onPress={() => { haptics.impactMedium(); setQuiz(true); }} />
            <CourseCard image={IMG.driver} title="Truck driver safety" onPress={() => { haptics.impactMedium(); setQuiz(true); }} />
            <CourseCard image={IMG.barrels} title="Hazardous materials" onPress={() => { haptics.impactMedium(); setQuiz(true); }} />
          </ScrollView>
          <Text style={[S.subHeading, { marginTop: 32 }]}>Your progress</Text>
          <View style={S.progressCard}>
            <View style={S.progressTop}>
              <GraduationCap size={20} color={C.accent} strokeWidth={1.8} />
              <Text style={S.progressTitle} numberOfLines={1}>Field safety essentials</Text>
              <Text style={S.progressPct}>68%</Text>
            </View>
            <View style={S.progressTrack}><View style={S.progressFill} /></View>
            <Text style={S.progressMeta}>8 of 12 lessons completed</Text>
          </View>
        </View>
      </ScrollView>
      {quiz && <QuizOverlay onClose={() => setQuiz(false)} />}
    </SafeAreaView>
  );
}

function CourseCard({ image, title, onPress }: { image: string; title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.courseCard, pressed && S.cardPressed]}>
      <Image source={{ uri: image }} style={S.courseImage} />
      <Text style={S.courseTitle}>{title}</Text>
    </Pressable>
  );
}

function QuizOverlay({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState('Parking lots and bridges');
  const options = ['Parking lots and bridges', 'Highways and streets', 'Rural roads', 'High density traffic'];
  return (
    <View style={S.quizOverlay}>
      <View style={S.quizTop}>
        <Text style={S.quizProgress}>6 / 12</Text>
        <IconButton icon={<MoreHorizontal size={22} color={C.surface} strokeWidth={1.8} />} onPress={onClose} />
      </View>
      <Text style={S.quizQuestion}>What are the common locations of crashes?</Text>
      <Text style={S.quizSubtitle}>Select all that apply</Text>
      <View style={S.quizOptions}>
        {options.map((option) => (
          <Pressable key={option} onPress={() => setSelected(option)} style={({ pressed }) => [S.quizOption, selected === option && S.quizSelected, pressed && S.cardPressed]}>
            <Text style={[S.quizOptionText, selected === option && S.quizSelectedText]}>{option}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => { Alert.alert('Submitted', 'Answer recorded.'); onClose(); }} style={({ pressed }) => [S.quizContinue, pressed && S.cardPressed]}>
        <Text style={S.quizContinueText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  trainingTabs: { height: 52, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center' },
  trainingTabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 52 },
  activeTab: { fontSize: 15, fontWeight: '700', color: C.ink, paddingVertical: 16, borderBottomWidth: 2.5, borderBottomColor: C.accent },
  inactiveTab: { fontSize: 15, fontWeight: '600', color: C.muted, paddingVertical: 16 },
  scrollContent: { paddingBottom: 110 },
  body: { paddingHorizontal: 20, paddingTop: 8 },
  subHeading: { fontSize: 20, fontWeight: '800', color: C.ink, letterSpacing: -0.3, marginBottom: 14 },
  courseStrip: { gap: 12 },
  courseCard: { width: 168, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  courseImage: { width: '100%', height: 100 },
  courseTitle: { fontSize: 14, fontWeight: '700', color: C.ink, padding: 13, letterSpacing: -0.1, minHeight: 58 },
  progressCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.border },
  progressTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.ink, minWidth: 0 },
  progressPct: { fontSize: 15, fontWeight: '800', color: C.accent, fontVariant: ['tabular-nums'] },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: C.accentSoft, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: '100%', width: '68%', backgroundColor: C.accent, borderRadius: 4 },
  progressMeta: { fontSize: 13, fontWeight: '400', color: C.muted, marginTop: 10 },
  quizOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.accent, paddingHorizontal: 24, paddingTop: 60 },
  quizTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quizProgress: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  quizQuestion: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginTop: 80, lineHeight: 36, letterSpacing: -0.5 },
  quizSubtitle: { fontSize: 17, fontWeight: '500', color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 12 },
  quizOptions: { gap: 14, marginTop: 50 },
  quizOption: { minHeight: 56, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  quizSelected: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  quizOptionText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  quizSelectedText: { color: C.ink },
  quizContinue: { position: 'absolute', left: 24, right: 24, bottom: 50, minHeight: 56, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  quizContinueText: { fontSize: 16, fontWeight: '800', color: C.accent },
  cardPressed: { opacity: 0.6 },
});
