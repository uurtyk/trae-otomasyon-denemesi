import { Request, Response } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import { Treatment } from '../models/Treatment.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    permissions: string[];
  };
}

// Joi helpers
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

// Joi schemas
const createTreatmentSchema = Joi.object({
  patient: objectId.required(),
  dentist: objectId.required(),
  appointment: objectId.optional(),
  treatmentType: Joi.string().required(),
  description: Joi.string().required(),
  teeth: Joi.array().items(Joi.object({
    toothNumber: Joi.string().required(),
    surface: Joi.string().optional(),
    condition: Joi.string().required()
  })).default([]),
  status: Joi.string().valid('planned','in_progress','completed','cancelled').default('planned'),
  startDate: Joi.date().default(() => new Date()),
  endDate: Joi.date().optional(),
  totalCost: Joi.number().min(0).default(0),
  paidAmount: Joi.number().min(0).default(0),
  notes: Joi.string().optional()
});

const updateTreatmentSchema = Joi.object({
  treatmentType: Joi.string().optional(),
  description: Joi.string().optional(),
  teeth: Joi.array().items(Joi.object({
    toothNumber: Joi.string().required(),
    surface: Joi.string().optional(),
    condition: Joi.string().required()
  })).optional(),
  status: Joi.string().valid('planned','in_progress','completed','cancelled').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  totalCost: Joi.number().min(0).optional(),
  paidAmount: Joi.number().min(0).optional(),
  notes: Joi.string().optional()
});

const searchTreatmentsSchema = Joi.object({
  patient: objectId.optional(),
  dentist: objectId.optional(),
  treatmentType: Joi.string().optional(),
  status: Joi.string().valid('planned','in_progress','completed','cancelled').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  minCost: Joi.number().min(0).optional(),
  maxCost: Joi.number().min(0).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt','startDate','status','totalCost').default('createdAt'),
  sortOrder: Joi.string().valid('asc','desc').default('desc')
});

const updateDentalChartSchema = Joi.object({
  teeth: Joi.array().items(Joi.object({
    toothNumber: Joi.string().required(),
    condition: Joi.string().required(),
    surfaces: Joi.array().items(Joi.string()).optional(),
    notes: Joi.string().optional()
  })).required()
});

const addProgressNoteSchema = Joi.object({
  note: Joi.string().required()
});

// Tedavi oluştur
export const createTreatment = async (req: AuthRequest, res: Response) => {
  try {
    const validationResult = createTreatmentSchema.validate(req.body);
    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: validationResult.error.details
      });
    }

    if (!req.user || !req.user.permissions.includes('treatments.create')) {
      return res.status(403).json({
        success: false,
        message: 'Tedavi oluşturma yetkiniz yok'
      });
    }

    const { patient, dentist, appointment } = validationResult.value as any;

    // Hasta kontrolü
    const patientDoc = await Patient.findById(patient);
    if (!patientDoc) {
      return res.status(404).json({
        success: false,
        message: 'Hasta bulunamadı'
      });
    }

    // Diş hekimi kontrolü
    const dentistDoc = await User.findOne({ _id: dentist, role: 'dentist', isActive: true });
    if (!dentistDoc) {
      return res.status(404).json({
        success: false,
        message: 'Diş hekimi bulunamadı veya aktif değil'
      });
    }

    // Randevu kontrolü (varsa)
    if (appointment) {
      const appointmentDoc = await Appointment.findById(appointment);
      if (!appointmentDoc) {
        return res.status(404).json({
          success: false,
          message: 'Randevu bulunamadı'
        });
      }
    }

    // Tedavi oluştur
    const treatment = new Treatment({
      patient,
      dentist,
      appointment,
      treatmentType: (validationResult.value as any).treatmentType,
      description: (validationResult.value as any).description,
      teeth: (validationResult.value as any).teeth || [],
      status: (validationResult.value as any).status,
      startDate: (validationResult.value as any).startDate,
      endDate: (validationResult.value as any).endDate,
      totalCost: (validationResult.value as any).totalCost,
      paidAmount: (validationResult.value as any).paidAmount,
      progressNotes: []
    });

    await treatment.save();

    // Populate işlemi
    const populatedTreatment = await Treatment.findById(treatment._id)
      .populate('patient', 'firstName lastName phone')
      .populate('dentist', 'firstName lastName licenseNumber')
      .populate('appointment', 'dateTime');

    res.status(201).json({
      success: true,
      message: 'Tedavi planı başarıyla oluşturuldu',
      data: populatedTreatment
    });

  } catch (error) {
    console.error('Tedavi oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tedavi oluşturulurken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Tedavileri listele
export const getTreatments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.permissions.includes('treatments.read')) {
      return res.status(403).json({
        success: false,
        message: 'Tedavi görüntüleme yetkiniz yok'
      });
    }

    const validationResult = searchTreatmentsSchema.validate(req.query);
    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: 'Arama parametreleri geçersiz',
        errors: validationResult.error.details
      });
    }

    const {
      patient,
      dentist,
      treatmentType,
      status,
      startDate,
      endDate,
      minCost,
      maxCost,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = validationResult.value as any;

    // Filtre oluştur
    const filter: any = {};
    if (patient) filter.patient = patient;
    if (dentist) filter.dentist = dentist;
    if (treatmentType) filter.treatmentType = treatmentType;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as any);
      if (endDate) filter.createdAt.$lte = new Date(endDate as any);
    }

    if (minCost !== undefined || maxCost !== undefined) {
      filter.totalCost = {};
      if (minCost !== undefined) filter.totalCost.$gte = minCost;
      if (maxCost !== undefined) filter.totalCost.$lte = maxCost;
    }

    // Diş hekimi ise sadece kendi tedavilerini görsün
    if (req.user.role === 'dentist') {
      filter.dentist = req.user.id;
    }

    // Sayfalama
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const treatments = await Treatment.find(filter)
      .populate('patient', 'firstName lastName phone')
      .populate('dentist', 'firstName lastName licenseNumber')
      .populate('appointment', 'dateTime')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Treatment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        treatments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Tedavi listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tedaviler listelenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Tek tedavi getir
