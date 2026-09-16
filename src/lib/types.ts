export type ReportType = 'safe' | 'unsafe_condition' | 'unsafe_act';
export type ReportStatus = 'open' | 'closed';

export interface HSEReport {
  id: string;
  type: ReportType;
  note: string;
  corrective_action: string | null;
  image_url: string | null;
  department: string | null;
  subcategory: string | null;
  status: ReportStatus;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
}

export interface QueuedReport {
  tempId: string;
  data: Omit<HSEReport, 'id' | 'created_at'>;
  createdAt: string;
}

export const DEPARTMENTS: Record<string, string[]> = {
  'ميكانيكا': ['صيانة عامة', 'معدات', 'تزييت', 'محركات'],
  'كهرباء': ['لوحات توزيع', 'كابلات', 'إضاءة', 'مولدات'],
  'لحام': ['لحام بالقوس', 'لحام الغاز', 'قطع معدن', 'حماية لحام'],
  'كيمياء': ['تخزين مواد', 'تسرب', 'خلط', 'تهوية'],
  'صحة والسلامة': ['معدات وقاية', 'إسعافات أولية', 'تدريب', 'تفتيش'],
  'أعمال حفر': ['حفار', 'طين', 'بطانة', 'منع انفجار'],
  'نقل': ['مركبات', 'شاحنات', 'رفع', 'تأمين أحمال'],
  'مخيم': ['إقامة', 'مرافق', 'نظافة', 'أمن'],
  'معدات': ['رافعات', 'ضواغط', 'مضخات', 'أدوات يدوية'],
};

export const DEPARTMENT_KEYS = Object.keys(DEPARTMENTS);
