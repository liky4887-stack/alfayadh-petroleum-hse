import { useState } from 'react';
import { ScrollView, Text, View, Alert, Pressable } from 'react-native';
import { Colors } from '@/lib/design';
import { DEPARTMENTS, DEPARTMENT_KEYS } from '@/lib/types';
import type { ReportType, ReportStatus } from '@/lib/types';
import { useHSEStore } from '@/lib/store';
import { useHapticFeedback } from '@/hooks/useHaptics';
import { Button, Chip, TextInput } from '@/components/ui';
import { Camera, MapPin, AlertTriangle, AlertOctagon, ChevronLeft } from 'lucide-react';
import type { ScreenName } from '@/components/Header';

const TOTAL_STEPS = 5;

export function UnsafeReportScreen({ onNavigate }: { onNavigate: (s: ScreenName) => void }) {
  const [step, setStep] = useState(0);
  const [classification, setClassification] = useState<ReportType | null>(null);
  const [note, setNote] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [hasImage, setHasImage] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [status, setStatus] = useState<ReportStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { submitReport } = useHSEStore();
  const haptics = useHapticFeedback();

  const handleClassification = (type: ReportType) => {
    haptics.impactMedium();
    setClassification(type);
    setStep(1);
  };

  const handleLocation = () => {
    haptics.selection();
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          haptics.notificationSuccess();
        },
        () => {
          setLocation({ lat: 25.0667, lng: 50.8000 });
          haptics.notificationSuccess();
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocation({ lat: 25.0667, lng: 50.8000 });
      haptics.notificationSuccess();
    }
  };

  const handleImage = () => {
    haptics.selection();
    setHasImage(!hasImage);
  };

  const handleDepartment = (dept: string) => {
    haptics.selection();
    setDepartment(dept);
    setSubcategory(null);
  };

  const handleSubcategory = (sub: string) => {
    haptics.selection();
    setSubcategory(sub);
  };

  const handleStatus = (s: ReportStatus) => {
    haptics.impactMedium();
    setStatus(s);
  };

  const canProceed = () => {
    if (step === 1) return note.trim().length > 0;
    if (step === 2) return department !== null;
    if (step === 3) return subcategory !== null;
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) {
      haptics.notificationError();
      return;
    }
    haptics.impactMedium();
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const handleBack = () => {
    haptics.impactMedium();
    if (step === 0) {
      onNavigate('dashboard');
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    if (!classification || !note.trim() || !department || !subcategory || !status) {
      haptics.notificationError();
      Alert.alert('تنبيه', 'يرجى إكمال جميع الحقول المطلوبة');
      return;
    }

    setSubmitting(true);
    const result = await submitReport({
      type: classification,
      note: note.trim(),
      corrective_action: correctiveAction.trim() || null,
      department,
      subcategory,
      status,
      location_lat: location?.lat ?? null,
      location_lng: location?.lng ?? null,
    });
    setSubmitting(false);

    if (result.success) {
      if (status === 'open') {
        haptics.notificationError();
        Alert.alert(
          '⚠️ تنبيه: تقرير مفتوح',
          'تم تسجيل التقرير كحالة مفتوحة تحتاج تدخلاً. تم إرسال إشعار للجهات المعنية.',
          [{ text: 'حسناً', onPress: () => onNavigate('dashboard') }]
        );
      } else {
        haptics.notificationSuccess();
        Alert.alert(
          'تم الإرسال',
          result.offline
            ? 'تم حفظ التقرير محلياً. سيتم المزامنة عند عودة الاتصال.'
            : 'تم توثيق التقرير وإغلاقه.',
          [{ text: 'حسناً', onPress: () => onNavigate('dashboard') }]
        );
      }
    } else {
      haptics.notificationError();
      Alert.alert('خطأ', 'تعذر إرسال التقرير. يرجى المحاولة مرة أخرى.');
    }
  };

  const stepLabels = ['التصنيف', 'التفاصيل', 'القسم', 'التصنيف الفرعي', 'الحالة'];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.obsidian }}>
      <View style={{ padding: 20, gap: 20 }}>
        {/* Progress indicator */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor: i <= step ? Colors.emerald : Colors.graphite,
              }}
            />
          ))}
        </View>
        <Text style={{ color: Colors.steel, fontSize: 12, fontWeight: '600' }}>
          الخطوة {step + 1} من {TOTAL_STEPS} — {stepLabels[step]}
        </Text>

        {/* Step 0: Classification */}
        {step === 0 && (
          <View style={{ gap: 16 }}>
            <Text style={{ color: Colors.offWhite, fontSize: 18, fontWeight: '700' }}>
              اختر نوع التقرير
            </Text>
            <Pressable
              onPress={() => handleClassification('unsafe_condition')}
              style={({ hovered, pressed }) => ({
                borderWidth: 1,
                borderColor: Colors.red,
                backgroundColor: pressed ? Colors.redBg : hovered ? Colors.redBg : Colors.slate,
                borderRadius: 12,
                padding: 22,
                minHeight: 72,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
              })}
            >
              <AlertOctagon size={24} color={Colors.red} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.red, fontSize: 17, fontWeight: '800' }}>حالة غير آمنة</Text>
                <Text style={{ color: Colors.steel, fontSize: 13, marginTop: 2 }}>ظرف أو وضع مادي يشكل خطراً</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => handleClassification('unsafe_act')}
              style={({ hovered, pressed }) => ({
                borderWidth: 1,
                borderColor: Colors.red,
                backgroundColor: pressed ? Colors.redBg : hovered ? Colors.redBg : Colors.slate,
                borderRadius: 12,
                padding: 22,
                minHeight: 72,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
              })}
            >
              <AlertTriangle size={24} color={Colors.red} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.red, fontSize: 17, fontWeight: '800' }}>تصرف غير آمن</Text>
                <Text style={{ color: Colors.steel, fontSize: 13, marginTop: 2 }}>سلوك بشري يخالف إجراءات السلامة</Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 10 }}>
              <Text style={{ color: Colors.steel, fontSize: 13, fontWeight: '600' }}>الملاحظة *</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="صف الحالة أو التصرف غير الآمن بالتفصيل..."
                multiline
                numberOfLines={4}
              />
            </View>
            <View style={{ gap: 10 }}>
              <Text style={{ color: Colors.steel, fontSize: 13, fontWeight: '600' }}>الإجراء التصحيحي</Text>
              <TextInput
                value={correctiveAction}
                onChangeText={setCorrectiveAction}
                placeholder="ما الإجراء المتخذ أو المطلوب؟"
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={handleImage}
                style={({ hovered }) => ({
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 14,
                  borderWidth: 1,
                  borderColor: hasImage ? Colors.emerald : Colors.graphite,
                  backgroundColor: hasImage ? Colors.emeraldBg : Colors.slate,
                  borderRadius: 10,
                  minHeight: 48,
                  opacity: hovered ? 0.85 : 1,
                })}
              >
                <Camera size={18} color={hasImage ? Colors.emerald : Colors.steel} />
                <Text style={{ color: hasImage ? Colors.emerald : Colors.steel, fontSize: 14, fontWeight: '600' }}>
                  {hasImage ? 'تم الإرفاق' : '📷 إرفاق صورة'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleLocation}
                style={({ hovered }) => ({
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 14,
                  borderWidth: 1,
                  borderColor: location ? Colors.emerald : Colors.graphite,
                  backgroundColor: location ? Colors.emeraldBg : Colors.slate,
                  borderRadius: 10,
                  minHeight: 48,
                  opacity: hovered ? 0.85 : 1,
                })}
              >
                <MapPin size={18} color={location ? Colors.emerald : Colors.steel} />
                <Text style={{ color: location ? Colors.emerald : Colors.steel, fontSize: 14, fontWeight: '600' }}>
                  {location ? 'تم التحديد' : '📍 تحديد الموقع'}
                </Text>
              </Pressable>
            </View>
            {location && (
              <Text style={{ color: Colors.steel, fontSize: 12, fontVariant: ['tabular-nums'] }}>
                الإحداثيات: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </Text>
            )}
          </View>
        )}

        {/* Step 2: Department */}
        {step === 2 && (
          <View style={{ gap: 16 }}>
            <Text style={{ color: Colors.offWhite, fontSize: 18, fontWeight: '700' }}>
              اختر القسم المسؤول
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {DEPARTMENT_KEYS.map((dept) => (
                <Chip
                  key={dept}
                  label={dept}
                  selected={department === dept}
                  onPress={() => handleDepartment(dept)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Step 3: Subcategory */}
        {step === 3 && (
          <View style={{ gap: 16 }}>
            <Text style={{ color: Colors.offWhite, fontSize: 18, fontWeight: '700' }}>
              التصنيف الفرعي — {department}
            </Text>
            {department && DEPARTMENTS[department] && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {DEPARTMENTS[department].map((sub) => (
                  <Chip
                    key={sub}
                    label={sub}
                    selected={subcategory === sub}
                    onPress={() => handleSubcategory(sub)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Step 4: Status */}
        {step === 4 && (
          <View style={{ gap: 16 }}>
            <Text style={{ color: Colors.offWhite, fontSize: 18, fontWeight: '700' }}>
              حالة التقرير
            </Text>
            <Pressable
              onPress={() => handleStatus('closed')}
              style={({ hovered, pressed }) => ({
                borderWidth: 1,
                borderColor: status === 'closed' ? Colors.green : Colors.graphite,
                backgroundColor: status === 'closed' ? Colors.greenBg : Colors.slate,
                borderRadius: 12,
                padding: 22,
                minHeight: 72,
                opacity: pressed ? 0.8 : hovered ? 0.9 : 1,
              })}
            >
              <Text style={{ color: status === 'closed' ? Colors.green : Colors.offWhite, fontSize: 16, fontWeight: '700' }}>
                مغلقة (تم الحل ميدانياً)
              </Text>
              <Text style={{ color: Colors.steel, fontSize: 13, marginTop: 4 }}>
                تم اتخاذ الإجراء اللازم وتم الحل في الموقع
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleStatus('open')}
              style={({ hovered, pressed }) => ({
                borderWidth: 1,
                borderColor: status === 'open' ? Colors.red : Colors.graphite,
                backgroundColor: status === 'open' ? Colors.redBg : Colors.slate,
                borderRadius: 12,
                padding: 22,
                minHeight: 72,
                opacity: pressed ? 0.8 : hovered ? 0.9 : 1,
              })}
            >
              <Text style={{ color: status === 'open' ? Colors.red : Colors.offWhite, fontSize: 16, fontWeight: '700' }}>
                مفتوحة (تحتاج تدخل)
              </Text>
              <Text style={{ color: Colors.steel, fontSize: 13, marginTop: 4 }}>
                الحالة مستمرة وتتطلب إجراءً من الجهة المعنية
              </Text>
            </Pressable>
          </View>
        )}

        {/* Navigation buttons */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <Pressable
            onPress={handleBack}
            style={({ hovered }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingVertical: 16,
              paddingHorizontal: 20,
              minHeight: 48,
              opacity: hovered ? 0.7 : 1,
            })}
          >
            <ChevronLeft size={20} color={Colors.steel} />
            <Text style={{ color: Colors.steel, fontSize: 15, fontWeight: '600' }}>
              {step === 0 ? 'إلغاء' : 'السابق'}
            </Text>
          </Pressable>

          <View style={{ flex: 1 }} />

          {step < TOTAL_STEPS - 1 ? (
            <Button
              label="التالي"
              onPress={handleNext}
              variant="primary"
              disabled={!canProceed()}
            />
          ) : (
            <Button
              label={submitting ? 'جاري الإرسال...' : 'إرسال التقرير'}
              onPress={handleSubmit}
              variant="danger"
              disabled={submitting || !status}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}
