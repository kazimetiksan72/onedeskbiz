const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDb } = require('../config/db');
const env = require('../config/env');
const { User } = require('../models/User');
const { Customer } = require('../models/Customer');
const { Contact } = require('../models/Contact');
const { Vehicle } = require('../models/Vehicle');
const { CompanySettings } = require('../models/CompanySettings');
const { LeaveRequest } = require('../models/LeaveRequest');
const { RefreshToken } = require('../models/RefreshToken');
const { ROLES } = require('../constants/roles');

async function run() {
  await connectDb();

  try {
    await mongoose.connection.db.dropCollection('employees');
  } catch (error) {
    if (error?.codeName !== 'NamespaceNotFound' && error?.code !== 26) {
      throw error;
    }
  }

  await Promise.all([
    User.deleteMany({}),
    Customer.deleteMany({}),
    Contact.deleteMany({}),
    Vehicle.deleteMany({}),
    CompanySettings.deleteMany({}),
    LeaveRequest.deleteMany({}),
    RefreshToken.deleteMany({})
  ]);

  const adminPasswordHash = await bcrypt.hash('Admin1234!', env.bcryptSaltRounds);
  const employeePasswordHash = await bcrypt.hash('Employee1234!', env.bcryptSaltRounds);

  const users = await User.insertMany([
    {
      email: 'admin@smallbiz.local',
      workEmail: 'admin@smallbiz.local',
      passwordHash: adminPasswordHash,
      role: ROLES.ADMIN,
      firstName: 'Aylin',
      lastName: 'Kaya',
      department: 'Management',
      title: 'General Manager',
      phone: '+905551000001',
      startDate: new Date('2023-01-10'),
      status: 'ACTIVE',
      isActive: true,
      mustChangePassword: false,
      passwordUpdatedAt: new Date()
    },
    {
      email: 'mert@smallbiz.local',
      workEmail: 'mert@smallbiz.local',
      passwordHash: employeePasswordHash,
      role: ROLES.EMPLOYEE,
      firstName: 'Mert',
      lastName: 'Demir',
      department: 'Sales',
      title: 'Sales Specialist',
      phone: '+905551000002',
      startDate: new Date('2024-03-20'),
      status: 'ACTIVE',
      isActive: true,
      mustChangePassword: true,
      passwordUpdatedAt: null,
      businessCard: {
        displayName: 'Mert Demir',
        title: 'Sales Specialist',
        phone: '+905551000002',
        email: 'mert@smallbiz.local',
        isPublic: true
      }
    },
    {
      email: 'selin@smallbiz.local',
      workEmail: 'selin@smallbiz.local',
      passwordHash: employeePasswordHash,
      role: ROLES.EMPLOYEE,
      firstName: 'Selin',
      lastName: 'Yilmaz',
      department: 'Operations',
      title: 'Operations Specialist',
      phone: '+905551000003',
      startDate: new Date('2024-06-05'),
      status: 'ACTIVE',
      isActive: true,
      mustChangePassword: true,
      passwordUpdatedAt: null,
      businessCard: {
        displayName: 'Selin Yilmaz',
        title: 'Operations Specialist',
        phone: '+905551000003',
        email: 'selin@smallbiz.local',
        isPublic: true
      }
    }
  ]);

  const customers = await Customer.insertMany([
    {
      companyName: 'Northwind Cafe',
      website: 'https://northwindcafe.example',
      address: 'Bagdat Caddesi No:10 Kadikoy Istanbul',
      phone: '+90 216 100 0001',
      taxNumber: '1111111111',
      taxOffice: 'Kadikoy'
    },
    {
      companyName: 'Blue Harbor Logistics',
      website: 'https://blueharbor.example',
      address: 'Liman Yolu No:4 Tuzla Istanbul',
      phone: '+90 216 100 0002',
      taxNumber: '2222222222',
      taxOffice: 'Tuzla'
    }
  ]);

  await Contact.insertMany([
    {
      customerId: customers[0]._id,
      firstName: 'Elif',
      lastName: 'Yildiz',
      email: 'elif@northwindcafe.com',
      phone: '+90 555 100 0001'
    },
    {
      customerId: customers[1]._id,
      firstName: 'Kerem',
      lastName: 'Aslan',
      email: 'kerem@blueharbor.com',
      phone: '+90 555 100 0002'
    }
  ]);

  await Vehicle.insertMany([
    {
      plate: '24 EYL 88',
      brand: 'BMW',
      model: 'X3 si',
      modelYear: 2015,
      kilometer: 240000
    },
    {
      plate: '34 RZS 77',
      brand: 'Fiat',
      model: 'Punto',
      modelYear: 2002,
      kilometer: 180000
    }
  ]);

  await CompanySettings.create({
    companyName: 'SmallBiz Demo Co.',
    website: 'https://smallbiz.local',
    timezone: 'Europe/Istanbul',
    departments: ['Management', 'Sales', 'Operations'],
    billingInfo: {
      legalCompanyName: 'SmallBiz Demo Co. Ltd.',
      taxNumber: '1234567890',
      taxOffice: 'Kadikoy',
      billingEmail: 'billing@smallbiz.local',
      phone: '+90 216 000 0000',
      address: 'Istanbul Business Center No:12',
      city: 'Istanbul',
      country: 'Turkey',
      postalCode: '34710',
      bankAccounts: [
        {
          bankName: 'Demo Bank',
          branchName: 'Kadikoy',
          iban: 'TR330006100519786457841326',
          swiftCode: 'DEMOTRIS'
        }
      ]
    }
  });

  // eslint-disable-next-line no-console
  console.log('Seed completed');
  process.exit(0);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
