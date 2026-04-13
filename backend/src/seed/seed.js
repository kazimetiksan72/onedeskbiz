const bcrypt = require('bcryptjs');
const { connectDb } = require('../config/db');
const env = require('../config/env');
const { User } = require('../models/User');
const { Employee } = require('../models/Employee');
const { Customer } = require('../models/Customer');
const { CompanySettings } = require('../models/CompanySettings');
const { ROLES } = require('../constants/roles');

async function run() {
  await connectDb();

  await Promise.all([
    User.deleteMany({}),
    Employee.deleteMany({}),
    Customer.deleteMany({}),
    CompanySettings.deleteMany({})
  ]);

  const employees = await Employee.insertMany([
    {
      firstName: 'Aylin',
      lastName: 'Kaya',
      workEmail: 'aylin@smallbiz.local',
      department: 'Management',
      title: 'General Manager',
      startDate: new Date('2023-01-10')
    },
    {
      firstName: 'Mert',
      lastName: 'Demir',
      workEmail: 'mert@smallbiz.local',
      department: 'Sales',
      title: 'Sales Specialist',
      startDate: new Date('2024-03-20')
    }
  ]);

  const adminPasswordHash = await bcrypt.hash('Admin1234!', env.bcryptSaltRounds);
  const employeePasswordHash = await bcrypt.hash('Employee1234!', env.bcryptSaltRounds);

  await User.insertMany([
    {
      email: 'admin@smallbiz.local',
      passwordHash: adminPasswordHash,
      role: ROLES.ADMIN,
      employeeId: employees[0]._id
    },
    {
      email: 'employee@smallbiz.local',
      passwordHash: employeePasswordHash,
      role: ROLES.EMPLOYEE,
      employeeId: employees[1]._id
    }
  ]);

  await Customer.insertMany([
    {
      companyName: 'Northwind Cafe',
      contactName: 'Elif Yildiz',
      contactEmail: 'elif@northwindcafe.com',
      contactPhone: '+90 555 100 0001',
      ownerEmployeeId: employees[1]._id
    },
    {
      companyName: 'Blue Harbor Logistics',
      contactName: 'Kerem Aslan',
      contactEmail: 'kerem@blueharbor.com',
      contactPhone: '+90 555 100 0002',
      ownerEmployeeId: employees[1]._id
    }
  ]);

  await CompanySettings.create({
    companyName: 'SmallBiz Demo Co.',
    domain: 'smallbiz.local',
    timezone: 'Europe/Istanbul',
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
      bankDetails: {
        bankName: 'Demo Bank',
        accountName: 'SmallBiz Demo Co. Ltd.',
        iban: 'TR330006100519786457841326',
        swiftCode: 'DEMOTRIS'
      }
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
