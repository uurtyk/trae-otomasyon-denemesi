import Joi from 'joi';

const addressSchema = Joi.object({
  street: Joi.string().required().messages({
    'string.empty': 'Street address is required'
  }),
  city: Joi.string().required().messages({
    'string.empty': 'City is required'
  }),
  state: Joi.string().required().messages({
    'string.empty': 'State is required'
  }),
  zipCode: Joi.string().required().messages({
    'string.empty': 'ZIP code is required'
  })
});

const medicalHistorySchema = Joi.object({
  condition: Joi.string().required().messages({
    'string.empty': 'Medical condition is required'
  }),
  diagnosedDate: Joi.date().required().messages({
    'date.base': 'Diagnosed date must be a valid date',
    'any.required': 'Diagnosed date is required'
  }),
  status: Joi.string().valid('active', 'resolved', 'chronic').required().messages({
    'any.only': 'Status must be one of: active, resolved, chronic',
    'string.empty': 'Status is required'
  }),
  notes: Joi.string().optional().allow('')
});

const emergencyContactSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Emergency contact name is required'
  }),
  phone: Joi.string().required().messages({
    'string.empty': 'Emergency contact phone is required'
  }),
  relationship: Joi.string().required().messages({
    'string.empty': 'Relationship is required'
  })
});

const insuranceSchema = Joi.object({
  provider: Joi.string().required().messages({
    'string.empty': 'Insurance provider is required'
  }),
  policyNumber: Joi.string().required().messages({
    'string.empty': 'Policy number is required'
  }),
  groupNumber: Joi.string().optional().allow(''),
  validUntil: Joi.date().required().messages({
    'date.base': 'Valid until date must be a valid date',
    'any.required': 'Valid until date is required'
  })
});

export const createPatientSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
    'string.empty': 'First name is required'
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
    'string.empty': 'Last name is required'
  }),
  email: Joi.string().email().optional().allow('').messages({
    'string.email': 'Please provide a valid email address'
  }),
  phone: Joi.string().required().messages({
    'string.empty': 'Phone number is required'
  }),
  dateOfBirth: Joi.date().max('now').required().messages({
    'date.max': 'Date of birth cannot be in the future',
    'date.base': 'Date of birth must be a valid date',
    'any.required': 'Date of birth is required'
  }),
  gender: Joi.string().valid('male', 'female', 'other').optional().messages({
    'any.only': 'Gender must be one of: male, female, other'
  }),
  address: addressSchema.required(),
  medicalHistory: Joi.array().items(medicalHistorySchema).optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  emergencyContact: emergencyContactSchema.required(),
  bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional().messages({
    'any.only': 'Blood type must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-'
  }),
  insurance: insuranceSchema.optional()
});

export const updatePatientSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters'
  }),
  lastName: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters'
  }),
  email: Joi.string().email().optional().allow('').messages({
    'string.email': 'Please provide a valid email address'
  }),
  phone: Joi.string().optional().messages({
    'string.empty': 'Phone number cannot be empty if provided'
  }),
  dateOfBirth: Joi.date().max('now').optional().messages({
    'date.max': 'Date of birth cannot be in the future',
    'date.base': 'Date of birth must be a valid date'
  }),
  gender: Joi.string().valid('male', 'female', 'other').optional().messages({
    'any.only': 'Gender must be one of: male, female, other'
  }),
  address: addressSchema.optional(),
  medicalHistory: Joi.array().items(medicalHistorySchema).optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  emergencyContact: emergencyContactSchema.optional(),
  bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional().messages({
    'any.only': 'Blood type must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-'
  }),
  insurance: insuranceSchema.optional()
});

export const searchPatientSchema = Joi.object({
  search: Joi.string().optional().allow(''),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  sortBy: Joi.string().valid('firstName', 'lastName', 'dateOfBirth', 'createdAt').optional().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc')
});