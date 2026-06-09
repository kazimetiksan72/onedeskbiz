const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDb } = require('../config/db');
const env = require('../config/env');
const { ROLES } = require('../constants/roles');
const { CompanySettings } = require('../models/CompanySettings');
const { DepartmentRole, PERMISSIONS } = require('../models/DepartmentRole');
const { DepartmentRoleAssignment } = require('../models/DepartmentRoleAssignment');
const { User } = require('../models/User');

const targetTaxNumber = '7291330999';

const demoDepartments = [
  {
    name: 'Operasyon',
    employees: [
      ['Elif', 'Yalcin', 'Operasyon Müdürü'],
      ['Kerem', 'Aydin', 'Operasyon Uzmanı'],
      ['Seda', 'Korkmaz', 'Operasyon Destek Sorumlusu']
    ]
  },
  {
    name: 'İnsan Kaynakları',
    employees: [
      ['Burak', 'Arslan', 'İK Müdürü'],
      ['Derya', 'Polat', 'İK Uzmanı'],
      ['Can', 'Yildiz', 'Personel İşleri Sorumlusu']
    ]
  },
  {
    name: 'Muhasebe',
    employees: [
      ['Ayse', 'Celik', 'Muhasebe Müdürü'],
      ['Onur', 'Kaplan', 'Muhasebe Uzmanı'],
      ['Merve', 'Sahin', 'Finans Asistanı']
    ]
  },
  {
    name: 'Satış',
    employees: [
      ['Emre', 'Ozkan', 'Satış Müdürü'],
      ['Gizem', 'Kaya', 'Satış Uzmanı'],
      ['Tolga', 'Demir', 'Müşteri Temsilcisi']
    ]
  },
  {
    name: 'Teknik Servis',
    employees: [
      ['Murat', 'Eren', 'Teknik Servis Müdürü'],
      ['Pelin', 'Ucar', 'Servis Planlama Uzmanı'],
      ['Baris', 'Kurt', 'Saha Teknikeri']
    ]
  }
];

const managerPermissions = [
  PERMISSIONS.VEHICLE_APPROVAL,
  PERMISSIONS.LEAVE_APPROVAL,
  PERMISSIONS.MATERIAL_APPROVAL,
  PERMISSIONS.EXPENSE_APPROVAL,
  PERMISSIONS.ADVANCE_APPROVAL,
  PERMISSIONS.ASSET_APPROVAL,
  PERMISSIONS.TASK_ASSIGNMENT
];

function slugify(value) {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function makeValidTckn(seed) {
  const digits = String(100000000 + seed).padStart(9, '1').split('').map(Number);
  digits[0] = digits[0] || 1;

  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const tenth = ((oddSum * 7) - evenSum) % 10;
  const normalizedTenth = tenth < 0 ? tenth + 10 : tenth;
  const eleventh = [...digits, normalizedTenth].reduce((sum, digit) => sum + digit, 0) % 10;

  return [...digits, normalizedTenth, eleventh].join('');
}

function buildBusinessCard(employee) {
  return {
    displayName: `${employee.firstName} ${employee.lastName}`,
    title: employee.title,
    phone: employee.phone,
    email: employee.workEmail,
    isPublic: true
  };
}

async function upsertDepartmentRoles(department) {
  const managerRole = await DepartmentRole.findOneAndUpdate(
    { department, name: 'Yönetici' },
    { department, name: 'Yönetici', permissions: managerPermissions },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );

  const employeeRole = await DepartmentRole.findOneAndUpdate(
    { department, name: 'Çalışan' },
    { department, name: 'Çalışan', permissions: [] },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );

  return { managerRole, employeeRole };
}

async function assignRole(userId, departmentRoleId) {
  await DepartmentRoleAssignment.findOneAndUpdate(
    { userId },
    { userId, departmentRoleId },
    { upsert: true, setDefaultsOnInsert: true }
  );
}

async function run() {
  await connectDb();

  const settings = await CompanySettings.findOne({ 'billingInfo.taxNumber': targetTaxNumber });
  if (!settings) {
    throw new Error(`${targetTaxNumber} vergi numaralı şirket ayarı bulunamadı.`);
  }

  const departmentNames = demoDepartments.map((item) => item.name);
  const existingDepartments = settings.departments || [];
  const departments = [...existingDepartments];

  for (const department of departmentNames) {
    if (!departments.some((item) => item.toLocaleLowerCase('tr-TR') === department.toLocaleLowerCase('tr-TR'))) {
      departments.push(department);
    }
  }

  settings.departments = departments;
  await settings.save();

  const passwordHash = await bcrypt.hash(env.defaultEmployeePassword, env.bcryptSaltRounds);
  const existingManager = await User.findOne({ role: ROLES.EMPLOYEE, isActive: true }).sort({ createdAt: 1 });
  const createdOrUpdated = [];
  let fallbackManagerId = existingManager?._id || null;
  let tcknSeed = 729133001;

  for (const department of demoDepartments) {
    const roles = await upsertDepartmentRoles(department.name);
    let departmentManagerId = null;

    for (const [index, employeeInfo] of department.employees.entries()) {
      const [firstName, lastName, title] = employeeInfo;
      const workEmail = `demo.${slugify(department.name)}.${index + 1}@onedesk.local`;
      const managerUserId = index === 0 ? fallbackManagerId : departmentManagerId || fallbackManagerId;
      const phone = `+90555${String(tcknSeed).slice(-6)}`;
      const employeePayload = {
        email: workEmail,
        workEmail,
        passwordHash,
        role: ROLES.EMPLOYEE,
        firstName,
        lastName,
        tckn: makeValidTckn(tcknSeed++),
        managerUserId,
        phone,
        department: department.name,
        title,
        jobDescription: `${department.name} departmanında ${title} olarak görev yapar; günlük operasyonların takibi, kayıtların düzenli tutulması ve ilgili taleplerin zamanında yürütülmesinden sorumludur.`,
        employmentType: 'FULL_TIME',
        startDate: new Date('2026-06-01T09:00:00.000Z'),
        status: 'ACTIVE',
        isActive: true,
        mustChangePassword: true,
        passwordUpdatedAt: new Date(),
        businessCard: buildBusinessCard({ firstName, lastName, title, phone, workEmail })
      };

      const user = await User.findOneAndUpdate(
        { workEmail },
        employeePayload,
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );

      if (index === 0) {
        departmentManagerId = user._id;
        if (!fallbackManagerId) {
          fallbackManagerId = user._id;
        }
        await assignRole(user._id, roles.managerRole._id);
      } else {
        await assignRole(user._id, roles.employeeRole._id);
      }

      createdOrUpdated.push(user);
    }
  }

  const managerCandidates = createdOrUpdated.map((item) => item._id);
  for (const user of createdOrUpdated) {
    if (!user.managerUserId || String(user.managerUserId) === String(user._id)) {
      const managerId = managerCandidates.find((id) => String(id) !== String(user._id));
      if (managerId) {
        await User.updateOne({ _id: user._id }, { managerUserId: managerId });
      }
    }
  }

  console.log(`${settings.companyName || targetTaxNumber} için ${departmentNames.length} departman ve ${createdOrUpdated.length} demo personel hazırlandı.`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
