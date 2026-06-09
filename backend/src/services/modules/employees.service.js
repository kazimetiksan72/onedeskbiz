const bcrypt = require('bcryptjs');
const PDFDocument = require('pdfkit');
const { User } = require('../../models/User');
const { CompanySettings } = require('../../models/CompanySettings');
const { ROLES } = require('../../constants/roles');
const env = require('../../config/env');
const { ApiError } = require('../../utils/apiError');
const { getPagination } = require('../../utils/pagination');
const { DepartmentRoleAssignment } = require('../../models/DepartmentRoleAssignment');
const { attachDepartmentRole, attachDepartmentRoles } = require('./departmentRoleAssignments.service');

function extractOpenAIText(response) {
  if (response.output_text) return response.output_text;

  const chunks = [];
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join('\n').trim();
}

function syncBusinessCard(userPayload) {
  const existingCard = userPayload.businessCard || {};
  const displayName = `${userPayload.firstName || ''} ${userPayload.lastName || ''}`.trim();

  return {
    ...userPayload,
    businessCard: {
      ...existingCard,
      displayName,
      title: userPayload.title || '',
      phone: userPayload.phone || '',
      email: userPayload.workEmail?.toLowerCase() || '',
      isPublic: true
    }
  };
}

function pickUserProfileFields(payload) {
  return {
    firstName: payload.firstName,
    lastName: payload.lastName,
    tckn: payload.tckn,
    birthDate: payload.birthDate,
    workEmail: payload.workEmail,
    email: payload.workEmail,
    personalEmail: payload.personalEmail,
    phone: payload.phone,
    department: payload.department,
    title: payload.title,
    jobDescription: payload.jobDescription,
    employmentType: payload.employmentType,
    startDate: payload.startDate,
    status: payload.status,
    emergencyContact: payload.emergencyContact,
    businessCard: payload.businessCard,
    isActive: payload.status !== 'INACTIVE'
  };
}

function normalizeWorkEmail(workEmail) {
  return (workEmail || '').toLowerCase().trim();
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value));
}

function getFullName(user) {
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || '-';
}

function translateEmploymentType(value) {
  if (value === 'PART_TIME') return 'Yarı zamanlı';
  if (value === 'CONTRACTOR') return 'Sözleşmeli';
  return 'Tam zamanlı';
}

