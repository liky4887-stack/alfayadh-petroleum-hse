import { Pressable, StyleSheet, Text, View, TextInput as RNTextInput, ActivityIndicator } from 'react-native';
import { Dark } from '@/theme/colors';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'ghost' | 'secondary';
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({ label, onPress, variant = 'primary', disabled, fullWidth, icon }: ButtonProps) {
  const bg =
    variant === 'primary' ? Dark.emerald
    : variant === 'danger' ? Dark.red
    : variant === 'secondary' ? Dark.slate
    : 'transparent';
  const borderColor =
    variant === 'primary' ? Dark.emerald
    : variant === 'danger' ? Dark.red
    : variant === 'secondary' ? Dark.graphite
    : Dark.graphite;
  const textColor = variant === 'ghost' ? Dark.steel : Dark.offWhite;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: pressed ? Dark.emeraldHover : bg,
        borderColor,
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 16,
        paddingHorizontal: 20,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        opacity: disabled ? 0.4 : 1,
        flex: fullWidth ? 1 : undefined,
      })}
    >
      {icon}
      <Text style={{ color: textColor, fontSize: 16, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
}

export function Chip({ label, selected, onPress, color }: ChipProps) {
  const accent = color ?? Dark.emerald;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: selected ? accent : Dark.graphite,
        backgroundColor: selected ? `${accent}22` : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{
        color: selected ? accent : Dark.offWhite,
        fontSize: 14,
        fontWeight: selected ? '700' : '400',
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function StatusBadge({ status }: { status: 'open' | 'closed' }) {
  const isOpen = status === 'open';
  const color = isOpen ? Dark.red : Dark.green;
  return (
    <View style={{
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: `${color}55`,
      backgroundColor: `${color}22`,
    }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
        {isOpen ? 'مفتوحة' : 'مغلقة'}
      </Text>
    </View>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16 }}>
      <ActivityIndicator size="small" color={Dark.emerald} />
      <Text style={{ color: Dark.steel, fontSize: 14 }}>{label ?? 'جاري التحميل...'}</Text>
    </View>
  );
}

interface TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
}

export function TextInput({ value, onChangeText, placeholder, multiline, numberOfLines }: TextInputProps) {
  return (
    <View style={{
      borderWidth: 1,
      borderColor: Dark.graphite,
      borderRadius: 10,
      backgroundColor: Dark.slate,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 48,
    }}>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Dark.steel}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlign="right"
        style={{
          color: Dark.offWhite,
          fontSize: 15,
          fontWeight: '400',
          textAlign: 'right',
          minHeight: multiline ? 100 : undefined,
        }}
      />
    </View>
  );
}
