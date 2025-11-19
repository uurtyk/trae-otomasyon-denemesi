import { z } from 'zod';

// Diş numaralama sistemi (FDI Dünya Diş Hekimliği Federasyonu sistemi)
const validToothNumbers = [
  11, 12, 13, 14, 15, 16, 17, 18, // Üst sağ çene
  21, 22, 23, 24, 25, 26, 27, 28, // Üst sol çene
  31, 32, 33, 34, 35, 36, 37, 38, // Alt sol çene
  41, 42, 43, 44, 45, 46, 47, 48  // Alt sağ çene
] as const;

// Süt dişleri
const validBabyToothNumbers = [
  51, 52, 53, 54, 55, // Üst sağ süt dişleri
  61, 62, 63, 64, 65, // Üst sol süt dişleri
  71, 72, 73, 74, 75, // Alt sol süt dişleri
  81, 82, 83, 84, 85  // Alt sağ süt dişleri
] as const;

const allValidToothNumbers = [...validToothNumbers, ...validBabyToothNumbers] as const;

// Tedavi türleri
const treatmentTypes = [
  'checkup',
  'cleaning',
  'filling',
  'root_canal',
  'extraction',
  'crown',
  'bridge',
  'implant',
  'orthodontics',
  'whitening',
  'veneer',
  'denture',
  'periodontal',
  'oral_surgery',
  'emergency',
  'consultation',
  'xray',
  'other'
] as const;

// Diş yüzeyleri
const toothSurfaces = [
  'mesial',
  'distal',
  'buccal',
  'lingual',
  'occlusal',
  'incisal',
  'facial',
  'palatal'
] as const;

// Diş durumu
const toothConditions = [
  'healthy',
  'caries',
  'filled',
  'missing',
  'implant',
  'crown',
  'root_canal',
  'fractured',
  'mobility',
  'calculus',
  'plaque',
  'gingivitis',
  'periodontitis',
  'other'
] as const;

// Tedavi durumu
const treatmentStatuses = [
  'planned',
  'in_progress',
  'completed',
  'cancelled',
  'postponed',
  'emergency'
] as const;

// Temel diş bilgisi şeması
const toothInfoSchema = z.object({
  toothNumber: z.number().refine((num) => allValidToothNumbers.includes(num as any), {
    message: 'Geçersiz diş numarası'
  }),
  condition: z.enum(toothConditions),
  surfaces: z.array(z.enum(toothSurfaces)).optional(),
  notes: z.string().optional()
});

// Tedavi oluşturma şeması
export const createTreatmentSchema = z.object({
  patientId: z.string().min(1, 'Hasta ID gereklidir'),
  appointmentId: z.string().optional(),
  dentistId: z.string().min(1, 'Diş hekimi ID gereklidir'),
  treatmentType: z.enum(treatmentTypes),
  toothInfo: z.array(toothInfoSchema).min(1, 'En az bir diş bilgisi gereklidir'),
  description: z.string().min(1, 'Tedavi açıklaması gereklidir'),
  diagnosis: z.string().min(1, 'Tanı gereklidir'),
  treatmentPlan: z.string().min(1, 'Tedavi planı gereklidir'),
  estimatedCost: z.number().positive('Maliyet pozitif olmalıdır').optional(),
  actualCost: z.number().positive('Gerçek maliyet pozitif olmalıdır').optional(),
  insuranceCoverage: z.number().nonnegative('Sigorta kapsamı negatif olamaz').default(0),
  priority: z.enum(['low', 'medium', 'high', 'emergency']).default('medium'),
  status: z.enum(treatmentStatuses).default('planned'),
  scheduledDate: z.string().datetime().optional(),
  completedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  materials: z.array(z.object({
    materialId: z.string().optional(),
    name: z.string().min(1, 'Malzeme adı gereklidir'),
    quantity: z.number().positive('Miktar pozitif olmalıdır'),
    unit: z.string().min(1, 'Birim gereklidir'),
    cost: z.number().nonnegative('Maliyet negatif olamaz').optional()
  })).optional(),
  medications: z.array(z.object({
    name: z.string().min(1, 'İlaç adı gereklidir'),
    dosage: z.string().min(1, 'Dozaj gereklidir'),
    frequency: z.string().min(1, 'Kullanım sıklığı gereklidir'),
    duration: z.string().min(1, 'Kullanım süresi gereklidir'),
    instructions: z.string().optional()
  })).optional(),
  images: z.array(z.object({
    type: z.enum(['before', 'during', 'after', 'xray', 'scan']),
    url: z.string().url('Geçerli bir URL gereklidir'),
    description: z.string().optional(),
    uploadedAt: z.string().datetime().default(() => new Date().toISOString())
  })).optional(),
  xrays: z.array(z.object({
    type: z.enum(['panoramic', 'periapical', 'bite_wing', 'occlusal', 'cephalometric', 'cbct']),
    date: z.string().datetime(),
    description: z.string().optional(),
    findings: z.string().optional(),
    imageUrl: z.string().url().optional()
  })).optional()
});

