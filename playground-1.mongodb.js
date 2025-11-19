use('dental_automation');

function ensureCollection(name, options) {
  if (!db.getCollectionInfos({ name }).length) {
    db.createCollection(name, options || {});
  }
}

function ensureIndex(coll, keys, opts) {
  db.getCollection(coll).createIndex(keys, opts || {});
}

ensureCollection('Users');
ensureIndex('Users', { email: 1 }, { unique: true });
ensureIndex('Users', { role_id: 1 });
ensureIndex('Users', { is_active: 1 });

ensureCollection('Roles');
ensureIndex('Roles', { name: 1 }, { unique: true });

ensureCollection('Clinics');
ensureIndex('Clinics', { name: 1 }, { unique: true });
ensureIndex('Clinics', { tax_id: 1 });

ensureCollection('Branches');
ensureIndex('Branches', { clinic_id: 1, name: 1 }, { unique: true });

ensureCollection('Patients', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['first_name', 'last_name', 'clinic_id', 'branch_id', 'smsPermission', 'emailPermission', 'whatsappPermission', 'created_at', 'status'],
      properties: {
        first_name: { bsonType: 'string' },
        last_name: { bsonType: 'string' },
        full_name: { bsonType: 'string' },
        email: { bsonType: ['string', 'null'] },
        phone: { bsonType: ['string', 'null'] },
        national_id: { bsonType: ['string', 'null'] },
        birth_date: { bsonType: ['date', 'null'] },
        gender: { bsonType: ['string', 'null'] },
        address: { bsonType: ['string', 'null'] },
        clinic_id: { bsonType: 'objectId' },
        branch_id: { bsonType: 'objectId' },
        files: { bsonType: ['array', 'null'] },
        notes: { bsonType: ['array', 'null'] },
        consents: { bsonType: ['object', 'null'] },
        smsPermission: { bsonType: 'bool' },
        whatsappPermission: { bsonType: 'bool' },
        emailPermission: { bsonType: 'bool' },
        balance: { bsonType: ['double', 'int', 'decimal', 'null'] },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: ['date', 'null'] },
        status: { bsonType: 'string' }
      }
    }
  }
});
ensureIndex('Patients', { email: 1 }, { sparse: true });
ensureIndex('Patients', { national_id: 1 }, { unique: true, sparse: true });
ensureIndex('Patients', { clinic_id: 1, branch_id: 1 });
ensureIndex('Patients', { full_name: 1 });

ensureCollection('Appointments', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['patient_id', 'doctor_id', 'clinic_id', 'branch_id', 'start', 'end', 'status', 'created_at'],
      properties: {
        patient_id: { bsonType: 'objectId' },
        doctor_id: { bsonType: 'objectId' },
        clinic_id: { bsonType: 'objectId' },
        branch_id: { bsonType: 'objectId' },
        start: { bsonType: 'date' },
        end: { bsonType: 'date' },
        type: { bsonType: ['string', 'null'] },
        status: { bsonType: 'string' },
        room: { bsonType: ['string', 'null'] },
        notes: { bsonType: ['string', 'null'] },
        reminder_sent: { bsonType: ['bool', 'null'] },
        no_show: { bsonType: ['bool', 'null'] },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: ['date', 'null'] }
      }
    }
  }
});
ensureIndex('Appointments', { doctor_id: 1, start: 1 });
ensureIndex('Appointments', { branch_id: 1, start: 1 });
ensureIndex('Appointments', { patient_id: 1, start: 1 });

ensureCollection('TreatmentPlans');
ensureIndex('TreatmentPlans', { patient_id: 1, approved: 1 });

ensureCollection('Treatments');
ensureIndex('Treatments', { plan_id: 1 });

