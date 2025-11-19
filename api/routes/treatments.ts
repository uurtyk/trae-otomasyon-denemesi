import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createTreatment,
  getTreatments,
  getTreatment,
  updateTreatment,
  updateDentalChart,
  addProgressNote,
  getPatientTreatmentHistory,
  getTreatmentStatistics
} from '../controllers/treatmentController';

const router = express.Router();

// Tüm rotalarda kimlik doğrulama gereklidir
router.use(authenticate);

// Tedavi rotaları
router.post('/', createTreatment);
router.get('/', getTreatments);
router.get('/statistics', getTreatmentStatistics);
router.get('/patient/:patientId/history', getPatientTreatmentHistory);
router.get('/:id', getTreatment);
router.put('/:id', updateTreatment);
router.patch('/:id/progress-note', addProgressNote);
router.patch('/patient/:patientId/dental-chart', updateDentalChart);

export default router;