async function fetchImageBuffer(url) {
  if (!url) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/') || contentType.includes('webp')) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

function addLabelValue(document, label, value, options = {}) {
  const x = options.x || document.x;
  const y = options.y || document.y;
  const labelWidth = options.labelWidth || 130;
  const valueWidth = options.valueWidth || 360;

  document
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#334155')
    .text(label, x, y, { width: labelWidth });

  document
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#0f172a')
    .text(value || '-', x + labelWidth + 8, y, { width: valueWidth });

  document.moveDown(0.65);
}

function createEmployeeProfilePdf({ employee, settings, logoBuffer }) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const document = new PDFDocument({ size: 'A4', margin: 48, autoFirstPage: true });
    const billingInfo = settings?.billingInfo || {};
    const companyName = settings?.companyName || billingInfo.legalCompanyName || 'Şirket';

    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    if (logoBuffer) {
      try {
        document.image(logoBuffer, 48, 42, { fit: [96, 52], align: 'left' });
      } catch {
        document.font('Helvetica-Bold').fontSize(12).text(companyName, 48, 52, { width: 160 });
      }
    } else {
      document.font('Helvetica-Bold').fontSize(12).text(companyName, 48, 52, { width: 160 });
    }

    document
      .font('Helvetica-Bold')
      .fontSize(17)
      .fillColor('#0f172a')
      .text('Personel Bilgi ve Görev Tanımı Formu', 170, 50, { align: 'right', width: 377 });

    document
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#64748b')
      .text(`Düzenleme Tarihi: ${formatDate(new Date())}`, 170, 78, { align: 'right', width: 377 });

    document.moveTo(48, 116).lineTo(547, 116).strokeColor('#cbd5e1').stroke();
    document.y = 138;

    document.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text('Personel Bilgileri');
    document.moveDown(0.8);
    addLabelValue(document, 'Ad Soyad', getFullName(employee));
    addLabelValue(document, 'TCKN', employee.tckn || '-');
    addLabelValue(document, 'E-posta', employee.workEmail || employee.email || '-');
    addLabelValue(document, 'Telefon', employee.phone || '-');
    addLabelValue(document, 'Doğum Tarihi', formatDate(employee.birthDate));
    addLabelValue(document, 'Departman', employee.department || '-');
    addLabelValue(document, 'Ünvan', employee.title || '-');
    addLabelValue(document, 'Çalışma Tipi', translateEmploymentType(employee.employmentType));
    addLabelValue(document, 'İşe Başlangıç', formatDate(employee.startDate));
    addLabelValue(document, 'Durum', employee.status === 'ACTIVE' ? 'Aktif' : 'Pasif');

    document.moveDown(1.1);
    document.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text('Görev Tanımı');
    document.moveDown(0.5);
    document
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#0f172a')
      .text(employee.jobDescription || '-', { width: 499, align: 'left', lineGap: 3 });

    if (document.y > 610) {
      document.addPage();
      document.y = 80;
    }

    const signatureY = Math.max(document.y + 42, 610);
    document.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a');
    document.text('Personel İmzası', 48, signatureY, { width: 190, align: 'center' });
    document.text('Yetkili İmzası', 357, signatureY, { width: 190, align: 'center' });
    document.moveTo(58, signatureY + 54).lineTo(228, signatureY + 54).strokeColor('#94a3b8').stroke();
    document.moveTo(367, signatureY + 54).lineTo(537, signatureY + 54).strokeColor('#94a3b8').stroke();

    const footerParts = [
      billingInfo.legalCompanyName || settings?.companyName,
      billingInfo.address,
      [billingInfo.city, billingInfo.country].filter(Boolean).join(' / '),
      billingInfo.phone,
      billingInfo.billingEmail,
      settings?.website,
      billingInfo.taxNumber ? `Vergi No: ${billingInfo.taxNumber}` : '',
      billingInfo.taxOffice ? `Vergi Dairesi: ${billingInfo.taxOffice}` : ''
    ].filter(Boolean);

    document
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#64748b')
      .text(footerParts.join(' | '), 48, 762, { width: 499, align: 'center' });

    document.end();
  });
}

async function ensureUniqueEmail(workEmail, excludeUserId) {
  const query = {
    $or: [{ email: workEmail }, { workEmail }]
  };

  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }

  const existing = await User.findOne(query).select('_id').lean();
  if (existing) {
    throw new ApiError(409, 'Email already in use');
  }
}

async function createEmployee(payload) {
  const { temporaryPassword, ...rawProfile } = payload;
  const normalizedWorkEmail = normalizeWorkEmail(rawProfile.workEmail);

  await ensureUniqueEmail(normalizedWorkEmail);

  const passwordHash = await bcrypt.hash(temporaryPassword, env.bcryptSaltRounds);
  const profile = syncBusinessCard({
    ...rawProfile,
    workEmail: normalizedWorkEmail
  });

  const created = await User.create({
    ...pickUserProfileFields(profile),
    passwordHash,
    role: ROLES.EMPLOYEE,
    mustChangePassword: false,
    passwordUpdatedAt: new Date()
  });

  const employee = await User.findById(created._id).select('-passwordHash').lean();
  return attachDepartmentRole(employee);
}

