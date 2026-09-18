import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ImageBackground,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHapticFeedback } from '@/lib/haptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const PAGES = [
  {
    id: 1,
    photo: require('../../assets/onboarding_1.jpg'),
    smallLabel: 'WELCOME TO',
    titleLine1: 'FAIAD BERGIN',
    titleLine2: 'OIL SERVICES',
    subtitle: 'Your complete HSE management platform.',
  },
  {
    id: 2,
    photo: require('../../assets/onboarding_2.jpg'),
    smallLabel: 'BUILT FOR THE FIELD',
    titleLine1: 'Safety.',
    titleLine2: 'Precision. Excellence.',
    subtitle: 'Track assets, actions, and inspections in real time.',
  },
  {
    id: 3,
    photo: require('../../assets/onboarding_3.jpg'),
    smallLabel: 'READY TO START',
    titleLine1: 'Welcome to',
    titleLine2: 'the dashboard.',
    subtitle: 'Tap below to enter the app.',
    isLast: true,
  },
] as const;

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const listRef = useRef<FlatList>(null);
  const haptics = useHapticFeedback();

  const goToNext = () => {
    haptics.impactMedium();
    if (currentPage < PAGES.length - 1) {
      const next = currentPage + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentPage(next);
    } else {
      haptics.notificationSuccess();
      onFinish?.();
    }
  };

  const onScrollEnd = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (idx !== currentPage) {
      setCurrentPage(idx);
      haptics.selection();
    }
  };

  const renderPage = ({ item }: { item: typeof PAGES[number] }) => (
    <ImageBackground
      source={item.photo}
      style={{ width: SCREEN_W, height: SCREEN_H }}
      resizeMode="cover"
    >
      <View style={S.scrim} />
      <View style={S.bottomContent}>
        <Text style={S.smallLabel}>{item.smallLabel}</Text>
        <Text style={S.titleLine1}>{item.titleLine1}</Text>
        <Text style={S.titleLine2}>{item.titleLine2}</Text>
        <Text style={S.subtitle}>{item.subtitle}</Text>
      </View>
    </ImageBackground>
  );

  const isLast = currentPage === PAGES.length - 1;

  return (
    <SafeAreaView style={S.screen} edges={['top', 'bottom']}>
      <FlatList
        ref={listRef}
        data={PAGES as any}
        renderItem={renderPage}
        keyExtractor={(item: any) => String(item.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        bounces={false}
      />

      <View style={S.footer} pointerEvents="box-none">
        <View style={S.dotsRow}>
          {PAGES.map((_, i) => (
            <View
              key={i}
              style={[S.dot, i === currentPage && S.dotActive]}
            />
          ))}
        </View>

        <Pressable
          onPress={goToNext}
          style={({ pressed }) => [
            isLast ? S.ctaBtn : S.arrowBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          {isLast ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
  screen: { flex: 1, backgroundColor: '#0F172A' },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 140,
    left: 32,
    right: 32,
  },
  smallLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  titleLine1: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  titleLine2: {
    color: '#0EA5E9',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 44,
    marginBottom: 14,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    maxWidth: '90%',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 44,
  },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: { width: 28, backgroundColor: '#FFFFFF' },
  arrowBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  ctaBtn: {
    paddingHorizontal: 28,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0EA5E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
