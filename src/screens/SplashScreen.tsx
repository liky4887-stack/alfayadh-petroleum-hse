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
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useHapticFeedback } from '@/lib/haptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const FONT_REGULAR = Platform.select({ ios: 'System', android: 'sans-serif' });
const FONT_MEDIUM = Platform.select({ ios: 'System', android: 'sans-serif-medium' });
const FONT_BOLD = Platform.select({ ios: 'System', android: 'sans-serif-medium' });

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

function GlassBox({
  children,
  intensity = 80,
}: {
  children: React.ReactNode;
  intensity?: number;
}) {
  return (
    <View style={S.glassBox}>
      <BlurView
        intensity={intensity}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      />
      <View style={S.glassOverlay} />
      <View style={S.glassInner}>{children}</View>
    </View>
  );
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

      <View style={S.bottomStack}>
        <GlassBox intensity={60}>
          <Text style={S.smallLabel}>{item.smallLabel}</Text>
        </GlassBox>

        <GlassBox intensity={90}>
          <Text style={S.titleLine1}>{item.titleLine1}</Text>
        </GlassBox>

        <GlassBox intensity={90}>
          <Text style={S.titleLine2}>{item.titleLine2}</Text>
        </GlassBox>

        <GlassBox intensity={70}>
          <Text style={S.subtitle}>{item.subtitle}</Text>
        </GlassBox>
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
            <View key={i} style={[S.dot, i === currentPage && S.dotActive]} />
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
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  bottomStack: {
    position: 'absolute',
    bottom: 130,
    left: 20,
    right: 20,
    gap: 10,
    alignItems: 'flex-start',
  },

  // Dense glass box — consistent dark frosted look
  glassBox: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(15,23,42,0.35)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  // Single flat overlay — no bright spots
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.4)',
  },

  glassInner: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  smallLabel: {
    fontFamily: FONT_BOLD,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  titleLine1: {
    fontFamily: FONT_MEDIUM,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 0,
    includeFontPadding: false,
  },
  titleLine2: {
    fontFamily: FONT_BOLD,
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 36,
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: FONT_REGULAR,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    includeFontPadding: false,
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
    backgroundColor: 'rgba(15,23,42,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  ctaBtn: {
    paddingHorizontal: 28,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0EA5E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaText: {
    fontFamily: FONT_BOLD,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    includeFontPadding: false,
  },
});
