import { Request, Response } from 'express';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import { Treatment } from '../models/Treatment.js';
import { Invoice } from '../models/Invoice.js';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    // Get total patients count
    const totalPatients = await Patient.countDocuments({ isActive: true });

    // Get today's appointments count
    const todayAppointments = await Appointment.countDocuments({
      date: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    // Get pending appointments count (future appointments)
    const pendingAppointments = await Appointment.countDocuments({
      date: { $gte: tomorrow },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    // Get monthly revenue
    const monthlyRevenueResult = await Invoice.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth
          },
          status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const monthlyRevenue = monthlyRevenueResult[0]?.totalRevenue || 0;

    // Get recent appointments (next 5 appointments)
    const recentAppointments = await Appointment.find({
      date: { $gte: today },
      status: { $in: ['scheduled', 'confirmed'] }
    })
      .populate('patient', 'firstName lastName')
      .sort({ date: 1, time: 1 })
      .limit(5)
      .select('_id patient date time status treatmentType');

    // Get pending treatments (ongoing treatments)
    const pendingTreatments = await Treatment.find({
      status: 'in_progress'
    })
      .populate('patient', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id patient treatmentType totalCost status');

    res.json({
      success: true,
      data: {
        totalPatients,
        todayAppointments,
        pendingAppointments,
        monthlyRevenue,
        recentAppointments,
        pendingTreatments
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Dashboard istatistikleri alınamadı'
    });
  }
};

export const getDashboardAppointments = async (req: Request, res: Response) => {
  try {
    const { date, status, limit = 10 } = req.query;
    
    let query: any = {};
    
    if (date) {
      const targetDate = new Date(date as string);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.date = {
        $gte: targetDate,
        $lt: nextDay
      };
    }
    
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName phone email')
      .populate('dentist', 'firstName lastName')
      .sort({ date: 1, time: 1 })
      .limit(Number(limit))
      .select('_id patient dentist date time status treatmentType notes');

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Dashboard appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Randevular alınamadı'
    });
  }
};

export const getDashboardRevenue = async (req: Request, res: Response) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year
    
    let startDate: Date;
    let groupBy: any;
    
    const today = new Date();
    
    switch (period) {
      case 'day':
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    const revenueData = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'paid'
        }
      },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$totalAmount' },
          invoiceCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error('Dashboard revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Gelir verileri alınamadı'
    });
  }
};