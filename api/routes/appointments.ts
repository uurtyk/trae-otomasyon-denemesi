import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  getAvailableSlots,
  updateAppointmentStatus,
  getTodayAppointments
} from '../controllers/appointmentController';

const router = express.Router();

// Tüm rotalarda kimlik doğrulama gereklidir
router.use(authenticate);

// Randevu rotaları
router.post('/', createAppointment);
router.get('/', getAppointments);
router.get('/today', getTodayAppointments);
router.get('/available-slots', getAvailableSlots);
router.get('/:id', getAppointment);
router.put('/:id', updateAppointment);
router.patch('/:id/status', updateAppointmentStatus);
router.delete('/:id', deleteAppointment);

export default router;