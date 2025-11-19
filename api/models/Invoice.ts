import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  invoiceNumber: string;
  patient: mongoose.Types.ObjectId;
  treatments: Array<{
    treatment: mongoose.Types.ObjectId;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  dueDate: Date;
  paymentDate?: Date;
  paymentMethod?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  payments: Array<{
    date: Date;
    amount: number;
    method: string;
    reference?: string;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  treatments: [{
    treatment: {
      type: Schema.Types.ObjectId,
      ref: 'Treatment'
    },
    description: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
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
      return this.totalAmount - this.paidAmount;
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'],
    default: 'draft'
  },
  dueDate: {
    type: Date,
    required: true
  },
  paymentDate: Date,
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'bank_transfer', 'check', 'other']
  },
  notes: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payments: [{
    date: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    method: {
      type: String,
      required: true,
      enum: ['cash', 'credit_card', 'bank_transfer', 'check', 'other']
    },
    reference: String,
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes
InvoiceSchema.index({ patient: 1, status: 1 });
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ dueDate: 1 });
InvoiceSchema.index({ createdAt: 1 });

// Pre-save middleware to calculate remaining amount
InvoiceSchema.pre('save', function(next) {
  this.remainingAmount = this.totalAmount - this.paidAmount;
  
  // Auto-update status based on payment
  if (this.paidAmount === 0) {
    this.status = this.status === 'draft' ? 'draft' : 'sent';
  } else if (this.paidAmount < this.totalAmount) {
    this.status = 'partial';
  } else if (this.paidAmount >= this.totalAmount) {
    this.status = 'paid';
    this.paymentDate = this.paymentDate || new Date();
  }
  
  next();
});

// Generate invoice number
InvoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const lastInvoice = await mongoose.model('Invoice')
      .findOne({})
      .sort({ createdAt: -1 })
      .select('invoiceNumber');
    
    let lastNumber = 0;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
      if (match) {
        lastNumber = parseInt(match[1]);
      }
    }
    
    this.invoiceNumber = `INV-${String(lastNumber + 1).padStart(6, '0')}`;
  }
  
  next();
});

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);