// Tedavi güncelleme şeması
export const updateTreatmentSchema = z.object({
  treatmentType: z.enum(treatmentTypes).optional(),
  toothInfo: z.array(toothInfoSchema).optional(),
  description: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  estimatedCost: z.number().positive().optional(),
  actualCost: z.number().positive().optional(),
  insuranceCoverage: z.number().nonnegative().optional(),
  priority: z.enum(['low', 'medium', 'high', 'emergency']).optional(),
  status: z.enum(treatmentStatuses).optional(),
  scheduledDate: z.string().datetime().optional(),
  completedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  materials: z.array(z.object({
    materialId: z.string().optional(),
    name: z.string().min(1),
    quantity: z.number().positive(),
    unit: z.string().min(1),
    cost: z.number().nonnegative().optional()
  })).optional(),
  medications: z.array(z.object({
    name: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    instructions: z.string().optional()
  })).optional(),
  images: z.array(z.object({
    type: z.enum(['before', 'during', 'after', 'xray', 'scan']),
    url: z.string().url(),
    description: z.string().optional(),
    uploadedAt: z.string().datetime().default(() => new Date().toISOString())
  })).optional(),
  xrays: z.array(z.object({
    type: z.enum(['panoramic', 'periapical', 'bite_wing', 'occlusal', 'cephalometric', 'cbct']),
    date: z.string().datetime(),
    description: z.string().optional(),
    findings: z.string().optional(),
    imageUrl: z.string().url().optional()
  })).optional()
});

// Tedavi arama şeması
export const searchTreatmentsSchema = z.object({
  patientId: z.string().optional(),
  dentistId: z.string().optional(),
  treatmentType: z.enum(treatmentTypes).optional(),
  status: z.enum(treatmentStatuses).optional(),
  priority: z.enum(['low', 'medium', 'high', 'emergency']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minCost: z.number().nonnegative().optional(),
  maxCost: z.number().positive().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.enum(['createdAt', 'scheduledDate', 'completedDate', 'estimatedCost', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Diş çizelgesi güncelleme şeması
export const updateDentalChartSchema = z.object({
  teeth: z.array(toothInfoSchema).min(1, 'En az bir diş bilgisi gereklidir')
});

// Progress notu ekleme şeması
export const addProgressNoteSchema = z.object({
  note: z.string().min(1, 'Not içeriği gereklidir'),
  type: z.enum(['progress', 'complication', 'instruction', 'follow_up']).default('progress'),
  images: z.array(z.object({
    url: z.string().url('Geçerli bir URL gereklidir'),
    description: z.string().optional()
  })).optional()
});

// Türler
export type CreateTreatmentInput = z.infer<typeof createTreatmentSchema>;
export type UpdateTreatmentInput = z.infer<typeof updateTreatmentSchema>;
export type SearchTreatmentsInput = z.infer<typeof searchTreatmentsSchema>;
export type UpdateDentalChartInput = z.infer<typeof updateDentalChartSchema>;
export type AddProgressNoteInput = z.infer<typeof addProgressNoteSchema>;