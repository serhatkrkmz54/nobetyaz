export type DayType = "WEEKDAY" | "WEEKEND" | "PUBLIC_HOLIDAY" | "RELIGIOUS_HOLIDAY" | "SPECIAL_DAY" | "ALL_DAYS";

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  WEEKDAY: "Hafta İçi",
  WEEKEND: "Hafta Sonu",
  PUBLIC_HOLIDAY: "Resmi Tatil",
  RELIGIOUS_HOLIDAY: "Dini Bayram",
  SPECIAL_DAY: "Özel Gün",
  ALL_DAYS: "Tüm Günler"
};

export const HOLIDAY_TYPE_OPTIONS: { value: DayType; label: string }[] = [
  { value: "PUBLIC_HOLIDAY", label: "Resmi Tatil (örn: 29 Ekim)" },
  { value: "RELIGIOUS_HOLIDAY", label: "Dini Bayram (örn: Ramazan Bayramı)" },
  { value: "SPECIAL_DAY", label: "Özel Gün (örn: Envanter Sayımı)" }
];

export const APPLY_ON_OPTIONS: { value: DayType; label: string }[] = [
  { value: "WEEKDAY", label: "Hafta İçi (Pzt-Cuma)" },
  { value: "WEEKEND", label: "Hafta Sonu (Cmt-Pzr)" },
  { value: "PUBLIC_HOLIDAY", label: "Resmi Tatiller" },
  { value: "RELIGIOUS_HOLIDAY", label: "Dini Bayramlar" },
  { value: "SPECIAL_DAY", label: "Diğer Özel Günler" },
  { value: "ALL_DAYS", label: "Tüm Günler" }
];

export const DAY_OF_WEEK_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Pazartesi" },
  { value: 2, label: "Salı" },
  { value: 3, label: "Çarşamba" },
  { value: 4, label: "Perşembe" },
  { value: 5, label: "Cuma" },
  { value: 6, label: "Cumartesi" },
  { value: 7, label: "Pazar" },
];

export const PREFERENCE_SCORE_OPTIONS: { value: number; label: string }[] = [
  { value: 10,  label: "Çok İstiyorum (Öncelikli)" },
  { value: 5,   label: "İstiyorum" },
  { value: 0,   label: "Nötr (Farketmez)" },
  { value: -10, label: "İstemiyorum (Mümkünse Atama)" },
];

export const RULE_NAME_LABELS: Record<string, string> = {
  "MAX_WEEKLY_HOURS": "Haftalık Maksimum Çalışma Saati",
  "NIGHT_SHIFT_HOURS_THRESHOLD": "Uzun Gece Nöbeti Eşiği (saat)",
  "MANDATORY_REST_HOURS_AFTER_NIGHT_SHIFT": "Gece Nöbeti Sonrası Zorunlu Dinlenme (saat)",
  "ENFORCE_FAIR_HOLIDAY_DISTRIBUTION": "Adil Bayram Dağıtımı Kuralı (Hafıza)",
  "ALLOW_MEMBER_PREFERENCES": "Personel Nöbet Tercihlerine İzin Ver",
  "ALLOW_SHIFT_BIDDING": "Nöbet Borsası Özelliği"
  
};

