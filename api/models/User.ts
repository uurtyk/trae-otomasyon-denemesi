import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'dentist' | 'assistant' | 'receptionist' | 'admin';
  licenseNumber?: string;
  isActive: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
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
  role: {
    type: String,
    enum: ['dentist', 'assistant', 'receptionist', 'admin'],
    required: true
  },
  licenseNumber: {
    type: String,
    sparse: true // Allow multiple nulls but unique non-null values
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: [{
    type: String,
    enum: [
      'patients.create',
      'patients.read',
      'patients.update',
      'patients.delete',
      'appointments.create',
      'appointments.read',
      'appointments.update',
      'appointments.delete',
      'treatments.create',
      'treatments.read',
      'treatments.update',
      'treatments.delete',
      'invoices.create',
      'invoices.read',
      'invoices.update',
      'invoices.delete',
      'inventory.manage',
      'reports.view',
      'users.manage',
      'settings.manage'
    ]
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
export { User };