// Design System — exact colors from the manifesto
export const Colors = {
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

export const Typography = {
  title: {
    fontWeight: '800' as const,
    fontSize: '22px',
    color: Colors.offWhite,
    letterSpacing: '-0.3px',
  },
  header: {
    fontWeight: '800' as const,
    fontSize: '18px',
    color: Colors.offWhite,
    letterSpacing: '-0.2px',
  },
  body: {
    fontWeight: '400' as const,
    fontSize: '15px',
    color: Colors.offWhite,
    lineHeight: 1.6,
  },
  bodyMuted: {
    fontWeight: '400' as const,
    fontSize: '14px',
    color: Colors.steel,
    lineHeight: 1.5,
  },
  caption: {
    fontWeight: '400' as const,
    fontSize: '12px',
    color: Colors.steel,
  },
  largeTitle: {
    fontWeight: '800' as const,
    fontSize: '28px',
    color: Colors.offWhite,
    letterSpacing: '-0.5px',
  },
  kpiNumber: {
    fontWeight: '800' as const,
    fontSize: '32px',
    color: Colors.offWhite,
    fontVariant: 'tabular-nums' as const,
  },
} as const;

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

export const STATUS_LABELS: Record<string, string> = {
  open: 'مفتوحة',
  closed: 'مغلقة',
};

export const TYPE_LABELS: Record<string, string> = {
  safe: 'وضع آمن',
  unsafe_condition: 'حالة غير آمنة',
  unsafe_act: 'تصرف غير آمن',
};
