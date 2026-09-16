import { useState } from 'react';
import { ScrollView, Text, View, Alert, Pressable } from 'react-native';
import { Colors } from '@/lib/design';
import { useHSEStore } from '@/lib/store';
import { useHapticFeedback } from '@/hooks/useHaptics';
import { Button, TextInput } from '@/components/ui';
import { Camera, Check } from 'lucide-react';
import type { ScreenName } from '@/components/Header';

export function SafeReportScreen({ onNavigate }: { onNavigate: (s: ScreenName) => void }) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { submitReport } = useHSEStore();
  const haptics = useHapticFeedback();

  const handleSubmit = async () => {
    if (!note.trim()) {
      haptics.notificationError();
      Alert.alert('تنبيه', 'يرجى إدخال ملاحظة قبل الإرسال');
      return;
    }
    setSubmitting(true);
    const result = await submitReport({
      type: 'safe',
      note: note.trim(),
      status: 'closed',
    });
    setSubmitting(false);

    if (result.success) {
      haptics.notificationSuccess();
      Alert.alert(
        result.offline ? 'تم الحفظ محلياً' : 'تم الإرسال',
        result.offline
          ? 'شكراً لك! تم حفظ الملاحظة. سيتم المزامنة عند عودة الاتصال.'
          : 'شكراً لك! تم توثيق الملاحظة الإيجابية.'
      );
      onNavigate('dashboard');
    } else {
      haptics.notificationError();
      Alert.alert('خطأ', 'تعذر إرسال التقرير. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.obsidian }}>
      <View style={{ padding: 20, gap: 24 }}>
        <View>
          <Text style={{ color: Colors.emerald, fontSize: 16, fontWeight: '700', marginBottom: 6 }}>
            توثيق وضع آمن
          </Text>
          <Text style={{ color: Colors.steel, fontSize: 14, lineHeight: 1.6 }}>
            سجّل سلوكاً أو حالة آمنة أثارت انتباهك في الميدان. هذه الملاحظات تساعد في تعزيز ثقافة السلامة.
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ color: Colors.steel, fontSize: 13, fontWeight: '600' }}>الملاحظة</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="صف السلوك أو الحالة الآمنة التي لاحظتها..."
            multiline
            numberOfLines={4}
          />
        </View>

        <Pressable
          style={({ hovered }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: Colors.graphite,
            borderRadius: 10,
            backgroundColor: Colors.slate,
            minHeight: 48,
            opacity: hovered ? 0.8 : 1,
          })}
        >
          <Camera size={20} color={Colors.steel} />
          <Text style={{ color: Colors.steel, fontSize: 14 }}>📷 إرفاق صورة (اختياري)</Text>
        </Pressable>

        <Button
          label={submitting ? 'جاري الإرسال...' : 'إرسال التقرير'}
          onPress={handleSubmit}
          variant="primary"
          fullWidth
          disabled={submitting}
          icon={<Check size={18} color={Colors.offWhite} />}
        />
      </View>
    </ScrollView>
  );
}
