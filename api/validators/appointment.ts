import Joi from 'joi';

export const createAppointmentSchema = Joi.object({
  patientId: Joi.string().required().messages({
    'string.empty': 'Patient ID is required'
  }),
  dentistId: Joi.string().required().messages({
    'string.empty': 'Dentist ID is required'
  }),
  dateTime: Joi.date().min('now').required().messages({
    'date.min': 'Appointment date cannot be in the past',
    'date.base': 'Appointment date must be a valid date',
    'any.required': 'Appointment date is required'
  }),
  duration: Joi.number().integer().min(15).max(480).required().messages({
    'number.min': 'Duration must be at least 15 minutes',
    'number.max': 'Duration cannot exceed 8 hours (480 minutes)',
    'number.integer': 'Duration must be a whole number',
    'any.required': 'Duration is required'
  }),
  treatmentType: Joi.string().required().messages({
    'string.empty': 'Treatment type is required'
  }),
  notes: Joi.string().optional().allow('')
});

export const updateAppointmentSchema = Joi.object({
  patientId: Joi.string().optional(),
  dentistId: Joi.string().optional(),
  dateTime: Joi.date().min('now').optional().messages({
    'date.min': 'Appointment date cannot be in the past',
    'date.base': 'Appointment date must be a valid date'
  }),
  duration: Joi.number().integer().min(15).max(480).optional().messages({
    'number.min': 'Duration must be at least 15 minutes',
    'number.max': 'Duration cannot exceed 8 hours (480 minutes)',
    'number.integer': 'Duration must be a whole number'
  }),
  status: Joi.string().valid('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show').optional().messages({
    'any.only': 'Status must be one of: scheduled, confirmed, completed, cancelled, no-show'
  }),
  treatmentType: Joi.string().optional(),
  notes: Joi.string().optional().allow('')
});

export const searchAppointmentsSchema = Joi.object({
  date: Joi.date().optional().messages({
    'date.base': 'Date must be a valid date'
  }),
  dentistId: Joi.string().optional(),
  patientId: Joi.string().optional(),
  status: Joi.string().valid('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show').optional().messages({
    'any.only': 'Status must be one of: scheduled, confirmed, completed, cancelled, no-show'
  }),
  startDate: Joi.date().optional().messages({
    'date.base': 'Start date must be a valid date'
  }),
  endDate: Joi.date().optional().messages({
    'date.base': 'End date must be a valid date'
  }),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  sortBy: Joi.string().valid('dateTime', 'createdAt', 'status').optional().default('dateTime'),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('asc')
});

export const availableSlotsSchema = Joi.object({
  dentistId: Joi.string().required().messages({
    'string.empty': 'Dentist ID is required'
  }),
  date: Joi.date().required().messages({
    'date.base': 'Date must be a valid date',
    'any.required': 'Date is required'
  }),
  duration: Joi.number().integer().min(15).max(120).optional().default(30).messages({
    'number.min': 'Duration must be at least 15 minutes',
    'number.max': 'Duration cannot exceed 2 hours (120 minutes)',
    'number.integer': 'Duration must be a whole number'
  })
});