ensureCollection('Payments', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['patient_id', 'amount', 'currency', 'status', 'created_at'],
      properties: {
        patient_id: { bsonType: 'objectId' },
        treatment_plan_id: { bsonType: ['objectId', 'null'] },
        invoice_id: { bsonType: ['objectId', 'null'] },
        amount: { bsonType: ['double', 'int', 'decimal'] },
        currency: { bsonType: 'string' },
        method: { bsonType: ['string', 'null'] },
        provider: { bsonType: ['string', 'null'] },
        transaction_id: { bsonType: ['string', 'null'] },
        status: { bsonType: 'string' },
        due_date: { bsonType: ['date', 'null'] },
        paid_at: { bsonType: ['date', 'null'] },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: ['date', 'null'] }
      }
    }
  }
});
ensureIndex('Payments', { status: 1, due_date: 1 });
ensureIndex('Payments', { patient_id: 1 });

ensureCollection('Invoices', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['patient_id', 'clinic_id', 'number', 'date', 'total', 'status', 'created_at'],
      properties: {
        patient_id: { bsonType: 'objectId' },
        clinic_id: { bsonType: 'objectId' },
        branch_id: { bsonType: ['objectId', 'null'] },
        number: { bsonType: 'string' },
        date: { bsonType: 'date' },
        due_date: { bsonType: ['date', 'null'] },
        lines: { bsonType: ['array', 'null'] },
        subtotal: { bsonType: ['double', 'int', 'decimal', 'null'] },
        tax: { bsonType: ['double', 'int', 'decimal', 'null'] },
        total: { bsonType: ['double', 'int', 'decimal'] },
        e_invoice_id: { bsonType: ['string', 'null'] },
        pdf_url: { bsonType: ['string', 'null'] },
        status: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: ['date', 'null'] }
      }
    }
  }
});
ensureIndex('Invoices', { clinic_id: 1, number: 1 }, { unique: true });
ensureIndex('Invoices', { patient_id: 1, date: 1 });

ensureCollection('StockItems');
ensureIndex('StockItems', { clinic_id: 1, branch_id: 1, sku: 1 }, { unique: true });
ensureIndex('StockItems', { current_level: 1 });
ensureIndex('StockItems', { expiry_date: 1 });

ensureCollection('StockTransactions');
ensureIndex('StockTransactions', { item_id: 1, date: 1 });

ensureCollection('Files');
ensureIndex('Files', { patient_id: 1, created_at: 1 });

ensureCollection('Notes');
ensureIndex('Notes', { patient_id: 1, appointment_id: 1, is_private: 1 });

ensureCollection('AuditLogs');
ensureIndex('AuditLogs', { entity: 1, entity_id: 1, created_at: 1 });

const now = new Date();

const roleAdminId = db.Roles.insertOne({ name: 'Admin', permissions: ['*'], created_at: now, updated_at: now, status: 'active' }).insertedId;
const roleDoctorId = db.Roles.insertOne({ name: 'Doctor', permissions: ['appointments_read','appointments_write','treatments_write'], created_at: now, updated_at: now, status: 'active' }).insertedId;
const roleReceptionistId = db.Roles.insertOne({ name: 'Receptionist', permissions: ['patients_write','appointments_write'], created_at: now, updated_at: now, status: 'active' }).insertedId;
const roleFinanceId = db.Roles.insertOne({ name: 'Finance', permissions: ['payments_write','invoices_write'], created_at: now, updated_at: now, status: 'active' }).insertedId;
const roleStockId = db.Roles.insertOne({ name: 'Stock Manager', permissions: ['stock_write'], created_at: now, updated_at: now, status: 'active' }).insertedId;

const clinicId = db.Clinics.insertOne({ name: 'DigiDentiS Klinik', tax_id: '1234567890', address: 'İstanbul', city: 'İstanbul', country: 'TR', phone: '+902122223344', email: 'info@digidentis.com', owner: null, branches: [], settings: {}, created_at: now, updated_at: now, status: 'active' }).insertedId;
const branchId = db.Branches.insertOne({ name: 'Merkez', clinic_id: clinicId, address: 'İstanbul Merkez', phone: '+902122223345', calendar_settings: {}, doctors: [], created_at: now, updated_at: now, status: 'active' }).insertedId;