export const getTreatment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.permissions.includes('treatments.read')) {
      return res.status(403).json({
        success: false,
        message: 'Tedavi görüntüleme yetkiniz yok'
      });
    }

    const treatment = await Treatment.findById(req.params.id)
      .populate('patient', 'firstName lastName phone email dateOfBirth')
      .populate('dentist', 'firstName lastName licenseNumber')
      .populate('appointment', 'dateTime duration')
      .populate('progressNotes.dentist', 'firstName lastName');

    if (!treatment) {
      return res.status(404).json({
        success: false,
        message: 'Tedavi bulunamadı'
      });
    }

    // Diş hekimi ise sadece kendi tedavilerini görsün
    if (req.user.role === 'dentist' && (treatment.dentist as any)._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu tedaviyi görüntüleme yetkiniz yok'
      });
    }

    res.json({
      success: true,
      data: treatment
    });

  } catch (error) {
    console.error('Tedavi getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tedavi getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Tedavi güncelle
export const updateTreatment = async (req: AuthRequest, res: Response) => {
  try {
    const validationResult = updateTreatmentSchema.validate(req.body);
    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: validationResult.error.details
      });
    }

    if (!req.user || !req.user.permissions.includes('treatments.update')) {
      return res.status(403).json({
        success: false,
        message: 'Tedavi güncelleme yetkiniz yok'
      });
    }

    const treatment = await Treatment.findById(req.params.id);
    if (!treatment) {
      return res.status(404).json({
        success: false,
        message: 'Tedavi bulunamadı'
      });
    }

    // Diş hekemi ise sadece kendi tedavilerini güncelleyebilsin
    if (req.user.role === 'dentist' && treatment.dentist.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu tedaviyi güncelleme yetkiniz yok'
      });
    }

    // Tamamlandı durumu için kontrol
    if ((validationResult.value as any).status === 'completed' && !(validationResult.value as any).endDate) {
      (validationResult.value as any).endDate = new Date();
    }

    // Tedavi güncelle
    Object.assign(treatment as any, {
      ...(validationResult.value as any),
      updatedAt: new Date()
    });

    await treatment.save();

    const updatedTreatment = await Treatment.findById(treatment._id)
      .populate('patient', 'firstName lastName phone')
      .populate('dentist', 'firstName lastName')
      .populate('appointment', 'dateTime');

    res.json({
      success: true,
      message: 'Tedavi planı başarıyla güncellendi',
      data: updatedTreatment
    });

  } catch (error) {
    console.error('Tedavi güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tedavi güncellenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Diş çizelgesini güncelle
export const updateDentalChart = async (req: AuthRequest, res: Response) => {
  try {
    const validationResult = updateDentalChartSchema.validate(req.body);
    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: validationResult.error.details
      });
    }

    if (!req.user || !req.user.permissions.includes('treatments.update')) {
      return res.status(403).json({
        success: false,
        message: 'Diş çizelgesi güncelleme yetkiniz yok'
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

    // Hastanın mevcut diş çizelgesini güncelle veya oluştur
    const dentalChart = {
      teeth: (validationResult.value as any).teeth,
      updatedAt: new Date()
    } as any;

    // Patient modelinde dentalChart alanını güncelle
    await Patient.findByIdAndUpdate(patientId, {
      dentalChart,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Diş çizelgesi başarıyla güncellendi',
      data: dentalChart
    });

  } catch (error) {
    console.error('Diş çizelgesi güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Diş çizelgesi güncellenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Progress notu ekle
export const addProgressNote = async (req: AuthRequest, res: Response) => {
  try {
    const validationResult = addProgressNoteSchema.validate(req.body);
    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: validationResult.error.details
      });
    }

    if (!req.user || !req.user.permissions.includes('treatments.update')) {
      return res.status(403).json({
        success: false,
        message: 'Progress notu ekleme yetkiniz yok'
      });
    }

    const treatment = await Treatment.findById(req.params.id);
    if (!treatment) {
      return res.status(404).json({
        success: false,
        message: 'Tedavi bulunamadı'
      });
    }

    // Diş hekimi ise sadece kendi tedavilerine not ekleyebilsin
    if (req.user.role === 'dentist' && treatment.dentist.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu tedaviye not ekleme yetkiniz yok'
      });
    }

    const progressNote = {
      date: new Date(),
      note: (validationResult.value as any).note,
      dentist: new mongoose.Types.ObjectId(req.user!.id)
    } as any;

    (treatment as any).progressNotes.push(progressNote);
    (treatment as any).updatedAt = new Date();

    await treatment.save();

    const updatedTreatment = await Treatment.findById(treatment._id)
      .populate('patient', 'firstName lastName')
      .populate('dentist', 'firstName lastName')
      .populate('progressNotes.dentist', 'firstName lastName');

    res.json({
      success: true,
      message: 'Progress notu başarıyla eklendi',
      data: updatedTreatment
    });

  } catch (error) {
    console.error('Progress notu ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Progress notu eklenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Hasta tedavi geçmişini getir
export const getPatientTreatmentHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.permissions.includes('treatments.read')) {
      return res.status(403).json({
        success: false,
        message: 'Tedavi geçmişi görüntüleme yetkiniz yok'
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

    const treatments = await Treatment.find({ patient: patientId })
      .populate('dentist', 'firstName lastName licenseNumber')
      .populate('appointment', 'dateTime')
      .sort({ createdAt: -1 });

    // İstatistikleri hesapla
    const stats = {
      totalTreatments: treatments.length,
      completedTreatments: treatments.filter(t => t.status === 'completed').length,
      inProgressTreatments: treatments.filter(t => t.status === 'in_progress').length,
      plannedTreatments: treatments.filter(t => t.status === 'planned').length,
      totalCost: treatments.reduce((sum, t) => sum + ((t as any).totalCost || 0), 0),
      treatmentTypes: treatments.reduce((acc, t) => {
        acc[t.treatmentType] = (acc[t.treatmentType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json({
      success: true,
      data: {
        patient: {
          id: patient._id,
          name: `${patient.firstName} ${patient.lastName}`,
          phone: patient.phone,
          dateOfBirth: patient.dateOfBirth
        },
        treatments,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Hasta tedavi geçmişi getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tedavi geçmişi getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Tedavi istatistiklerini getir
export const getTreatmentStatistics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.permissions.includes('treatments.read')) {
      return res.status(403).json({
        success: false,
        message: 'Tedavi istatistikleri görüntüleme yetkiniz yok'
      });
    }

    const { startDate, endDate, dentist } = req.query as { startDate?: string; endDate?: string; dentist?: string };

    const filter: any = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (dentist) filter.dentist = dentist;

    const stats = await Treatment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTreatments: { $sum: 1 },
          completedTreatments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$totalCost' },
          avgTreatmentCost: { $avg: '$totalCost' }
        }
      }
    ]);

    const treatmentTypeStats = await Treatment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$treatmentType',
          count: { $sum: 1 },
          totalCost: { $sum: '$totalCost' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const monthlyStats = await Treatment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalCost' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalTreatments: 0,
          completedTreatments: 0,
          totalRevenue: 0,
          avgTreatmentCost: 0
        },
        treatmentTypes: treatmentTypeStats,
        monthlyTrends: monthlyStats
      }
    });

  } catch (error) {
    console.error('Tedavi istatistikleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tedavi istatistikleri getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};