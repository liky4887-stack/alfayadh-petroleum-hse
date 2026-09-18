import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoScale = useRef(new Animated.Value(0.78)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkSlide = useRef(new Animated.Value(10)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anims: Animated.CompositeAnimation[] = [];

    const launch = (
      value: Animated.Value,
      toValue: number,
      duration: number,
      delay: number,
      easing?: (v: number) => number,
    ) => {
      const a = Animated.timing(value, {
        toValue,
        duration,
        delay,
        easing: easing ?? Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      a.start();
      anims.push(a);
    };

    launch(logoOpacity, 1, 480, 0);
    launch(logoScale, 1.0, 600, 0, Easing.out(Easing.back(1.4)));
    launch(wordmarkOpacity, 1, 400, 360);
    launch(wordmarkSlide, 0, 400, 360);
    launch(footerOpacity, 1, 400, 800);

    const timer = setTimeout(() => onFinish?.(), 1800);

    return () => {
      clearTimeout(timer);
      anims.forEach((a) => a.stop());
    };
  }, [onFinish]);

  return (
    <View style={S.screen}>
      <SafeAreaView style={S.inner} edges={['top', 'bottom']}>
        <View style={S.center}>
          <Animated.View style={[S.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
            <View style={S.logoOuter}>
              <View style={S.logoInner}>
                <Text style={S.logoInitials}>FB</Text>
                <Text style={S.logoSub}>OIL</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: wordmarkOpacity, transform: [{ translateY: wordmarkSlide }] }}>
            <Text style={S.wordmark}>FAIAD BERGIN</Text>
            <Text style={S.wordmarkSub}>HSE MANAGEMENT</Text>
          </Animated.View>
        </View>

        <Animated.View style={[S.footer, { opacity: footerOpacity }]}>
          <Text style={S.footerFrom}>from</Text>
          <Text style={S.footerBrand}>Faiad Bergin Oil Services</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const BRAND = '#0A2540';
const ACCENT = '#0EA5E9';

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND },
  inner: { flex: 1, justifyContent: 'space-between', alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  logoWrap: { alignItems: 'center', justifyContent: 'center' },
  logoOuter: {
    width: 108,
    height: 108,
    borderRadius: 28,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  logoInner: { alignItems: 'center', justifyContent: 'center' },
  logoInitials: { fontSize: 38, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
  logoSub: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 3, marginTop: -4 },
  wordmark: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: 3, textAlign: 'center' },
  wordmarkSub: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: 3, textAlign: 'center', marginTop: 5 },
  footer: { paddingBottom: 36, alignItems: 'center', gap: 4 },
  footerFrom: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '400' },
  footerBrand: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '600', letterSpacing: 0.3 },
});
