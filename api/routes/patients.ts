import express from 'express';
import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getPatientMedicalHistory,
  addMedicalHistory,
  searchPatients
} from '../controllers/patientController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All patient routes require authentication
router.use(authenticate);

// Patient CRUD routes
router.post('/', authorize(['patients.create']), createPatient);
router.get('/', authorize(['patients.read']), getPatients);
router.get('/search', authorize(['patients.read']), searchPatients);
router.get('/:id', authorize(['patients.read']), getPatientById);
router.put('/:id', authorize(['patients.update']), updatePatient);
router.delete('/:id', authorize(['patients.delete']), deletePatient);

// Medical history routes
router.get('/:id/medical-history', authorize(['patients.read']), getPatientMedicalHistory);
router.post('/:id/medical-history', authorize(['patients.update']), addMedicalHistory);

export default router;