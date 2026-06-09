const bcrypt = require('bcryptjs');
const path = require('path');
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

const regularFontPath = path.resolve(__dirname, '../../assets/fonts/NotoSans-Regular.ttf');
const boldFontPath = path.resolve(__dirname, '../../assets/fonts/NotoSans-Bold.ttf');

function registerPdfFonts(document) {
  document.registerFont('AppRegular', regularFontPath);
  document.registerFont('AppBold', boldFontPath);
}

function drawRoundedRect(document, x, y, width, height, options = {}) {
  document
    .roundedRect(x, y, width, height, options.radius || 8)
    .fillAndStroke(options.fill || '#ffffff', options.stroke || '#e2e8f0');
}

function drawSectionTitle(document, title, y) {
  document
    .font('AppBold')
    .fontSize(11)
    .fillColor('#0f172a')
    .text(title, 48, y);

  document
    .moveTo(48, y + 20)
    .lineTo(547, y + 20)
    .strokeColor('#dbe4ef')
    .lineWidth(1)
    .stroke();
}

function drawInfoCell(document, item, x, y, width) {
  document
    .font('AppBold')
    .fontSize(7.8)
    .fillColor('#64748b')
    .text(item.label.toLocaleUpperCase('tr-TR'), x, y, { width });

  document
    .font('AppRegular')
    .fontSize(9.8)
    .fillColor('#0f172a')
    .text(item.value || '-', x, y + 13, { width, lineGap: 1 });
}

function drawInfoGrid(document, items, x, y) {
  const cardWidth = 499;
  const columnWidth = 217;
  const rowHeight = 43;
  const gap = 24;
  const rows = Math.ceil(items.length / 2);
  const cardHeight = rows * rowHeight + 24;

  drawRoundedRect(document, x, y, cardWidth, cardHeight, { fill: '#f8fafc', stroke: '#dbe4ef' });

  items.forEach((item, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const cellX = x + 18 + column * (columnWidth + gap);
    const cellY = y + 15 + row * rowHeight;
    drawInfoCell(document, item, cellX, cellY, columnWidth);
  });

  return y + cardHeight;
}

function drawFooter(document, settings) {
  const billingInfo = settings?.billingInfo || {};
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
    .font('AppRegular')
    .fontSize(6.8)
    .fillColor('#64748b')
    .text(footerParts.join(' | '), 48, 764, { width: 499, align: 'center', lineGap: 1 });
}

function createEmployeeProfilePdf({ employee, settings, logoBuffer }) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const document = new PDFDocument({ size: 'A4', margin: 48, autoFirstPage: true, bufferPages: true });
    const billingInfo = settings?.billingInfo || {};
    const companyName = settings?.companyName || billingInfo.legalCompanyName || 'Şirket';

    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);
    registerPdfFonts(document);

    document.rect(0, 0, 595.28, 108).fill('#f8fafc');
    document.moveTo(48, 108).lineTo(547, 108).strokeColor('#dbe4ef').lineWidth(1).stroke();

    document.fillColor('#0f172a');
    if (logoBuffer) {
      try {
        document.image(logoBuffer, 48, 34, { fit: [104, 44], align: 'left' });
      } catch {
        document.font('AppBold').fontSize(12).text(companyName, 48, 44, { width: 180 });
      }
    } else {
      document.font('AppBold').fontSize(12).text(companyName, 48, 44, { width: 180 });
    }

    document
      .font('AppBold')
      .fontSize(16)
      .fillColor('#0f172a')
      .text('Personel Bilgi ve Görev Tanımı Formu', 210, 34, { align: 'right', width: 337 });

    document
      .font('AppRegular')
      .fontSize(8.5)
      .fillColor('#64748b')
      .text(`Belge No: ${employee._id.toString().slice(-8).toUpperCase()}`, 210, 60, { align: 'right', width: 337 })
      .text(`Düzenleme Tarihi: ${formatDate(new Date())}`, 210, 75, { align: 'right', width: 337 });

    let y = 132;
    drawSectionTitle(document, 'Personel Bilgileri', y);
    y += 35;

    y = drawInfoGrid(document, [
      { label: 'Ad Soyad', value: getFullName(employee) },
      { label: 'TCKN', value: employee.tckn || '-' },
      { label: 'E-posta', value: employee.workEmail || employee.email || '-' },
      { label: 'Telefon', value: employee.phone || '-' },
      { label: 'Doğum Tarihi', value: formatDate(employee.birthDate) },
      { label: 'İşe Başlangıç', value: formatDate(employee.startDate) },
      { label: 'Departman', value: employee.department || '-' },
      { label: 'Ünvan', value: employee.title || '-' },
      { label: 'Çalışma Tipi', value: translateEmploymentType(employee.employmentType) },
      { label: 'Durum', value: employee.status === 'ACTIVE' ? 'Aktif' : 'Pasif' }
    ], 48, y);

    y += 28;
    drawSectionTitle(document, 'Görev Tanımı', y);
    y += 35;

    const description = employee.jobDescription || '-';
    const descriptionHeight = document
      .font('AppRegular')
      .fontSize(9.5)
      .heightOfString(description, { width: 459, lineGap: 3 });
    const descriptionCardHeight = Math.min(Math.max(descriptionHeight + 32, 130), 265);

    drawRoundedRect(document, 48, y, 499, descriptionCardHeight, { fill: '#ffffff', stroke: '#dbe4ef' });
    document
      .font('AppRegular')
      .fontSize(9.5)
      .fillColor('#0f172a')
      .text(description, 68, y + 18, {
        width: 459,
        height: descriptionCardHeight - 34,
        align: 'left',
        lineGap: 3,
        ellipsis: true
      });

    y += descriptionCardHeight + 18;
    if (y > 666) {
      document.addPage();
      y = 72;
    }

    document
      .font('AppRegular')
      .fontSize(8.3)
      .fillColor('#475569')
      .text('Yukarıdaki personel bilgileri ve görev tanımı okunmuş, taraflarca kabul edilmiştir.', 48, y, {
        width: 499,
        align: 'center'
      });

    y += 24;
    const signatureBoxWidth = 220;
    const signatureBoxHeight = 64;
    drawRoundedRect(document, 48, y, signatureBoxWidth, signatureBoxHeight, { fill: '#ffffff', stroke: '#cbd5e1' });
    drawRoundedRect(document, 327, y, signatureBoxWidth, signatureBoxHeight, { fill: '#ffffff', stroke: '#cbd5e1' });

    document.font('AppBold').fontSize(9).fillColor('#0f172a');
    document.text('Personel', 66, y + 10, { width: signatureBoxWidth - 36, align: 'center' });
    document.text('Yetkili', 345, y + 10, { width: signatureBoxWidth - 36, align: 'center' });
    document.font('AppRegular').fontSize(8).fillColor('#64748b');
    document.text(getFullName(employee), 66, y + 27, { width: signatureBoxWidth - 36, align: 'center' });
    document.text(companyName, 345, y + 27, { width: signatureBoxWidth - 36, align: 'center' });
    document.moveTo(76, y + 49).lineTo(250, y + 49).strokeColor('#94a3b8').lineWidth(1).stroke();
    document.moveTo(355, y + 49).lineTo(529, y + 49).strokeColor('#94a3b8').lineWidth(1).stroke();

    const pageRange = document.bufferedPageRange();
    for (let index = pageRange.start; index < pageRange.start + pageRange.count; index += 1) {
      document.switchToPage(index);
      drawFooter(document, settings);
    }

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
