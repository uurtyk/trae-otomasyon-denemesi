import { z } from 'zod';

// Fatura durumu
const invoiceStatuses = [
  'draft',
  'sent',
  'viewed',
  'paid',
  'partial',
  'overdue',
  'cancelled',
  'refunded'
] as const;

// Ödeme yöntemleri
const paymentMethods = [
  'cash',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'check',
  'insurance',
  'online_payment',
  'other'
] as const;

// KDV oranları (Türkiye)
const vatRates = [0, 1, 8, 18] as const;

// Fatura kalemi şeması
const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Açıklama gereklidir'),
  quantity: z.number().positive('Miktar pozitif olmalıdır'),
  unitPrice: z.number().positive('Birim fiyatı pozitif olmalıdır'),
  discount: z.number().nonnegative('İndirim negatif olamaz').default(0),
  vatRate: z.enum(vatRates.map(String) as [string, ...string[]]).default('18'),
  treatmentId: z.string().optional(),
  notes: z.string().optional()
});

// Fatura oluşturma şeması
export const createInvoiceSchema = z.object({
  patientId: z.string().min(1, 'Hasta ID gereklidir'),
  treatmentIds: z.array(z.string()).optional(),
  appointmentId: z.string().optional(),
  invoiceNumber: z.string().optional(), // Otomatik oluşturulacak
  issueDate: z.string().datetime().default(() => new Date().toISOString()),
  dueDate: z.string().datetime(),
  items: z.array(invoiceItemSchema).min(1, 'En az bir fatura kalemi gereklidir'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  currency: z.string().default('TRY'),
  installmentPlan: z.object({
    enabled: z.boolean().default(false),
    installments: z.array(z.object({
      amount: z.number().positive('Taksit tutarı pozitif olmalıdır'),
      dueDate: z.string().datetime(),
      description: z.string().optional()
    })).optional()
  }).optional(),
  insuranceInfo: z.object({
    provider: z.string().min(1, 'Sigorta şirketi gereklidir'),
    policyNumber: z.string().min(1, 'Poliçe numarası gereklidir'),
    coverageAmount: z.number().nonnegative('Kapsama tutarı negatif olamaz'),
    approvalCode: z.string().optional(),
    notes: z.string().optional()
  }).optional()
});

// Fatura güncelleme şeması
export const updateInvoiceSchema = z.object({
  dueDate: z.string().datetime().optional(),
  items: z.array(invoiceItemSchema).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  installmentPlan: z.object({
    enabled: z.boolean(),
    installments: z.array(z.object({
      amount: z.number().positive(),
      dueDate: z.string().datetime(),
      description: z.string().optional()
    }))
  }).optional(),
  insuranceInfo: z.object({
    provider: z.string().min(1),
    policyNumber: z.string().min(1),
    coverageAmount: z.number().nonnegative(),
    approvalCode: z.string().optional(),
    notes: z.string().optional()
  }).optional()
});

// Fatura arama şeması
export const searchInvoicesSchema = z.object({
  patientId: z.string().optional(),
  status: z.enum(invoiceStatuses).optional(),
  invoiceNumber: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().positive().optional(),
  overdue: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.enum(['issueDate', 'dueDate', 'totalAmount', 'status']).default('issueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Ödeme kaydetme şeması
export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Fatura ID gereklidir'),
  amount: z.number().positive('Ödeme tutarı pozitif olmalıdır'),
  paymentMethod: z.enum(paymentMethods),
  paymentDate: z.string().datetime().default(() => new Date().toISOString()),
  reference: z.string().optional(), // Kredi kartı referansı, banka dekont numarası vb.
  notes: z.string().optional(),
  installmentNumber: z.number().int().positive().optional(), // Kaçıncı taksit
  bankInfo: z.object({
    name: z.string().optional(),
    accountNumber: z.string().optional(),
    iban: z.string().optional()
  }).optional(),
  cardInfo: z.object({
    lastFourDigits: z.string().length(4, 'Son 4 hane gereklidir').optional(),
    cardType: z.enum(['visa', 'mastercard', 'amex']).optional()
  }).optional()
});

// Ödeme arama şeması
export const searchPaymentsSchema = z.object({
  invoiceId: z.string().optional(),
  patientId: z.string().optional(),
  paymentMethod: z.enum(paymentMethods).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().positive().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.enum(['paymentDate', 'amount']).default('paymentDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Fatura durumu güncelleme şeması
export const updateInvoiceStatusSchema = z.object({
  status: z.enum(invoiceStatuses),
  notes: z.string().optional()
});

// Türler
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type SearchInvoicesInput = z.infer<typeof searchInvoicesSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type SearchPaymentsInput = z.infer<typeof searchPaymentsSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;