import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth: Date;
  gender?: 'male' | 'female' | 'other';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  medicalHistory: Array<{
    condition: string;
    diagnosedDate: Date;
    status: 'active' | 'resolved' | 'chronic';
    notes?: string;
  }>;
  allergies: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  dentalHistory: Array<{
    treatmentId: mongoose.Types.ObjectId;
    date: Date;
    notes: string;
  }>;
  bloodType?: string;
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    validUntil: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      required: true,
      trim: true
    }
  },
  medicalHistory: [{
    condition: {
      type: String,
      required: true,
      trim: true
    },
    diagnosedDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'chronic'],
      required: true
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  allergies: [{
    type: String,
    trim: true
  }],
  emergencyContact: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    relationship: {
      type: String,
      required: true,
      trim: true
    }
  },
  dentalHistory: [{
    treatmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Treatment'
    },
    date: {
      type: Date,
      required: true
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  insurance: {
    provider: {
      type: String,
      trim: true
    },
    policyNumber: {
      type: String,
      trim: true
    },
    groupNumber: {
      type: String,
      trim: true
    },
    validUntil: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Create compound index for name search
patientSchema.index({ firstName: 1, lastName: 1 });
patientSchema.index({ phone: 1 });
patientSchema.index({ email: 1 });

// Virtual for full name
patientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
patientSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

export default mongoose.model<IPatient>('Patient', patientSchema);