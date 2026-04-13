const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDb } = require('../config/db');
const env = require('../config/env');
const { User } = require('../models/User');
const { Customer } = require('../models/Customer');
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

  await Customer.insertMany([
    {
      companyName: 'Northwind Cafe',
      contactName: 'Elif Yildiz',
      contactEmail: 'elif@northwindcafe.com',
      contactPhone: '+90 555 100 0001',
      ownerUserId: users[1]._id
    },
    {
      companyName: 'Blue Harbor Logistics',
      contactName: 'Kerem Aslan',
      contactEmail: 'kerem@blueharbor.com',
      contactPhone: '+90 555 100 0002',
      ownerUserId: users[2]._id
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
