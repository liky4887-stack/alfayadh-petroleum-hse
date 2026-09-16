import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Linking, TextInput as RNTextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, ChevronDown, Mail, Phone, Bug, Send, Shield, Info } from '@/lib/icons';
import { C } from '@/theme/colors';
import { useHapticFeedback } from '@/lib/haptics';
import { Toast } from '@/components/Toast';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

const FAQS = [
  { q: 'How do I report an unsafe condition?', a: 'Tap the dashboard and select "Unsafe Report". Fill in the 5-step form with classification, details, department, and status.' },
  { q: 'What is the difference between safe and unsafe reports?', a: 'Safe reports document positive safety behavior. Unsafe reports flag conditions or acts that need corrective action.' },
  { q: 'How do I close an open report?', a: 'Open the report in the admin dashboard and update its status to "closed" once corrective action is complete.' },
  { q: 'Can I submit reports offline?', a: 'Yes. Reports are saved locally and automatically synced when your device reconnects to the internet.' },
  { q: 'Who can access the admin dashboard?', a: 'The admin dashboard is available from the home screen header. It shows statistics and open reports for supervisors.' },
];

const CONTACTS = [
  { name: 'HSE Hotline', phone: '+97412345678', email: 'hse@alfayadh.com' },
  { name: 'Emergency Support', phone: '+974999', email: 'emergency@alfayadh.com' },
  { name: 'Training Department', phone: '+97412345679', email: 'training@alfayadh.com' },
];

const APP_VERSION = '1.0.0';

export default function HelpScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [bugReport, setBugReport] = useState('');
  const [toast, setToast] = useState({ visible: false, msg: '' });
  const haptics = useHapticFeedback();

  const submitBug = () => {
    if (!bugReport.trim()) { haptics.notificationError(); return; }
    haptics.notificationSuccess();
    setToast({ visible: true, msg: 'Bug report submitted. Thank you!' });
    setBugReport('');
  };

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={S.header}>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.goBack(); }} style={S.backBtn}>
          <ChevronRight size={22} color={C.ink} />
          <Text style={S.backText}>Back</Text>
        </Pressable>
        <Text style={S.headerTitle}>Help & Support</Text>
        <View style={{ width: 70 }} />
      </View>
      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={S.sectionTitle}>Frequently Asked Questions</Text>
        <View style={S.faqList}>
          {FAQS.map((faq, i) => (
            <View key={i} style={S.faqItem}>
              <Pressable
                onPress={() => { haptics.selection(); setOpenFaq(openFaq === i ? null : i); }}
                style={({ pressed }) => [S.faqHeader, pressed && S.btnPressed]}
              >
                <Text style={S.faqQ}>{faq.q}</Text>
                <ChevronDown size={18} color={C.mutedLight} strokeWidth={2} style={{ transform: [{ rotate: openFaq === i ? '180deg' : '0deg' }] }} />
              </Pressable>
              {openFaq === i && <Text style={S.faqA}>{faq.a}</Text>}
            </View>
          ))}
        </View>

        <Text style={S.sectionTitle}>Contact</Text>
        <View style={S.contactList}>
          {CONTACTS.map((c, i) => (
            <View key={i} style={S.contactCard}>
              <View style={S.contactInfo}>
                <Text style={S.contactName}>{c.name}</Text>
                <View style={S.contactLinks}>
                  <Pressable onPress={() => { haptics.impactMedium(); Linking.openURL(`mailto:${c.email}`); }} style={S.contactLink}>
                    <Mail size={15} color={C.primary} strokeWidth={2} />
                    <Text style={S.contactLinkText}>{c.email}</Text>
                  </Pressable>
                  <Pressable onPress={() => { haptics.impactMedium(); Linking.openURL(`tel:${c.phone}`); }} style={S.contactLink}>
                    <Phone size={15} color={C.primary} strokeWidth={2} />
                    <Text style={S.contactLinkText}>{c.phone}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text style={S.sectionTitle}>Report a Bug</Text>
        <View style={S.bugCard}>
          <View style={S.bugInputWrap}>
            <RNTextInput
              value={bugReport}
              onChangeText={setBugReport}
              placeholder="Describe the issue you encountered..."
              placeholderTextColor={C.mutedLight}
              multiline
              style={S.bugInput}
            />
          </View>
          <Pressable onPress={submitBug} style={({ pressed }) => [S.bugSubmit, pressed && S.btnPressed]}>
            <Send size={16} color="#FFF" strokeWidth={2.5} />
            <Text style={S.bugSubmitText}>Submit</Text>
          </Pressable>
        </View>

        <Text style={S.sectionTitle}>About</Text>
        <View style={S.aboutCard}>
          <View style={S.aboutRow}>
            <Info size={18} color={C.primary} strokeWidth={2} />
            <Text style={S.aboutLabel}>App Version</Text>
            <Text style={S.aboutValue}>{APP_VERSION}</Text>
          </View>
          <Pressable onPress={() => { haptics.impactMedium(); Linking.openURL('https://alfayadh.com/privacy'); }} style={({ pressed }) => [S.aboutRow, pressed && S.btnPressed]}>
            <Shield size={18} color={C.primary} strokeWidth={2} />
            <Text style={S.aboutLabel}>Privacy Policy</Text>
            <ChevronRight size={18} color={C.mutedLight} strokeWidth={2} />
          </Pressable>
        </View>
      </ScrollView>
      <Toast message={toast.msg} type="success" visible={toast.visible} onHide={() => setToast({ visible: false, msg: '' })} />
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvasAlt },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.borderLight, backgroundColor: '#FFF' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 15, fontWeight: '600', color: C.ink },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.ink },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: C.ink, marginTop: 16, marginBottom: 12 },
  faqList: { gap: 10 },
  faqItem: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: C.borderLight, overflow: 'hidden' },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  faqQ: { fontSize: 15, fontWeight: '700', color: C.ink, flex: 1, marginRight: 12 },
  faqA: { fontSize: 14, fontWeight: '400', color: C.mutedLight, paddingHorizontal: 16, paddingBottom: 16, lineHeight: 22 },
  contactList: { gap: 10 },
  contactCard: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: C.borderLight, padding: 16 },
  contactInfo: { gap: 10 },
  contactName: { fontSize: 15, fontWeight: '700', color: C.ink },
  contactLinks: { gap: 8 },
  contactLink: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactLinkText: { fontSize: 14, fontWeight: '500', color: C.primary },
  bugCard: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: C.borderLight, padding: 16, gap: 14 },
  bugInputWrap: { borderWidth: 1, borderColor: C.borderLight, borderRadius: 12, backgroundColor: C.canvasAlt, minHeight: 100, paddingHorizontal: 14 },
  bugInput: { fontSize: 15, color: C.ink, paddingVertical: 12, minHeight: 80, textAlignVertical: 'top' },
  bugSubmit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 12, minHeight: 48 },
  bugSubmitText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  aboutCard: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: C.borderLight, overflow: 'hidden' },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  aboutLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: C.ink },
  aboutValue: { fontSize: 15, fontWeight: '700', color: C.mutedLight, fontVariant: ['tabular-nums'] },
  btnPressed: { opacity: 0.7 },
});
