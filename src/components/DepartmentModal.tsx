import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from '@/lib/icons';
import { useT } from '@/lib/i18n';
import { useHapticFeedback } from '@/lib/haptics';
import { DEPARTMENT_META, type Department } from '@/lib/department';

interface DepartmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (d: Department) => void;
  current: Department;
}

export function DepartmentModal({ visible, onClose, onSelect, current }: DepartmentModalProps) {
  const t = useT();
  const haptics = useHapticFeedback();
  const depts: Department[] = ['safety', 'operations', 'maintenance', 'logistics'];

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={S.overlay} onPress={onClose}>
        <View style={S.card}>
          <Text style={S.title}>{t('selectDepartment')}</Text>
          <Text style={S.subtitle}>Choose the dashboard you want to view</Text>
          {depts.map((d) => (
            <Pressable
              key={d}
              onPress={() => { haptics.impactMedium(); onSelect(d); }}
              style={({ pressed }) => [S.row, current === d && S.rowActive, pressed && S.pressed]}
            >
              <Text style={[S.label, current === d && S.labelActive]}>{DEPARTMENT_META[d].label}</Text>
              <ChevronRight size={16} color="#94A3B8" strokeWidth={2} />
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: '100%', gap: 4 },
  title: { fontSize: 18, fontFamily: 'Chevalon-Bold', color: '#0F172A' },
  subtitle: { fontSize: 13, fontFamily: 'Chevalon-Regular', color: '#64748B', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  rowActive: { borderColor: '#0EA5E9', backgroundColor: '#E0F2FE' },
  label: { fontSize: 15, fontFamily: 'Chevalon-Medium', color: '#0F172A' },
  labelActive: { fontFamily: 'Chevalon-Bold', color: '#0EA5E9' },
  pressed: { opacity: 0.7 },
});
