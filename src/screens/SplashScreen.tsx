import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHapticFeedback } from '@/lib/haptics';

const { width: SCREEN_W } = Dimensions.get('window');

const PAGES = [
  {
    id: 1,
    bg: '#0EA5E9',
    accent: '#FFFFFF',
    titleLine1: 'Welcome to',
    titleLine2: 'FAIAD BERGIN',
    subtitle: 'Your complete HSE management platform for the field.',
    showLogo: true,
  },
  {
    id: 2,
    bg: '#0F172A',
    accent: '#0EA5E9',
    titleLine1: 'Safety.',
    titleLine2: 'Precision. Excellence.',
    subtitle: 'Track assets, actions, and inspections in real time.',
    showLogo: false,
  },
  {
    id: 3,
    bg: '#16A34A',
    accent: '#FFFFFF',
    titleLine1: 'Ready to',
    titleLine2: 'get started?',
    subtitle: 'Tap below to enter the dashboard.',
    showLogo: false,
    isLast: true,
  },
] as const;

type OnboardingPage = (typeof PAGES)[number];

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const listRef = useRef<FlatList<OnboardingPage>>(null);
  const haptics = useHapticFeedback();

  const goToNext = () => {
    haptics.impactMedium();
    if (currentPage < PAGES.length - 1) {
      const nextPage = currentPage + 1;
      listRef.current?.scrollToIndex({ index: nextPage, animated: true });
      setCurrentPage(nextPage);
      return;
    }

    haptics.notificationSuccess();
    onFinish?.();
  };

  const handleScrollEnd = (event: any) => {
    const pageIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_W);
    if (pageIndex !== currentPage && pageIndex >= 0 && pageIndex < PAGES.length) {
      setCurrentPage(pageIndex);
      haptics.selection();
    }
  };

  const renderPage = ({ item }: { item: OnboardingPage }) => (
    <View style={[S.page, { backgroundColor: item.bg, width: SCREEN_W }]}>
      <View style={S.pageContent}>
        {item.showLogo && <Text style={S.logoMark}>FB</Text>}
        <Text style={[S.titleLine1, { color: item.id === 2 ? '#94A3B8' : '#FFFFFFDD' }]}>
          {item.titleLine1}
        </Text>
        <Text style={[S.titleLine2, { color: item.accent }]}>
          {item.titleLine2}
        </Text>
        <Text style={[S.subtitle, { color: item.id === 2 ? '#94A3B8' : '#FFFFFFCC' }]}>
          {item.subtitle}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={S.screen} edges={['top', 'bottom']}>
      <FlatList
        ref={listRef}
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={(item) => String(item.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        bounces={false}
        getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
      />

      <View style={S.footer} pointerEvents="box-none">
        <View style={S.dotsRow}>
          {PAGES.map((page, index) => (
            <View
              key={page.id}
              style={[
                S.dot,
                index === currentPage && S.dotActive,
                { backgroundColor: index === currentPage ? '#FFFFFF' : '#FFFFFF66' },
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={goToNext}
          style={({ pressed }) => [
            currentPage === PAGES.length - 1 ? S.ctaBtn : S.arrowBtn,
            pressed && S.pressed,
          ]}
        >
          {currentPage === PAGES.length - 1 ? (
            <View style={S.ctaContent}>
              <Text style={S.ctaText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          ) : (
            <Ionicons name="arrow-forward" size={26} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0EA5E9' },
  page: { height: '100%', justifyContent: 'flex-end', paddingHorizontal: 32, paddingBottom: 140 },
  pageContent: { marginBottom: 40 },
  logoMark: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2, marginBottom: 32 },
  titleLine1: { fontSize: 32, fontWeight: '500', letterSpacing: -0.5, marginBottom: 4 },
  titleLine2: { fontSize: 42, fontWeight: '800', letterSpacing: -1, lineHeight: 46, marginBottom: 16 },
  subtitle: { fontSize: 15, fontWeight: '400', lineHeight: 22, maxWidth: '90%' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 40, paddingTop: 20 },
  dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 28 },
  arrowBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  ctaBtn: { paddingHorizontal: 24, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  ctaContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  pressed: { opacity: 0.85 },
});
