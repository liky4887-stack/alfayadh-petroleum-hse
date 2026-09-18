import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SplashScreenProps {
  onFinish?: () => void;
}

const { height: SCREEN_H } = Dimensions.get('window');

const C = {
  bg: '#0A2540',
  text: '#FFFFFF',
  accent: '#0EA5E9',
};

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  // Text starts at center (0) and rises up to the top (-offset)
  const riseUp = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const spinnerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anims: Animated.CompositeAnimation[] = [];

    // Step 1: fade in + subtle scale at center
    const fadeIn = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    // Step 2: rise up from center to top
    const rise = Animated.timing(riseUp, {
      toValue: 1,
      duration: 900,
      delay: 400, // wait for fade-in to complete
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });

    // Step 3: subtitle appears after text has risen
    const subtitle = Animated.timing(subtitleOpacity, {
      toValue: 1,
      duration: 400,
      delay: 1100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });

    // Step 4: spinner fades in
    const spinner = Animated.timing(spinnerOpacity, {
      toValue: 1,
      duration: 400,
      delay: 1300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });

    fadeIn.start();
    rise.start();
    subtitle.start();
    spinner.start();
    anims.push(fadeIn, rise, subtitle, spinner);

    const timer = setTimeout(() => onFinish?.(), 2400);
    return () => {
      clearTimeout(timer);
      anims.forEach((a) => a.stop());
    };
  }, [onFinish]);

  // Translate Y: 0 (center) → -25% of screen height (top area)
  const translateY = riseUp.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_H * 0.28],
  });

  return (
    <View style={S.screen}>
      <SafeAreaView style={S.inner} edges={['top', 'bottom']}>
        {/* Text block — starts at center, rises to top */}
        <Animated.View
          style={[
            S.textBlock,
            {
              opacity,
              transform: [
                { translateY },
                { scale },
              ],
            },
          ]}
        >
          <Text style={S.brandName}>ALFAYADH</Text>
          <Animated.Text style={[S.brandSubline, { opacity: subtitleOpacity }]}>
            PETROLEUM · HSE
          </Animated.Text>
        </Animated.View>

        {/* Bottom spinner */}
        <Animated.View style={[S.bottom, { opacity: spinnerOpacity }]}>
          <ActivityIndicator size="small" color={C.accent} />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Absolute positioning so translateY works cleanly
  textBlock: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontFamily: 'Chevalon-ExtraBold',
    fontSize: 44,
    letterSpacing: 4,
    color: C.text,
    lineHeight: 52,
    textAlign: 'center',
    includeFontPadding: false,
    marginEnd: -4,
  },
  brandSubline: {
    fontFamily: 'Chevalon-Medium',
    fontSize: 17,
    letterSpacing: 3,
    color: C.accent,
    marginTop: 8,
    textAlign: 'center',
    includeFontPadding: false,
    marginEnd: -3,
  },
  bottom: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
