import { View, Text, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserRound, ImageIcon, Menu, ChevronRight, Globe, LogOut } from '@/lib/icons';
import { C } from '@/theme/colors';
import { BrandHeader } from '@/components/Shared';
import { useHapticFeedback } from '@/lib/haptics';
import { useT, useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { ReactNode } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

export default function MoreScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const haptics = useHapticFeedback();
  const t = useT();
  const { lang, setLang } = useLanguage();

  const handleLogout = async () => {
    haptics.impactMedium();
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
  };

  const handleVersionLongPress = async () => {
    haptics.impactHeavy();
    try {
      const session = await AsyncStorage.getItem('admin_session');
      if (session === 'true') {
        navigation.navigate('AdminPanel');
      } else {
        navigation.navigate('AdminLogin');
      }
    } catch {
      navigation.navigate('AdminLogin');
    }
  };

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <BrandHeader title={t('more')} />
      <View style={S.body}>
        <View style={S.moreList}>
          <MoreRow icon={<UserRound size={19} color={C.accent} strokeWidth={1.8} />} label={t('profile')} onPress={() => { haptics.impactMedium(); navigation.navigate('Profile'); }} />
          <MoreRow icon={<ImageIcon size={19} color={C.accent} strokeWidth={1.8} />} label={t('mediaLibrary')} onPress={() => { haptics.impactMedium(); navigation.navigate('MediaLibrary'); }} />
          <MoreRow icon={<Menu size={19} color={C.accent} strokeWidth={1.8} />} label={t('helpSupport')} onPress={() => { haptics.impactMedium(); navigation.navigate('Help'); }} />

          <Pressable
            onLongPress={handleVersionLongPress}
            delayLongPress={1500}
            style={S.versionWrap}
          >
            <Text style={S.versionText}>v1.0.0</Text>
          </Pressable>
        </View>

        <Text style={S.sectionTitle}>{t('language')}</Text>
        <View style={S.langRow}>
          <Pressable
            onPress={() => { haptics.impactMedium(); setLang('en'); }}
            style={({ pressed }) => [S.langBtn, lang === 'en' && S.langBtnActive, pressed && S.cardPressed]}
          >
            <Globe size={16} color={lang === 'en' ? '#FFF' : C.accent} strokeWidth={2} />
            <Text style={[S.langText, lang === 'en' && S.langTextActive]}>{t('english')}</Text>
          </Pressable>
          <Pressable
            onPress={() => { haptics.impactMedium(); setLang('ar'); }}
            style={({ pressed }) => [S.langBtn, lang === 'ar' && S.langBtnActive, pressed && S.cardPressed]}
          >
            <Globe size={16} color={lang === 'ar' ? '#FFF' : C.accent} strokeWidth={2} />
            <Text style={[S.langText, lang === 'ar' && S.langTextActive]}>{t('arabic')}</Text>
          </Pressable>
        </View>

        <View style={S.moreList}>
          <MoreRow icon={<LogOut size={19} color={C.red} strokeWidth={1.8} />} label={t('logout')} onPress={handleLogout} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function MoreRow({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.moreRow, pressed && S.cardPressed]}>
      <View style={S.moreIcon}>{icon}</View>
      <Text style={S.moreLabel} numberOfLines={1}>{label}</Text>
      <ChevronRight size={18} color={C.faint} strokeWidth={2} />
    </Pressable>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  body: { paddingHorizontal: 20, paddingTop: 8 },
  moreList: { gap: 10, marginTop: 20 },
  moreRow: { minHeight: 64, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderColor: C.border },
  moreIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  moreLabel: { flex: 1, fontSize: 15, fontFamily: 'Chevalon-SemiBold', color: C.ink, minWidth: 0 },
  sectionTitle: { fontSize: 18, fontFamily: 'Chevalon-ExtraBold', color: C.ink, marginTop: 32, marginBottom: 14 },
  langRow: { flexDirection: 'row', gap: 12 },
  langBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: '#FFF' },
  langBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
  langText: { fontSize: 15, fontFamily: 'Chevalon-SemiBold', color: C.accent },
  langTextActive: { color: '#FFF', fontFamily: 'Chevalon-Bold' },
  versionWrap: { paddingVertical: 20, alignItems: 'center' },
  versionText: { fontSize: 12, color: '#94A3B8', fontFamily: 'Chevalon-Medium' },
  cardPressed: { opacity: 0.6 },
});
