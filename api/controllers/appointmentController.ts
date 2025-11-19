import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import Appointment from '../models/Appointment';
import Patient from '../models/Patient';
import User from '../models/User';
import { createAppointmentSchema, updateAppointmentSchema, searchAppointmentsSchema, availableSlotsSchema } from '../validators/appointment';


interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    permissions: string[];
  };
}

// Randevu oluştur
export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    // Validasyon
    const validationResult = createAppointmentSchema.validate(req.body);
    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: validationResult.error.details
      });
    }

    const { patientId, dentistId, appointmentDate, duration, treatmentType, notes } = validationResult.value;

    // Yetki kontrolü
    if (!req.user || !req.user.permissions.includes('appointments.create')) {
      return res.status(403).json({
        success: false,
        message: 'Randevu oluşturma yetkiniz yok'
      });
    }

    // Hasta kontrolü
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Hasta bulunamadı'
      });
    }

    // Diş hekimi kontrolü
    const dentist = await User.findOne({ _id: dentistId, role: 'dentist', isActive: true });
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: 'Diş hekimi bulunamadı veya aktif değil'
      });
    }

    // Çakışma kontrolü
    const appointmentStart = new Date(appointmentDate);
    const appointmentEnd = new Date(appointmentStart.getTime() + duration * 60000);

    const conflictingAppointment = await Appointment.findOne({
      dentistId,
      status: { $in: ['scheduled', 'confirmed'] },
      $or: [
        {
          appointmentDate: { $lte: appointmentStart },
          $expr: {
            $gt: [
              { $add: ['$appointmentDate', { $multiply: ['$duration', 60000] }] },
              appointmentStart
            ]
          }
        },
        {
          appointmentDate: { $gte: appointmentStart, $lt: appointmentEnd }
        }
      ]
    });

    if (conflictingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'Seçilen saat aralığında diş hekimi başka bir randevuya sahip'
      });
    }

    // Randevu oluştur
    const appointment = new Appointment({
      patientId,
      dentistId,
      appointmentDate,
      duration,
      treatmentType,
      notes,
      status: 'scheduled',
      createdBy: req.user.id,
      createdAt: new Date()
    });

    await appointment.save();

    // Populate işlemi
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName phone')
      .populate('dentistId', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Randevu başarıyla oluşturuldu',
      data: populatedAppointment
    });

  } catch (error) {
    console.error('Randevu oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Randevu oluşturulurken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Randevuları listele
export const getAppointments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.permissions.includes('appointments.read')) {
      return res.status(403).json({
        success: false,
        message: 'Randevu görüntüleme yetkiniz yok'
      });
    }

    const validationResult = searchAppointmentsSchema.validate(req.query);
    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: 'Arama parametreleri geçersiz',
        errors: validationResult.error.details
      });
    }

    const { 
      patientId, 
      dentistId, 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10,
      sortBy = 'appointmentDate',
      sortOrder = 'asc'
    } = validationResult.value;

    // Filtre oluştur
    const filter: any = {};
    
    if (patientId) filter.patientId = patientId;
    if (dentistId) filter.dentistId = dentistId;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.appointmentDate = {};
      if (startDate) filter.appointmentDate.$gte = new Date(startDate);
      if (endDate) filter.appointmentDate.$lte = new Date(endDate);
    }

    // Sayfalama
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'firstName lastName phone')
      .populate('dentistId', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Randevu listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Randevular listelenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Tek randevu getir
export const getAppointment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.permissions.includes('appointments.read')) {
      return res.status(403).json({
        success: false,
        message: 'Randevu görüntüleme yetkiniz yok'
      });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'firstName lastName phone email dateOfBirth')
      .populate('dentistId', 'firstName lastName licenseNumber')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı'
      });
    }

    res.json({
      success: true,
      data: appointment
    });

  } catch (error) {
    console.error('Randevu getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Randevu getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Randevu güncelle
export const updateAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const validationResult = updateAppointmentSchema.validate(req.body);
    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: validationResult.error.details
      });
    }

    if (!req.user || !req.user.permissions.includes('appointments.update')) {
      return res.status(403).json({
        success: false,
        message: 'Randevu güncelleme yetkiniz yok'
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı'
      });
    }

    const { dateTime, duration, status, notes } = validationResult.value;

    // Tarih değişikliği varsa çakışma kontrolü
    if (dateTime || duration) {
      const newStartDate = dateTime ? new Date(dateTime) : appointment.dateTime;
      const newDuration = duration || appointment.duration;
      const newEndDate = new Date(newStartDate.getTime() + newDuration * 60000);

      const conflictingAppointment = await Appointment.findOne({
        _id: { $ne: appointment._id },
        dentistId: appointment.dentistId,
        status: { $in: ['scheduled', 'confirmed'] },
        $or: [
          {
            appointmentDate: { $lte: newStartDate },
            $expr: {
              $gt: [
                { $add: ['$appointmentDate', { $multiply: ['$duration', 60000] }] },
                newStartDate
              ]
            }
          },
          {
            appointmentDate: { $gte: newStartDate, $lt: newEndDate }
          }
        ]
      });

      if (conflictingAppointment) {
        return res.status(409).json({
          success: false,
          message: 'Seçilen saat aralığında diş hekimi başka bir randevuya sahip'
        });
      }
    }

    // Randevu güncelle
    Object.assign(appointment, {
      ...validationResult.value,
      updatedBy: req.user.id,
      updatedAt: new Date()
    });

    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName phone')
      .populate('dentistId', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Randevu başarıyla güncellendi',
      data: updatedAppointment
    });

  } catch (error) {
    console.error('Randevu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Randevu güncellenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Randevu sil
export const deleteAppointment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.permissions.includes('appointments.delete')) {
      return res.status(403).json({
        success: false,
        message: 'Randevu silme yetkiniz yok'
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı'
      });
    }

    // Sadece planlanmış randevular silinebilir
    if (appointment.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Sadece planlanmış randevular silinebilir'
      });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Randevu başarıyla silindi'
    });

  } catch (error) {
    console.error('Randevu silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Randevu silinirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Müsait saatleri getir
export const getAvailableSlots = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.permissions.includes('appointments.read')) {
      return res.status(403).json({
        success: false,
        message: 'Randevu görüntüleme yetkiniz yok'
      });
    }

    const validationResult = availableSlotsSchema.validate(req.query);
    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: validationResult.error.details
      });
    }

    const { dentistId, date, duration = 30 } = validationResult.value;

    // Diş hekimi kontrolü
    const dentist = await User.findOne({ _id: dentistId, role: 'dentist', isActive: true });
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: 'Diş hekimi bulunamadı veya aktif değil'
      });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 8, 0); // 08:00
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 18, 0); // 18:00

    // O günkü randevuları getir
    const appointments = await Appointment.find({
      dentistId,
      appointmentDate: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      status: { $in: ['scheduled', 'confirmed'] }
    }).sort({ appointmentDate: 1 });

    // Müsait saatleri hesapla
    const availableSlots = [];
    const slotDuration = duration; // dakika
    
    for (let time = new Date(startOfDay); time < endOfDay; time = new Date(time.getTime() + slotDuration * 60000)) {
      const slotEnd = new Date(time.getTime() + slotDuration * 60000);
      
      // Bu saat aralığında çakışan randevu var mı?
      const hasConflict = appointments.some(appointment => {
        const appointmentStart = appointment.dateTime;
        const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration * 60000);
        
        return (time < appointmentEnd && slotEnd > appointmentStart);
      });

      if (!hasConflict) {
        availableSlots.push({
          startTime: time.toISOString(),
          endTime: slotEnd.toISOString(),
          displayTime: time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        });
      }
    }

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString(),
        availableSlots,
        totalSlots: availableSlots.length
      }
    });

  } catch (error) {
    console.error('Müsait saatleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Müsait saatler getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Randevu durumunu güncelle
export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.permissions.includes('appointments.update')) {
      return res.status(403).json({
        success: false,
        message: 'Randevu güncelleme yetkiniz yok'
      });
    }

    const { status } = req.body;
    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz randevu durumu'
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı'
      });
    }

    // Durum geçiş kontrolü
    const validTransitions: Record<string, string[]> = {
      'scheduled': ['confirmed', 'cancelled'],
      'confirmed': ['completed', 'cancelled', 'no-show'],
      'completed': [],
      'cancelled': ['scheduled'],
      'no-show': ['scheduled']
    };

    if (!validTransitions[appointment.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Geçersiz durum geçişi: ${appointment.status} → ${status}`
      });
    }

    appointment.status = status;
    appointment.updatedBy = new mongoose.Types.ObjectId(req.user.id);
    appointment.updatedAt = new Date();

    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName phone')
      .populate('dentistId', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Randevu durumu başarıyla güncellendi',
      data: updatedAppointment
    });

  } catch (error) {
    console.error('Randevu durumu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Randevu durumu güncellenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Bugünkü randevuları getir
export const getTodayAppointments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.permissions.includes('appointments.read')) {
      return res.status(403).json({
        success: false,
        message: 'Randevu görüntüleme yetkiniz yok'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filter: any = {
      appointmentDate: {
        $gte: today,
        $lt: tomorrow
      }
    };

    // Diş hekimi ise sadece kendi randevularını görsün
    if (req.user.role === 'dentist') {
      filter.dentistId = req.user.id;
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'firstName lastName phone')
      .populate('dentistId', 'firstName lastName')
      .sort({ appointmentDate: 1 });

    res.json({
      success: true,
      data: appointments
    });

  } catch (error) {
    console.error('Bugünkü randevuları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bugünkü randevular getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};