import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ImageBackground, Animated, Easing, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHapticFeedback } from '@/lib/haptics';

const { width: SCREEN_W } = Dimensions.get('window');

const HERO_IMAGE = 'https://images.pexels.com/photos/18188961/pexels-photo-18188961.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const haptics = useHapticFeedback();
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(1.04)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandSlide = useRef(new Animated.Value(24)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(24)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(18)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const arrowScale = useRef(new Animated.Value(0.84)).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    const fadeAndSlide = (
      opacity: Animated.Value,
      slide: Animated.Value,
      delay: number,
      duration = 520,
    ) => {
      const animation = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: 0,
          duration,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
      animation.start();
      animations.push(animation);
    };

    const heroAnimation = Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(heroScale, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    heroAnimation.start();
    animations.push(heroAnimation);

    fadeAndSlide(brandOpacity, brandSlide, 250, 460);
    fadeAndSlide(titleOpacity, titleSlide, 410, 520);
    fadeAndSlide(subtitleOpacity, subtitleSlide, 620, 480);

    const footerAnimation = Animated.parallel([
      Animated.timing(footerOpacity, { toValue: 1, duration: 500, delay: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(arrowScale, { toValue: 1, delay: 980, friction: 7, tension: 75, useNativeDriver: true }),
    ]);
    footerAnimation.start();
    animations.push(footerAnimation);

    return () => animations.forEach((animation) => animation.stop());
  }, [arrowScale, brandOpacity, brandSlide, footerOpacity, heroOpacity, heroScale, subtitleOpacity, subtitleSlide, titleOpacity, titleSlide]);

  const finish = () => {
    haptics.impactMedium();
    haptics.notificationSuccess();
    onFinish?.();
  };

  return (
    <SafeAreaView style={S.screen} edges={['top', 'bottom']}>
      <ImageBackground source={{ uri: HERO_IMAGE }} style={S.hero} resizeMode="cover">
        <View style={S.tint} />
        <View style={S.topBar}>
          <Animated.View style={[S.brandMark, { opacity: brandOpacity, transform: [{ translateY: brandSlide }] }]}>
            <Text style={S.brandInitials}>FB</Text>
            <View style={S.brandDivider} />
            <Text style={S.brandMini}>HSE MANAGEMENT</Text>
          </Animated.View>
          <Ionicons name="shield-checkmark-outline" size={22} color="#FFFFFFCC" />
        </View>

        <View style={S.content}>
          <Animated.View style={[S.eyebrowPanel, { opacity: brandOpacity, transform: [{ translateY: brandSlide }] }]}>
            <Text style={S.eyebrow}>WELCOME TO</Text>
          </Animated.View>

          <Animated.View style={[S.titlePanel, { opacity: titleOpacity, transform: [{ translateY: titleSlide }] }]}>
            <Text style={S.title}>FAIAD BERGIN</Text>
          </Animated.View>

          <Animated.View style={[S.titlePanel, S.titlePanelWide, { opacity: titleOpacity, transform: [{ translateY: titleSlide }] }]}>
            <Text style={S.title}>OIL SERVICES</Text>
          </Animated.View>

          <Animated.View style={[S.subtitlePanel, { opacity: subtitleOpacity, transform: [{ translateY: subtitleSlide }] }]}>
            <Text style={S.subtitle}>Your complete HSE management platform for the field.</Text>
          </Animated.View>
        </View>

        <Animated.View style={[S.footer, { opacity: footerOpacity }]}>
          <View style={S.dotsRow}>
            <View style={[S.dot, S.dotActive]} />
            <View style={S.dot} />
            <View style={S.dot} />
          </View>

          <Animated.View style={{ transform: [{ scale: arrowScale }] }}>
            <Pressable onPress={finish} style={({ pressed }) => [S.arrowButton, pressed && S.pressed]}>
              <Ionicons name="arrow-forward" size={28} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        </Animated.View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#07111F' },
  hero: { flex: 1, width: SCREEN_W, justifyContent: 'space-between' },
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2, 8, 18, 0.52)' },
  topBar: { paddingHorizontal: 24, paddingTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandMark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandInitials: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2 },
  brandDivider: { width: 1, height: 18, backgroundColor: '#FFFFFF66' },
  brandMini: { fontSize: 9, fontWeight: '700', color: '#FFFFFFBB', letterSpacing: 2 },
  content: { paddingHorizontal: 24, paddingBottom: 126, gap: 10 },
  eyebrowPanel: { alignSelf: 'flex-start', backgroundColor: '#101B2CCC', borderWidth: 1, borderColor: '#FFFFFF38', borderRadius: 18, paddingHorizontal: 18, paddingVertical: 10 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', letterSpacing: 3.5 },
  titlePanel: { alignSelf: 'flex-start', backgroundColor: '#101B2CE6', borderWidth: 1, borderColor: '#FFFFFF40', borderRadius: 18, paddingHorizontal: 18, paddingVertical: 12 },
  titlePanelWide: { paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 28, lineHeight: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.6 },
  subtitlePanel: { alignSelf: 'flex-start', maxWidth: '92%', backgroundColor: '#101B2CCC', borderWidth: 1, borderColor: '#FFFFFF32', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginTop: 2 },
  subtitle: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: '#FFFFFFE6' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingBottom: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#FFFFFF88' },
  dotActive: { width: 31, backgroundColor: '#FFFFFF' },
  arrowButton: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172ACC', borderWidth: 1, borderColor: '#FFFFFFAA' },
  pressed: { opacity: 0.78 },
});
