import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getDashboardStats, getDashboardAppointments, getDashboardRevenue } from '../controllers/dashboardController.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// Dashboard statistics
router.get('/stats', getDashboardStats);

// Dashboard appointments
router.get('/appointments', getDashboardAppointments);

// Dashboard revenue analytics
router.get('/revenue', getDashboardRevenue);

export default router;