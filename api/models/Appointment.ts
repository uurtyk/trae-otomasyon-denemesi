import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  dentistId: mongoose.Types.ObjectId;
  dateTime: Date;
  endTime: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  treatmentType: string;
  notes?: string;
  remindersSent: Array<{
    type: 'email' | 'sms';
    sentAt: Date;
  }>;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  dentistId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 15, // Minimum 15 minutes
    max: 480 // Maximum 8 hours
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  treatmentType: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  remindersSent: [{
    type: {
      type: String,
      enum: ['email', 'sms'],
      required: true
    },
    sentAt: {
      type: Date,
      required: true
    }
  }],
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create compound indexes for efficient querying
appointmentSchema.index({ patientId: 1, dateTime: 1 });
appointmentSchema.index({ dentistId: 1, dateTime: 1 });
appointmentSchema.index({ dateTime: 1 });
appointmentSchema.index({ status: 1 });

// Virtual for formatted duration
appointmentSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  
  if (hours === 0) {
    return `${minutes} dakika`;
  } else if (minutes === 0) {
    return `${hours} saat`;
  } else {
    return `${hours} saat ${minutes} dakika`;
  }
});

// Method to check if appointment overlaps with another
appointmentSchema.methods.overlapsWith = function(otherAppointment: IAppointment): boolean {
  const thisStart = this.dateTime.getTime();
  const thisEnd = this.endTime.getTime();
  const otherStart = otherAppointment.dateTime.getTime();
  const otherEnd = otherAppointment.endTime.getTime();
  
  return (thisStart < otherEnd && thisEnd > otherStart);
};

// Static method to find available time slots
appointmentSchema.statics.findAvailableSlots = async function(
  dentistId: string,
  date: Date,
  duration: number = 30
): Promise<{ start: Date; end: Date }[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(8, 0, 0, 0); // 8 AM
  
  const endOfDay = new Date(date);
  endOfDay.setHours(18, 0, 0, 0); // 6 PM
  
  const existingAppointments = await this.find({
    dentistId,
    dateTime: {
      $gte: startOfDay,
      $lt: endOfDay
    },
    status: { $in: ['scheduled', 'confirmed'] }
  }).sort({ dateTime: 1 });
  
  const availableSlots: { start: Date; end: Date }[] = [];
  let currentTime = new Date(startOfDay);
  
  for (const appointment of existingAppointments) {
    const appointmentStart = new Date(appointment.dateTime);
    const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration * 60000);
    
    // Add slot before this appointment
    while (currentTime.getTime() + duration * 60000 <= appointmentStart.getTime()) {
      availableSlots.push({
        start: new Date(currentTime),
        end: new Date(currentTime.getTime() + duration * 60000)
      });
      currentTime = new Date(currentTime.getTime() + duration * 60000);
    }
    
    // Move current time to after this appointment
    currentTime = new Date(Math.max(currentTime.getTime(), appointmentEnd.getTime()));
  }
  
  // Add remaining slots after last appointment
  while (currentTime.getTime() + duration * 60000 <= endOfDay.getTime()) {
    availableSlots.push({
      start: new Date(currentTime),
      end: new Date(currentTime.getTime() + duration * 60000)
    });
    currentTime = new Date(currentTime.getTime() + duration * 60000);
  }
  
  return availableSlots;
};

export default mongoose.model<IAppointment>('Appointment', appointmentSchema);