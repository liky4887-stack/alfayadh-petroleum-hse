import { useEffect } from 'react';
import { Image, StyleSheet, View, Text, Dimensions, StatusBar } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const LOGO_SIZE = SCREEN_W * 0.55;

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => onFinish?.(), 2200);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={S.screen}>
      <StatusBar barStyle="light-content" />
      <Image
        source={require('../../assets/splash_bbb.png')}
        style={S.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const S = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
