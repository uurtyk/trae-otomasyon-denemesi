import mongoose, { Document, Schema } from 'mongoose';

export interface IInventory extends Document {
  itemCode: string;
  itemName: string;
  category: 'materials' | 'tools' | 'medications' | 'consumables' | 'equipment';
  description?: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  unitCost: number;
  supplier: {
    name: string;
    contact?: string;
    email?: string;
  };
  expiryDate?: Date;
  batchNumber?: string;
  location?: string;
  lastRestocked?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>({
  itemCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['materials', 'tools', 'medications', 'consumables', 'equipment'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  minQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    contact: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    }
  },
  expiryDate: {
    type: Date
  },
  batchNumber: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  lastRestocked: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
inventorySchema.index({ itemCode: 1 });
inventorySchema.index({ itemName: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ quantity: 1 });
inventorySchema.index({ expiryDate: 1 });

// Virtual for total value
inventorySchema.virtual('totalValue').get(function() {
  return this.quantity * this.unitCost;
});

// Virtual for is low stock
inventorySchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.minQuantity;
});

// Virtual for days until expiry
inventorySchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Virtual for is expired
inventorySchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Method to update quantity
inventorySchema.methods.updateQuantity = function(quantityChange: number, operation: 'add' | 'subtract'): Promise<IInventory> {
  if (operation === 'add') {
    this.quantity += quantityChange;
  } else {
    this.quantity -= quantityChange;
  }
  
  if (this.quantity < 0) {
    throw new Error('Quantity cannot be negative');
  }
  
  return this.save();
};

// Method to restock
inventorySchema.methods.restock = function(quantity: number, unitCost?: number, batchNumber?: string): Promise<IInventory> {
  this.quantity += quantity;
  this.lastRestocked = new Date();
  
  if (unitCost) {
    this.unitCost = unitCost;
  }
  
  if (batchNumber) {
    this.batchNumber = batchNumber;
  }
  
  return this.save();
};

// Static method to get low stock items
inventorySchema.statics.getLowStockItems = function(): Promise<IInventory[]> {
  return this.find({
    $expr: { $lte: ['$quantity', '$minQuantity'] },
    isActive: true
  }).sort({ quantity: 1 });
};

// Static method to get expired items
inventorySchema.statics.getExpiredItems = function(): Promise<IInventory[]> {
  return this.find({
    expiryDate: { $lt: new Date() },
    isActive: true
  }).sort({ expiryDate: 1 });
};

// Static method to get expiring soon items (within 30 days)
inventorySchema.statics.getExpiringSoonItems = function(days: number = 30): Promise<IInventory[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    expiryDate: { $gte: new Date(), $lte: futureDate },
    isActive: true
  }).sort({ expiryDate: 1 });
};

// Static method to get inventory value summary
inventorySchema.statics.getInventoryValue = function(): Promise<{ totalValue: number; totalItems: number; lowStockCount: number }> {
  return this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: null,
        totalValue: { $sum: { $multiply: ['$quantity', '$unitCost'] } },
        totalItems: { $sum: 1 },
        lowStockCount: {
          $sum: {
            $cond: [{ $lte: ['$quantity', '$minQuantity'] }, 1, 0]
          }
        }
      }
    }
  ]).then(result => result[0] || { totalValue: 0, totalItems: 0, lowStockCount: 0 });
};

export default mongoose.model<IInventory>('Inventory', inventorySchema);