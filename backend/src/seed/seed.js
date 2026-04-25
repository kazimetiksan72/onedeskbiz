const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDb } = require('../config/db');
const env = require('../config/env');
const { User } = require('../models/User');
const { Customer } = require('../models/Customer');
const { Contact } = require('../models/Contact');
const { ContactActionLog } = require('../models/ContactActionLog');
const { Vehicle } = require('../models/Vehicle');
const { DepartmentRole, PERMISSIONS } = require('../models/DepartmentRole');
const { Request } = require('../models/Request');
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
    ContactActionLog.deleteMany({}),
    Vehicle.deleteMany({}),
    DepartmentRole.deleteMany({}),
    Request.deleteMany({}),
    CompanySettings.deleteMany({}),
    LeaveRequest.deleteMany({}),
    RefreshToken.deleteMany({})
  ]);

  const defaultPasswordHash = await bcrypt.hash('App12345', env.bcryptSaltRounds);

  const departments = ['Management', 'Sales', 'Operations'];
  const departmentRoles = await DepartmentRole.insertMany(
    departments.flatMap((department) => [
      {
        department,
        name: 'Yönetici',
        permissions: [
          PERMISSIONS.VEHICLE_APPROVAL,
          PERMISSIONS.LEAVE_APPROVAL,
          PERMISSIONS.MATERIAL_APPROVAL
        ]
      },
      {
        department,
        name: 'Çalışan',
        permissions: []
      }
    ])
  );

  const findRole = (department, name) =>
    departmentRoles.find((item) => item.department === department && item.name === name)?._id;

  const users = await User.insertMany([
    {
      email: 'admin@smallbiz.local',
      workEmail: 'admin@smallbiz.local',
      passwordHash: defaultPasswordHash,
      role: ROLES.ADMIN,
      firstName: 'Aylin',
      lastName: 'Kaya',
      department: 'Management',
      departmentRoleId: findRole('Management', 'Yönetici'),
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
      passwordHash: defaultPasswordHash,
      role: ROLES.EMPLOYEE,
      firstName: 'Mert',
      lastName: 'Demir',
      department: 'Sales',
      departmentRoleId: findRole('Sales', 'Yönetici'),
      title: 'Sales Specialist',
      phone: '+905551000002',
      startDate: new Date('2024-03-20'),
      status: 'ACTIVE',
      isActive: true,
      mustChangePassword: false,
      passwordUpdatedAt: new Date(),
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
      passwordHash: defaultPasswordHash,
      role: ROLES.EMPLOYEE,
      firstName: 'Selin',
      lastName: 'Yilmaz',
      department: 'Operations',
      departmentRoleId: findRole('Operations', 'Çalışan'),
      title: 'Operations Specialist',
      phone: '+905551000003',
      startDate: new Date('2024-06-05'),
      status: 'ACTIVE',
      isActive: true,
      mustChangePassword: false,
      passwordUpdatedAt: new Date(),
      businessCard: {
        displayName: 'Selin Yilmaz',
        title: 'Operations Specialist',
        phone: '+905551000003',
        email: 'selin@smallbiz.local',
        isPublic: true
      }
    }
  ]);

  const demoCompanies = [
    {
      companyName: 'Anadolu Kahve Gıda',
      website: 'https://anadolukahve.example',
      address: 'Bağdat Caddesi No:10 Kadıköy İstanbul',
      phone: '+90 216 100 1001',
      taxNumber: '1000000001',
      taxOffice: 'Kadıköy',
      domain: 'anadolukahve.example',
      contacts: [
        ['Ayşe', 'Yılmaz'],
        ['Mehmet', 'Kaya'],
        ['Zeynep', 'Demir'],
        ['Burak', 'Şahin'],
        ['Elif', 'Arslan']
      ]
    },
    {
      companyName: 'Ege Lojistik Hizmetleri',
      website: 'https://egelojistik.example',
      address: 'Liman Caddesi No:22 Konak İzmir',
      phone: '+90 232 100 1002',
      taxNumber: '1000000002',
      taxOffice: 'Konak',
      domain: 'egelojistik.example',
      contacts: [
        ['Kerem', 'Aydın'],
        ['Derya', 'Koç'],
        ['Murat', 'Öztürk'],
        ['Seda', 'Çelik'],
        ['Can', 'Korkmaz']
      ]
    },
    {
      companyName: 'Marmara Tekstil',
      website: 'https://marmaratekstil.example',
      address: 'Sanayi Mahallesi No:8 Nilüfer Bursa',
      phone: '+90 224 100 1003',
      taxNumber: '1000000003',
      taxOffice: 'Nilüfer',
      domain: 'marmaratekstil.example',
      contacts: [
        ['Selin', 'Yıldırım'],
        ['Emre', 'Aksoy'],
        ['Buse', 'Güneş'],
        ['Okan', 'Polat'],
        ['İrem', 'Doğan']
      ]
    },
    {
      companyName: 'Boğaziçi Yazılım',
      website: 'https://bogaziciyazilim.example',
      address: 'Teknopark Bulvarı No:5 Sarıyer İstanbul',
      phone: '+90 212 100 1004',
      taxNumber: '1000000004',
      taxOffice: 'Sarıyer',
      domain: 'bogaziciyazilim.example',
      contacts: [
        ['Deniz', 'Kılıç'],
        ['Ece', 'Taş'],
        ['Onur', 'Çetin'],
        ['Melis', 'Uçar'],
        ['Tolga', 'Ergin']
      ]
    },
    {
      companyName: 'Kapadokya Turizm',
      website: 'https://kapadokyaturizm.example',
      address: 'Atatürk Bulvarı No:14 Merkez Nevşehir',
      phone: '+90 384 100 1005',
      taxNumber: '1000000005',
      taxOffice: 'Nevşehir',
      domain: 'kapadokyaturizm.example',
      contacts: [
        ['Gizem', 'Ateş'],
        ['Serkan', 'Bulut'],
        ['Nehir', 'Eren'],
        ['Alp', 'Turan'],
        ['Pelin', 'Keskin']
      ]
    },
    {
      companyName: 'Karadeniz İnşaat',
      website: 'https://karadenizinsaat.example',
      address: 'Sahil Yolu No:30 Ortahisar Trabzon',
      phone: '+90 462 100 1006',
      taxNumber: '1000000006',
      taxOffice: 'Trabzon',
      domain: 'karadenizinsaat.example',
      contacts: [
        ['Hakan', 'Yavuz'],
        ['Ceren', 'Kurt'],
        ['Barış', 'Özkan'],
        ['Dilan', 'Sarı'],
        ['Umut', 'Kaplan']
      ]
    },
    {
      companyName: 'Akdeniz Medikal',
      website: 'https://akdenizmedikal.example',
      address: 'Sağlık Sokak No:18 Muratpaşa Antalya',
      phone: '+90 242 100 1007',
      taxNumber: '1000000007',
      taxOffice: 'Muratpaşa',
      domain: 'akdenizmedikal.example',
      contacts: [
        ['Aslı', 'Güler'],
        ['Kaan', 'Bozkurt'],
        ['Merve', 'Işık'],
        ['Cem', 'Acar'],
        ['Sibel', 'Yalçın']
      ]
    },
    {
      companyName: 'Toros Tarım Ürünleri',
      website: 'https://torostarim.example',
      address: 'Organize Sanayi No:44 Tarsus Mersin',
      phone: '+90 324 100 1008',
      taxNumber: '1000000008',
      taxOffice: 'Tarsus',
      domain: 'torostarim.example',
      contacts: [
        ['Fatma', 'Çoban'],
        ['Ali', 'Erdoğan'],
        ['Yasemin', 'Kara'],
        ['Levent', 'Sezer'],
        ['Esra', 'Önder']
      ]
    },
    {
      companyName: 'Başkent Danışmanlık',
      website: 'https://baskentdanismanlik.example',
      address: 'Tunus Caddesi No:7 Çankaya Ankara',
      phone: '+90 312 100 1009',
      taxNumber: '1000000009',
      taxOffice: 'Çankaya',
      domain: 'baskentdanismanlik.example',
      contacts: [
        ['Tuna', 'Altun'],
        ['Ebru', 'Yüce'],
        ['Koray', 'Gür'],
        ['Nazlı', 'Sönmez'],
        ['Arda', 'Balcı']
      ]
    },
    {
      companyName: 'Güneydoğu Enerji',
      website: 'https://guneydoguenerji.example',
      address: 'Enerji Bulvarı No:3 Şehitkamil Gaziantep',
      phone: '+90 342 100 1010',
      taxNumber: '1000000010',
      taxOffice: 'Şehitkamil',
      domain: 'guneydoguenerji.example',
      contacts: [
        ['Rana', 'Önel'],
        ['Efe', 'Durmaz'],
        ['Sinem', 'Avcı'],
        ['Volkan', 'Yener'],
        ['İlker', 'Uzun']
      ]
    }
  ];

  const customers = await Customer.insertMany(
    demoCompanies.map(({ domain, contacts, ...company }) => company)
  );

  const toEmailLocal = (value) =>
    value
      .toLocaleLowerCase('tr-TR')
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  await Contact.insertMany(
    demoCompanies.flatMap((company, companyIndex) =>
      company.contacts.map(([firstName, lastName], contactIndex) => ({
        customerId: customers[companyIndex]._id,
        firstName,
        lastName,
        email: `${toEmailLocal(firstName)}${contactIndex + 1}@${company.domain}`,
        phone: `+90 555 ${String(companyIndex + 1).padStart(3, '0')} ${String(contactIndex + 1).padStart(4, '0')}`
      }))
    )
  );

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
    departments,
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
