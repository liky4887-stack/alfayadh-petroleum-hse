export const C = {
  canvas: '#F2FAFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F5FBFF',
  border: '#D8ECF7',
  borderStrong: '#B6D9EC',
  ink: '#102A43',
  inkSecondary: '#486581',
  muted: '#6B8298',
  faint: '#9BB6C8',
  accent: '#138FC2',
  accentSoft: '#DDF4FF',
  accentHover: '#087EAE',
  greenBg: '#E6F4EA',
  green: '#137333',
  orangeBg: '#FEF7E0',
  orange: '#B06000',
  redBg: '#FCE8E6',
  red: '#C5221F',
  blueBg: '#E8F2FF',
  blue: '#138FC2',
  sky: '#5BC0EB',
  primary: '#2E7DFF',
  primarySoft: '#E3F0FF',
  primaryHover: '#1565C0',
  canvasAlt: '#F5F7FA',
  borderLight: '#E0E5EC',
  inkLight: '#1A1A2E',
  mutedLight: '#8A94A6',
  successBg: '#E8F5E9',
  success: '#2E7D32',
  errorBg: '#FFEBEE',
  errorLight: '#C62828',
  warningBg: '#FFF8E1',
  warning: '#F57F17',
} as const;

export const Dark = {
  obsidian: '#0A0A0A',
  slate: '#141414',
  graphite: '#262626',
  graphiteLight: '#333333',
  offWhite: '#F5F5F5',
  steel: '#888888',
  emerald: '#2A5C4A',
  emeraldHover: '#356B57',
  red: '#FF453A',
  redHover: '#FF5C52',
  green: '#34C759',
  redBg: 'rgba(255, 69, 58, 0.13)',
  greenBg: 'rgba(52, 199, 89, 0.13)',
  emeraldBg: 'rgba(42, 92, 74, 0.15)',
} as const;

export const IMG = {
  warehouse: 'https://images.pexels.com/photos/37589838/pexels-photo-37589838.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  wetFloor: 'https://images.pexels.com/photos/5884386/pexels-photo-5884386.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  truck: 'https://images.pexels.com/photos/10673703/pexels-photo-10673703.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  driver: 'https://images.pexels.com/photos/15947456/pexels-photo-15947456.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  barrels: 'https://images.pexels.com/photos/6060191/pexels-photo-6060191.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  worker: 'https://images.pexels.com/photos/16368437/pexels-photo-16368437.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

export const TYPE_LABELS: Record<string, string> = {
  safe: 'وضع آمن',
  unsafe_condition: 'حالة غير آمنة',
  unsafe_act: 'تصرف غير آمن',
};

export const STATUS_LABELS: Record<string, string> = {
  open: 'مفتوحة',
  closed: 'مغلقة',
};

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'الآن';
  if (mins < 60) return `قبل ${mins} دقيقة`;
  if (hours < 24) return `قبل ${hours} ساعة`;
  if (days < 7) return `قبل ${days} يوم`;
  return d.toLocaleDateString('ar', { day: 'numeric', month: 'short' });
}
