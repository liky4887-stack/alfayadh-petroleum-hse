export function assertString(v: unknown, field: string): string {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`Expected string for "${field}", got ${typeof v}`);
  }
  return v;
}

export function assertNumber(v: unknown, field: string): number {
  if (typeof v !== 'number' || isNaN(v)) {
    throw new Error(`Expected number for "${field}", got ${typeof v}`);
  }
  return v;
}

export function assertArray<T>(v: unknown, field: string): T[] {
  if (!Array.isArray(v)) {
    throw new Error(`Expected array for "${field}", got ${typeof v}`);
  }
  return v as T[];
}

export function assertOptionalString(v: unknown, field: string): string | null {
  if (v == null) return null;
  if (typeof v !== 'string') {
    throw new Error(`Expected string|null for "${field}", got ${typeof v}`);
  }
  return v;
}
