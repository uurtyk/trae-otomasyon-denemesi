import mongoose, { Schema, Document } from 'mongoose';

export interface ITreatment extends Document {
  patient: mongoose.Types.ObjectId;
  dentist: mongoose.Types.ObjectId;
  appointment?: mongoose.Types.ObjectId;
  treatmentType: string;
  description: string;
  teeth: Array<{
    toothNumber: string;
    surface?: string;
    condition: string;
  }>;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  totalCost: number;
  paidAmount: number;
  remainingAmount: number;
  progressNotes: Array<{
    date: Date;
    note: string;
    dentist: mongoose.Types.ObjectId;
  }>;
  materials: Array<{
    material: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
  prescriptions: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    prescribedDate: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TreatmentSchema = new Schema<ITreatment>({
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  dentist: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  treatmentType: {
    type: String,
    required: true,
    enum: [
      'checkup',
      'cleaning',
      'filling',
      'root_canal',
      'extraction',
      'crown',
      'bridge',
      'implant',
      'orthodontics',
      'whitening',
      'periodontics',
      'oral_surgery',
      'other'
    ]
  },
  description: {
    type: String,
    required: true
  },
  teeth: [{
    toothNumber: {
      type: String,
      required: true
    },
    surface: String,
    condition: {
      type: String,
      required: true,
      enum: ['healthy', 'cavity', 'filled', 'missing', 'impacted', 'crowded', 'other']
    }
  }],
  status: {
    type: String,
    required: true,
    enum: ['planned', 'in_progress', 'completed', 'cancelled'],
    default: 'planned'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    default: function() {
      return this.totalCost - this.paidAmount;
    }
  },
  progressNotes: [{
    date: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      required: true
    },
    dentist: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  materials: [{
    material: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  prescriptions: [{
    medication: {
      type: String,
      required: true
    },
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    prescribedDate: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
TreatmentSchema.index({ patient: 1, status: 1 });
TreatmentSchema.index({ dentist: 1, status: 1 });
TreatmentSchema.index({ startDate: 1 });
TreatmentSchema.index({ status: 1 });

// Pre-save middleware to calculate remaining amount
TreatmentSchema.pre('save', function(next) {
  this.remainingAmount = this.totalCost - this.paidAmount;
  next();
});

export const Treatment = mongoose.model<ITreatment>('Treatment', TreatmentSchema);