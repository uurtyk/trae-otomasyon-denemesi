import { Request, Response } from 'express';
import { Patient } from '../models';
import { createPatientSchema, updatePatientSchema, searchPatientSchema } from '../validators/patient';
import { AuthenticatedRequest } from '../middleware/auth';

export const createPatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = createPatientSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message
      });
      return;
    }

    // Check if patient already exists by phone or email
    const existingPatient = await Patient.findOne({
      $or: [
        { phone: value.phone },
        ...(value.email ? [{ email: value.email }] : [])
      ]
    });

    if (existingPatient) {
      res.status(400).json({
        success: false,
        message: 'Patient already exists with this phone number or email'
      });
      return;
    }

    const patient = new Patient(value);
    await patient.save();

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getPatients = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = searchPatientSchema.validate(req.query);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message
      });
      return;
    }

    const { search, page, limit, sortBy, sortOrder } = value;
    const skip = (page - 1) * limit;

    // Build search query
    let query = {};
    if (search) {
      query = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          ...(search.includes('@') ? [{ email: { $regex: search, $options: 'i' } }] : [])
        ]
      };
    }

    // Build sort options
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const patients = await Patient.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Patient.countDocuments(query);

    res.json({
      success: true,
      data: {
        patients,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getPatientById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const patient = await Patient.findById(id);
    
    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
      return;
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Get patient by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updatePatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error, value } = updatePatientSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message
      });
      return;
    }

    // Check if patient exists
    const patient = await Patient.findById(id);
    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
      return;
    }

    // Check for duplicate phone or email
    if (value.phone || value.email) {
      const duplicateCheck = await Patient.findOne({
        _id: { $ne: id },
        $or: [
          ...(value.phone ? [{ phone: value.phone }] : []),
          ...(value.email ? [{ email: value.email }] : [])
        ]
      });

      if (duplicateCheck) {
        res.status(400).json({
          success: false,
          message: 'Another patient already exists with this phone number or email'
        });
        return;
      }
    }

    // Update patient
    Object.assign(patient, value);
    await patient.save();

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: patient
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deletePatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const patient = await Patient.findById(id);
    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
      return;
    }

    await Patient.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getPatientMedicalHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const patient = await Patient.findById(id).select('medicalHistory');
    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
      return;
    }

    res.json({
      success: true,
      data: patient.medicalHistory
    });
  } catch (error) {
    console.error('Get patient medical history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const addMedicalHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { condition, diagnosedDate, status, notes } = req.body;

    const patient = await Patient.findById(id);
    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
      return;
    }

    patient.medicalHistory.push({
      condition,
      diagnosedDate,
      status,
      notes
    });

    await patient.save();

    res.json({
      success: true,
      message: 'Medical history added successfully',
      data: patient.medicalHistory
    });
  } catch (error) {
    console.error('Add medical history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const searchPatients = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
      return;
    }

    const patients = await Patient.find({
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    })
    .select('firstName lastName phone email dateOfBirth')
    .limit(10);

    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    console.error('Search patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};