const adminId = db.Users.insertOne({ full_name: 'Admin Kullanıcı', email: 'admin@clinic.com', phone: '+905301112233', role_id: roleAdminId, clinics: [clinicId], branches: [branchId], photo: null, is_active: true, last_login: now, preferences: {}, created_at: now, updated_at: now, status: 'active' }).insertedId;
const doctorId = db.Users.insertOne({ full_name: 'Dr. Ada Yılmaz', email: 'ada@clinic.com', phone: '+905301112244', role_id: roleDoctorId, clinics: [clinicId], branches: [branchId], photo: null, is_active: true, last_login: now, preferences: {}, created_at: now, updated_at: now, status: 'active' }).insertedId;

const patientId = db.Patients.insertOne({ first_name: 'Ayşe', last_name: 'Kaya', full_name: 'Ayşe Kaya', email: 'ayse.kaya@example.com', phone: '+905301113355', national_id: '11111111111', birth_date: new Date('1995-05-10'), gender: 'F', address: 'İstanbul', clinic_id: clinicId, branch_id: branchId, files: [], notes: [], consents: { privacy: true }, smsPermission: true, whatsappPermission: true, emailPermission: true, balance: 0, created_at: now, updated_at: now, status: 'active' }).insertedId;

const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const end = new Date(start.getTime() + 30 * 60 * 1000);
const appointmentId = db.Appointments.insertOne({ patient_id: patientId, doctor_id: doctorId, clinic_id: clinicId, branch_id: branchId, start, end, type: 'Consultation', status: 'confirmed', room: 'A1', notes: '', reminder_sent: false, no_show: false, created_at: now, updated_at: now }).insertedId;

const planId = db.TreatmentPlans.insertOne({ patient_id: patientId, doctor_id: doctorId, clinic_id: clinicId, branch_id: branchId, items: [], total_cost: 250.0, discount: 0.0, approved: false, approved_at: null, signature: null, notes: '', created_at: now, updated_at: now, status: 'draft' }).insertedId;

db.Treatments.insertMany([
  { plan_id: planId, code: 'ADA-0150', name: 'Röntgen', tooth: '', session: 1, cost: 100.0, performed: false, performed_at: null, notes: '', created_at: now, updated_at: now },
  { plan_id: planId, code: 'ADA-1110', name: 'Temizleme', tooth: '', session: 1, cost: 150.0, performed: false, performed_at: null, notes: '', created_at: now, updated_at: now }
]);

const invoiceId = db.Invoices.insertOne({ patient_id: patientId, clinic_id: clinicId, branch_id: branchId, number: 'INV-2025-001', date: now, due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), lines: [{ name: 'Tedavi Planı', quantity: 1, unit_price: 250.0, vat_rate: 18 }], subtotal: 250.0, tax: 45.0, total: 295.0, e_invoice_id: null, pdf_url: null, status: 'sent', created_at: now, updated_at: now }).insertedId;

db.Payments.insertOne({ patient_id: patientId, treatment_plan_id: planId, invoice_id: invoiceId, amount: 295.0, currency: 'TRY', method: 'card', provider: 'stripe', transaction_id: null, status: 'pending', due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), paid_at: null, created_at: now, updated_at: now });

const stockItemId = db.StockItems.insertOne({ sku: 'ST-GLV-001', name: 'Lateks Eldiven', category: 'Sarf', clinic_id: clinicId, branch_id: branchId, min_level: 100, current_level: 80, unit: 'paket', expiry_date: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000), supplier: 'Tedarik AŞ', created_at: now, updated_at: now, status: 'active' }).insertedId;

db.StockTransactions.insertOne({ item_id: stockItemId, type: 'out', quantity: 20, date: now, user_id: adminId, notes: 'Kullanım', created_at: now, updated_at: now });

db.Notes.insertOne({ author_id: doctorId, patient_id: patientId, appointment_id: appointmentId, text: 'İlk muayene notu', tags: ['muayene'], is_private: false, created_at: now, updated_at: now });

db.AuditLogs.insertOne({ actor_id: adminId, action: 'seed', entity: 'system', entity_id: 'init', before: {}, after: {}, ip: '127.0.0.1', created_at: now });