async function listEmployees({ page, limit, search }) {
  const { skip } = getPagination({ page, limit });
  const query = { role: ROLES.EMPLOYEE };

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { workEmail: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } }
    ];
  }

  const [items, total] = await Promise.all([
    User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

  return { items: await attachDepartmentRoles(items), total, page, limit };
}

async function getEmployeeById(id) {
  const employee = await User.findOne({ _id: id, role: ROLES.EMPLOYEE })
    .select('-passwordHash')
    .lean();
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  return attachDepartmentRole(employee);
}

async function updateEmployee(id, payload) {
  const { temporaryPassword, ...rawProfile } = payload;
  const current = await User.findOne({ _id: id, role: ROLES.EMPLOYEE });

  if (!current) {
    throw new ApiError(404, 'Employee not found');
  }

  const mergedWorkEmail = normalizeWorkEmail(rawProfile.workEmail || current.workEmail);
  await ensureUniqueEmail(mergedWorkEmail, current._id);

  const mergedPayload = {
    firstName: rawProfile.firstName ?? current.firstName,
    lastName: rawProfile.lastName ?? current.lastName,
    tckn: rawProfile.tckn ?? current.tckn,
    birthDate: rawProfile.birthDate ?? current.birthDate,
    workEmail: mergedWorkEmail,
    personalEmail: rawProfile.personalEmail ?? current.personalEmail,
    phone: rawProfile.phone ?? current.phone,
    department: rawProfile.department ?? current.department,
    title: rawProfile.title ?? current.title,
    jobDescription: rawProfile.jobDescription ?? current.jobDescription,
    employmentType: rawProfile.employmentType ?? current.employmentType,
    startDate: rawProfile.startDate ?? current.startDate,
    status: rawProfile.status ?? current.status,
    emergencyContact: rawProfile.emergencyContact ?? current.emergencyContact,
    businessCard: { ...(current.businessCard?.toObject?.() || current.businessCard || {}) }
  };

  const profile = syncBusinessCard(mergedPayload);
  const updates = pickUserProfileFields(profile);

  if (temporaryPassword) {
    updates.passwordHash = await bcrypt.hash(temporaryPassword, env.bcryptSaltRounds);
    updates.mustChangePassword = false;
    updates.passwordUpdatedAt = new Date();
  }

  const employee = await User.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true })
    .select('-passwordHash')
    .lean();

  return attachDepartmentRole(employee);
}

async function deleteEmployee(id) {
  const employee = await User.findOneAndDelete({ _id: id, role: ROLES.EMPLOYEE }).lean();

  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  await DepartmentRoleAssignment.deleteOne({ userId: id });
}

async function generateJobDescription(payload) {
  if (!env.openai.apiKey) {
    throw new ApiError(500, 'OpenAI API anahtarı yapılandırılmamış.');
  }

  const department = String(payload.department || '').trim();
  const title = String(payload.title || '').trim();
  const employeeName = `${payload.firstName || ''} ${payload.lastName || ''}`.trim();

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openai.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.openai.model,
      reasoning: { effort: 'minimal' },
      instructions: [
        'Sen KOBİ insan kaynakları süreçleri için profesyonel görev tanımları yazan bir asistansın.',
        'Yanıtı yalnızca Türkçe görev tanımı metni olarak ver.',
        'Başlık, markdown, madde işareti veya açıklama ekleme.',
        'Metin 90-130 kelime arasında, kurumsal, net ve uygulanabilir olsun.'
      ].join(' '),
      input: [
        `Departman: ${department}`,
        `Ünvan: ${title || 'Belirtilmedi'}`,
        `Personel adı: ${employeeName || 'Belirtilmedi'}`,
        'Bu personele atanabilecek görev ve sorumlulukları tek paragraf halinde yaz.'
      ].join('\n'),
      max_output_tokens: 700
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || 'Görev tanımı OpenAI üzerinden oluşturulamadı.';
    throw new ApiError(response.status >= 500 ? 502 : 400, message);
  }

  const jobDescription = extractOpenAIText(data).trim();
  if (!jobDescription) {
    throw new ApiError(502, 'OpenAI boş görev tanımı döndürdü.');
  }

  return { jobDescription };
}

async function generateEmployeeProfilePdf(id) {
  const employee = await User.findOne({ _id: id, role: ROLES.EMPLOYEE })
    .select('-passwordHash')
    .lean();

  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  const settings = await CompanySettings.findOne().lean();
  const logoBuffer = await fetchImageBuffer(settings?.logoUrl);
  const buffer = await createEmployeeProfilePdf({ employee, settings, logoBuffer });
  const safeName = getFullName(employee)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/(^-|-$)/g, '') || 'personel';

  return {
    buffer,
    fileName: `${safeName}-gorev-tanimi.pdf`
  };
}

module.exports = {
  createEmployee,
  listEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  generateJobDescription,
  generateEmployeeProfilePdf
};
