import { Pressable, StyleSheet, Text, View, TextInput as RNTextInput, ActivityIndicator } from 'react-native';
import { theme } from '@/theme/theme';

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
    variant === 'primary' ? theme.primary
    : variant === 'danger' ? theme.danger
    : variant === 'secondary' ? theme.cardAlt
    : 'transparent';
  const borderColor =
    variant === 'primary' ? theme.primary
    : variant === 'danger' ? theme.danger
    : variant === 'secondary' ? theme.border
    : theme.border;
  const textColor = variant === 'ghost' ? theme.textDim : '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: pressed ? theme.primaryDark : bg,
        borderColor,
        borderWidth: 1,
        borderRadius: 12,
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
  const accent = color ?? theme.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: selected ? accent : theme.border,
        backgroundColor: selected ? theme.primaryLight : theme.card,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{
        color: selected ? accent : theme.textDim,
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
  const color = isOpen ? theme.warning : theme.success;
  return (
    <View style={{
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: `${color}55`,
      backgroundColor: isOpen ? theme.warningLight : theme.successLight,
    }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
        {isOpen ? 'Open' : 'Closed'}
      </Text>
    </View>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16 }}>
      <ActivityIndicator size="small" color={theme.primary} />
      <Text style={{ color: theme.textDim, fontSize: 14 }}>{label ?? 'Loading...'}</Text>
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
      borderColor: theme.border,
      borderRadius: 12,
      backgroundColor: theme.card,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 48,
    }}>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textFaint}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlign="left"
        style={{
          color: theme.text,
          fontSize: 15,
          fontWeight: '400',
          minHeight: multiline ? 100 : undefined,
        }}
      />
    </View>
  );
}
