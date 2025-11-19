import { Request, Response } from 'express';
import Joi from 'joi';
import { Invoice } from '../models/Invoice.js';
import Patient from '../models/Patient.js';
import { Treatment } from '../models/Treatment.js';
import { User } from '../models/User.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    permissions: string[];
  };
}

// Fatura numarası oluştur
const generateInvoiceNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FTR${year}${month}${random}`;
};

// Fatura toplamlarını hesapla (Invoice.treatments üzerinden)
const calculateInvoiceTotals = (treatments: Array<{ quantity: number; unitPrice: number; totalPrice?: number }>) => {
  let subtotal = 0;
  treatments.forEach(item => {
    const lineTotal = typeof item.totalPrice === 'number' ? item.totalPrice : (item.quantity * item.unitPrice);
    subtotal += lineTotal;
  });
  const taxAmount = 0;
  const totalAmount = subtotal + taxAmount;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100
  };
};

// Joi şemaları
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const createInvoiceSchema = Joi.object({
  patient: objectId.required(),
  treatments: Joi.array().items(Joi.object({
    treatment: objectId.optional(),
    description: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
    unitPrice: Joi.number().min(0).required(),
    totalPrice: Joi.number().min(0).optional()
  })).default([]),
  subtotal: Joi.number().min(0).optional(),
  taxAmount: Joi.number().min(0).optional(),
  totalAmount: Joi.number().min(0).optional(),
  paidAmount: Joi.number().min(0).optional(),
  remainingAmount: Joi.number().min(0).optional(),
  dueDate: Joi.date().required(),
  paymentMethod: Joi.string().valid('cash', 'credit_card', 'bank_transfer', 'check', 'other').optional(),
  notes: Joi.string().optional()
});

const updateInvoiceSchema = Joi.object({
  treatments: Joi.array().items(Joi.object({
    treatment: objectId.optional(),
    description: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
    unitPrice: Joi.number().min(0).required(),
    totalPrice: Joi.number().min(0).optional()
  })).optional(),
  dueDate: Joi.date().optional(),
  notes: Joi.string().optional()
});

const searchInvoicesSchema = Joi.object({
  patient: objectId.optional(),
  status: Joi.string().valid('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled').optional(),
  invoiceNumber: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  minAmount: Joi.number().min(0).optional(),
  maxAmount: Joi.number().min(0).optional(),
  overdue: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('status', 'totalAmount', 'dueDate', 'createdAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

const updateInvoiceStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled').required(),
  notes: Joi.string().optional()
});

const createPaymentSchema = Joi.object({
  invoiceId: objectId.required(),
  amount: Joi.number().min(0.01).required(),
  paymentMethod: Joi.string().valid('cash', 'credit_card', 'bank_transfer', 'check', 'other').required(),
  paymentDate: Joi.date().default(() => new Date()),
  reference: Joi.string().optional(),
  notes: Joi.string().optional()
});

const searchPaymentsSchema = Joi.object({
  invoiceId: objectId.optional(),
  patient: objectId.optional(),
  paymentMethod: Joi.string().valid('cash', 'credit_card', 'bank_transfer', 'check', 'other').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  minAmount: Joi.number().min(0).optional(),
  maxAmount: Joi.number().min(0).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('paymentDate', 'amount').default('paymentDate'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Fatura oluştur
export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const validationResult = createInvoiceSchema.validate(req.body);
    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: validationResult.error.details
      });
    }

    if (!req.user || !req.user.permissions.includes('invoices.create')) {
      return res.status(403).json({
        success: false,
        message: 'Fatura oluşturma yetkiniz yok'
      });
    }

    const { patient, treatments, dueDate } = validationResult.value;

    // Hasta kontrolü
    const patientDoc = await Patient.findById(patient);
    if (!patientDoc) {
      return res.status(404).json({
        success: false,
        message: 'Hasta bulunamadı'
      });
    }

    // Tedaviler kontrolü (varsa)
    if (treatments && treatments.length > 0) {
      const treatmentIds = treatments
        .map((t: any) => t.treatment)
        .filter(Boolean) as string[];
      if (treatmentIds.length > 0) {
        const existingTreatments = await Treatment.find({ _id: { $in: treatmentIds } });
        if (existingTreatments.length !== treatmentIds.length) {
          return res.status(404).json({
            success: false,
            message: 'Bazı tedaviler bulunamadı'
          });
        }
      }
    }

    // Fatura toplamlarını hesapla
    const totals = calculateInvoiceTotals(treatments || []);

    // Fatura oluştur
    const invoice = new Invoice({
      patient,
      treatments,
      invoiceNumber: generateInvoiceNumber(),
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      paidAmount: 0,
      remainingAmount: totals.totalAmount,
      status: 'draft',
      createdBy: req.user?.id,
      createdAt: new Date()
    });

    await invoice.save();

    // Populate işlemi
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('patient', 'firstName lastName phone email')
      .populate({ path: 'treatments.treatment', select: 'treatmentType description' })
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Fatura başarıyla oluşturuldu',
      data: populatedInvoice
    });

  } catch (error) {
    console.error('Fatura oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Fatura oluşturulurken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Faturaları listele
export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.permissions.includes('invoices.read')) {
      return res.status(403).json({
        success: false,
        message: 'Fatura görüntüleme yetkiniz yok'
      });
    }

    const validationResult = searchInvoicesSchema.validate(req.query);
    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: 'Arama parametreleri geçersiz',
        errors: validationResult.error.details
      });
    }

    const {
      patient,
      status,
      invoiceNumber,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      overdue,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = validationResult.value as any;

    // Filtre oluştur
    const filter: any = {};
    if (patient) filter.patient = patient;
    if (status) filter.status = status;
    if (invoiceNumber) filter.invoiceNumber = new RegExp(invoiceNumber, 'i');
    if (minAmount !== undefined || maxAmount !== undefined) {
      filter.totalAmount = {};
      if (minAmount !== undefined) filter.totalAmount.$gte = minAmount;
      if (maxAmount !== undefined) filter.totalAmount.$lte = maxAmount;
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as any);
      if (endDate) filter.createdAt.$lte = new Date(endDate as any);
    }

    // Vadesi geçmiş faturalar
    if (overdue === true) {
      filter.status = { $in: ['sent', 'partial'] };
      filter.dueDate = { $lt: new Date() };
    }

    // Sayfalama
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const invoices = await Invoice.find(filter)
      .populate('patient', 'firstName lastName phone')
      .populate({ path: 'treatments.treatment', select: 'treatmentType description' })
      .populate('createdBy', 'firstName lastName')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Invoice.countDocuments(filter);

    // Toplam bakiye hesapla
    const balanceSummary = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: '$remainingAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalInvoiced: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        summary: balanceSummary[0] || {
          totalOutstanding: 0,
          totalPaid: 0,
          totalInvoiced: 0
        }
      }
    });

  } catch (error) {
    console.error('Fatura listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Faturalar listelenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Tek fatura getir
export const getInvoice = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.permissions.includes('invoices.read')) {
      return res.status(403).json({
        success: false,
        message: 'Fatura görüntüleme yetkiniz yok'
      });
    }

    const invoice = await Invoice.findById(req.params.id)
      .populate('patient', 'firstName lastName phone email address')
      .populate({ path: 'treatments.treatment', select: 'treatmentType description' })
      .populate('createdBy', 'firstName lastName');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Fatura bulunamadı'
      });
    }

    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Fatura getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Fatura getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Fatura güncelle
export const updateInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const validationResult = updateInvoiceSchema.validate(req.body);
    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: validationResult.error.details
      });
    }

    if (!req.user || !req.user.permissions.includes('invoices.update')) {
      return res.status(403).json({
        success: false,
        message: 'Fatura güncelleme yetkiniz yok'
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Fatura bulunamadı'
      });
    }

    // Ödenmiş faturalar güncellenemez
    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Ödenmiş faturalar güncellenemez'
      });
    }

    // Fatura kalemleri güncellenmişse toplamları yeniden hesapla
    if ((validationResult.value as any).treatments) {
      const totals = calculateInvoiceTotals((validationResult.value as any).treatments);
      (validationResult.value as any).subtotal = totals.subtotal;
      (validationResult.value as any).taxAmount = totals.taxAmount;
      (validationResult.value as any).totalAmount = totals.totalAmount;
      (validationResult.value as any).remainingAmount = totals.totalAmount - invoice.paidAmount;
    }

    // Fatura güncelle
    Object.assign(invoice as any, {
      ...(validationResult.value as any),
      updatedAt: new Date()
    });

    await invoice.save();

    const updatedInvoice = await Invoice.findById(invoice._id)
      .populate('patient', 'firstName lastName phone')
      .populate({ path: 'treatments.treatment', select: 'treatmentType description' })
      .populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Fatura başarıyla güncellendi',
      data: updatedInvoice
    });

  } catch (error) {
    console.error('Fatura güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Fatura güncellenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Fatura durumunu güncelle
export const updateInvoiceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const validationResult = updateInvoiceStatusSchema.validate(req.body);
    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: validationResult.error.details
      });
    }

    if (!req.user || !req.user.permissions.includes('invoices.update')) {
      return res.status(403).json({
        success: false,
        message: 'Fatura durumu güncelleme yetkiniz yok'
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Fatura bulunamadı'
      });
    }

    const { status, notes } = validationResult.value as any;

    // Geçerli durum geçişleri
    const validTransitions: Record<string, string[]> = {
      draft: ['sent', 'cancelled'],
      sent: ['paid', 'partial', 'cancelled'],
      partial: ['paid', 'cancelled'],
      overdue: ['paid', 'partial', 'cancelled'],
      paid: [],
      cancelled: []
    };

    if (!validTransitions[invoice.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Geçersiz durum geçişi: ${invoice.status} → ${status}`
      });
    }

    invoice.status = status;
    if (notes) {
      invoice.notes = invoice.notes ? `${invoice.notes}\n${notes}` : notes;
    }
    invoice.updatedAt = new Date();

    await invoice.save();

    const updatedInvoice = await Invoice.findById(invoice._id)
      .populate('patient', 'firstName lastName phone')
      .populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Fatura durumu başarıyla güncellendi',
      data: updatedInvoice
    });

  } catch (error) {
    console.error('Fatura durumu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Fatura durumu güncellenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Ödeme kaydet
export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const validationResult = createPaymentSchema.validate(req.body);
    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: validationResult.error.details
      });
    }

    if (!req.user || !req.user.permissions.includes('payments.create')) {
      return res.status(403).json({
        success: false,
        message: 'Ödeme kaydetme yetkiniz yok'
      });
    }

    const { invoiceId, amount, paymentMethod, paymentDate, reference, notes } = validationResult.value as any;

    // Fatura kontrolü
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Fatura bulunamadı'
      });
    }

    // Ödeme tutarı kontrolü
    if (amount > invoice.remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Ödeme tutarı kalan bakiyeden fazla olamaz. Kalan bakiye: ${invoice.remainingAmount} TL`
      });
    }

    // Ödeme oluştur (Invoice.payments içine ekle)
    const payment = {
      date: paymentDate || new Date(),
      amount,
      method: paymentMethod,
      reference,
      notes
    } as any;
    (invoice as any).payments = (invoice as any).payments || [];
    (invoice as any).payments.push(payment);

    // Fatura güncelle
    invoice.paidAmount += amount;
    invoice.remainingAmount = invoice.totalAmount - invoice.paidAmount;
    
    // Fatura durumunu güncelle
    if (invoice.remainingAmount === 0) {
      invoice.status = 'paid';
    } else if (invoice.remainingAmount < invoice.totalAmount) {
      invoice.status = 'partial';
    }

    invoice.updatedAt = new Date();

    await invoice.save();

    res.status(201).json({
      success: true,
      message: 'Ödeme başarıyla kaydedildi',
      data: payment
    });

  } catch (error) {
    console.error('Ödeme kaydetme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ödeme kaydedilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Ödemeleri listele
export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.permissions.includes('payments.read')) {
      return res.status(403).json({
        success: false,
        message: 'Ödeme görüntüleme yetkiniz yok'
      });
    }

    const validationResult = searchPaymentsSchema.validate(req.query);
    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: 'Arama parametreleri geçersiz',
        errors: validationResult.error.details
      });
    }

    const {
      invoiceId,
      patient,
      paymentMethod,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 10,
      sortBy = 'paymentDate',
      sortOrder = 'desc'
    } = validationResult.value as any;

    // Filtre oluştur
    // Sayfalama ve sıralama
    const skip = (page - 1) * limit;
    const sortStage: any = { $sort: { } };
    sortStage.$sort[sortBy === 'amount' ? 'payments.amount' : 'payments.date'] = sortOrder === 'desc' ? -1 : 1;

    // Aggregate üzerinden ödemeleri getir
    const matchStage: any = { $match: {} };
    if (invoiceId) matchStage.$match._id = typeof invoiceId === 'string' ? (global as any).mongoose?.Types?.ObjectId?.isValid(invoiceId) ? (global as any).mongoose?.Types?.ObjectId(invoiceId) : invoiceId : invoiceId;
    if (patient) matchStage.$match.patient = patient;

    const pipeline: any[] = [
      matchStage,
      { $unwind: '$payments' },
    ];
    const paymentsDateFilter: any = {};
    if (startDate) paymentsDateFilter.$gte = new Date(startDate as any);
    if (endDate) paymentsDateFilter.$lte = new Date(endDate as any);
    const paymentsAmountFilter: any = {};
    if (minAmount !== undefined) paymentsAmountFilter.$gte = minAmount;
    if (maxAmount !== undefined) paymentsAmountFilter.$lte = maxAmount;
    const paymentsMethodFilter = paymentMethod ? { 'payments.method': paymentMethod } : {};
    const additionalMatch: any = {};
    if (Object.keys(paymentsDateFilter).length) additionalMatch['payments.date'] = paymentsDateFilter;
    if (Object.keys(paymentsAmountFilter).length) additionalMatch['payments.amount'] = paymentsAmountFilter;
    Object.assign(additionalMatch, paymentsMethodFilter);
    if (Object.keys(additionalMatch).length) pipeline.push({ $match: additionalMatch });

    pipeline.push({ $project: {
      invoiceId: '$_id',
      patient: '$patient',
      paymentDate: '$payments.date',
      amount: '$payments.amount',
      paymentMethod: '$payments.method',
      reference: '$payments.reference',
      notes: '$payments.notes'
    }});
    pipeline.push(sortStage);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const payments = await Invoice.aggregate(pipeline);

    const countPipeline = pipeline
      .filter(stage => !('$skip' in stage) && !('$limit' in stage) && !('$project' in stage))
      .concat([{ $count: 'total' }]);
    const totalAgg = await Invoice.aggregate(countPipeline);
    const total = totalAgg[0]?.total || 0;

    const summaryAgg = await Invoice.aggregate([
      ...pipeline.filter(stage => !('$skip' in stage) && !('$limit' in stage) && !('$project' in stage)),
      { $group: { _id: null, totalAmount: { $sum: '$payments.amount' }, avgAmount: { $avg: '$payments.amount' }, count: { $sum: 1 } } }
    ]);
    const summary = summaryAgg[0] || { totalAmount: 0, avgAmount: 0, count: 0 };

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        summary
      }
    });

  } catch (error) {
    console.error('Ödeme listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ödemeler listelenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Hasta bakiyesini getir
export const getPatientBalance = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.permissions.includes('invoices.read')) {
      return res.status(403).json({
        success: false,
        message: 'Bakiye görüntüleme yetkiniz yok'
      });
    }

    const patientId = req.params.patientId;

    // Hasta kontrolü
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Hasta bulunamadı'
      });
    }

    // Açık faturalar
    const outstandingInvoices = await Invoice.find({
      patientId,
      status: { $in: ['sent', 'viewed', 'partial', 'overdue'] }
    }).sort({ dueDate: 1 });

    // Toplam bakiye bilgileri
    const balanceSummary = await Invoice.aggregate([
      { $match: { patientId: patient._id } },
      {
        $group: {
          _id: null,
          totalInvoiced: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalOutstanding: { $sum: '$remainingAmount' }
        }
      }
    ]);

    const summary = balanceSummary[0] || {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOutstanding: 0
    };

    res.json({
      success: true,
      data: {
        patient: {
          id: patient._id,
          name: `${patient.firstName} ${patient.lastName}`,
          phone: patient.phone
        },
        balanceSummary: summary,
        outstandingInvoices,
        currentBalance: summary.totalOutstanding
      }
    });

  } catch (error) {
    console.error('Hasta bakiyesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Hasta bakiyesi getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Finansal özet getir
export const getFinancialSummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.permissions.includes('invoices.read')) {
      return res.status(403).json({
        success: false,
        message: 'Finansal özet görüntüleme yetkiniz yok'
      });
    }

    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    const filter: any = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Aylık gelir trendi
    const monthlyRevenue = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalInvoiced: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Ödeme yöntemlerine göre dağılım
    const paymentMethodStats = await Invoice.aggregate([
      { $unwind: '$payments' },
      {
        $group: {
          _id: '$payments.method',
          totalAmount: { $sum: '$payments.amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Genel özet
    const overallSummary = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalInvoiced: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalOutstanding: { $sum: '$remainingAmount' },
          totalInvoices: { $sum: 1 },
          paidInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          overdueInvoices: {
            $sum: { $cond: [{ $and: [{ $eq: ['$status', 'overdue'] }, { $lt: ['$dueDate', new Date()] }] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overall: overallSummary[0] || {
          totalInvoiced: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          totalInvoices: 0,
          paidInvoices: 0,
          overdueInvoices: 0
        },
        monthlyRevenue,
        paymentMethodStats
      }
    });

  } catch (error) {
    console.error('Finansal özet getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Finansal özet getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};