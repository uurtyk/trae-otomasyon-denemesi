import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  updateInvoiceStatus,
  createPayment,
  getPayments,
  getPatientBalance,
  getFinancialSummary
} from '../controllers/invoiceController';

const router = express.Router();

// Tüm rotalarda kimlik doğrulama gereklidir
router.use(authenticate);

// Fatura rotaları
router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/summary', getFinancialSummary);
router.get('/patient/:patientId/balance', getPatientBalance);
router.get('/:id', getInvoice);
router.put('/:id', updateInvoice);
router.patch('/:id/status', updateInvoiceStatus);

// Ödeme rotaları
router.post('/payments', createPayment);
router.get('/payments', getPayments);

export default router;