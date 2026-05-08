const { chromium } = require('playwright-chromium');
const { Quote, QUOTE_STATUS } = require('../../models/Quote');
const { Customer } = require('../../models/Customer');
const { CompanySettings } = require('../../models/CompanySettings');
const { ApiError } = require('../../utils/apiError');
const { getPagination } = require('../../utils/pagination');

function calcTotals(items) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const vatTotal = items.reduce((s, i) => s + (i.quantity * i.unitPrice * (i.vatRate / 100)), 0);
  return { subtotal, vatTotal, grandTotal: subtotal + vatTotal };
}

function buildItems(rawItems) {
  return rawItems.map((i) => ({
    description: i.description,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    vatRate: i.vatRate ?? 18,
    lineTotal: parseFloat((i.quantity * i.unitPrice).toFixed(2))
  }));
}

async function generateQuoteNumber() {
  const year = new Date().getFullYear();
  const count = await Quote.countDocuments({ number: { $regex: `^TKL-${year}-` } });
  return `TKL-${year}-${String(count + 1).padStart(3, '0')}`;
}


async function createQuote({ customerId, items: rawItems, validUntil, notes, currency }, userId) {
  const customer = await Customer.findById(customerId).lean();
  if (!customer) throw new ApiError(404, 'Müşteri bulunamadı.');

  const items = buildItems(rawItems);
  const totals = calcTotals(items);
  const number = await generateQuoteNumber();

  return Quote.create({
    number,
    customerId,
    createdByUserId: userId,
    items,
    ...totals,
    currency: currency || 'TRY',
    validUntil: validUntil || null,
    notes: notes || ''
  });
}

async function listQuotes({ page, limit, status, customerId }) {
  const { skip } = getPagination({ page, limit });
  const query = {};
  if (status) query.status = status;
  if (customerId) query.customerId = customerId;

  const [items, total] = await Promise.all([
    Quote.find(query)
      .populate('customerId', 'companyName taxNumber')
      .populate('createdByUserId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Quote.countDocuments(query)
  ]);

  return { items, total, page, limit };
}

async function getQuoteById(id) {
  const quote = await Quote.findById(id)
    .populate('customerId', 'companyName taxNumber taxOffice address phone')
    .populate('createdByUserId', 'firstName lastName')
    .lean();

  if (!quote) throw new ApiError(404, 'Teklif bulunamadı.');
  return quote;
}

async function updateQuote(id, { items: rawItems, status, validUntil, notes, currency }) {
  const quote = await Quote.findById(id);
  if (!quote) throw new ApiError(404, 'Teklif bulunamadı.');


  if (rawItems !== undefined) {
    const items = buildItems(rawItems);
    const totals = calcTotals(items);
    quote.items = items;
    Object.assign(quote, totals);
  }
  if (status !== undefined) quote.status = status;
  if (validUntil !== undefined) quote.validUntil = validUntil;
  if (notes !== undefined) quote.notes = notes;
  if (currency !== undefined) quote.currency = currency;

  await quote.save();
  return quote.toObject();
}

async function deleteQuote(id) {
  const quote = await Quote.findById(id);
  if (!quote) throw new ApiError(404, 'Teklif bulunamadı.');
  if (quote.status !== QUOTE_STATUS.DRAFT) throw new ApiError(409, 'Yalnızca taslak teklifler silinebilir.');

  await Quote.findByIdAndDelete(id);
}

function formatMoney(value = 0, currency = 'TRY') {
  return `${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('tr-TR') : '-';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function optionalLine(label, value) {
  if (!value) return '';
  return `<div><span>${escapeHtml(label)}</span>${escapeHtml(value)}</div>`;
}

function imageMarkup(url, alt, className) {
  if (!url) return '';
  return `<img class="${className}" src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" />`;
}

function makeSvgDataUrl(label, background = '#1A0B3A') {
  const safeLabel = String(label || '').slice(0, 10);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="${background}"/><text x="48" y="56" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="800" fill="#fff">${escapeHtml(safeLabel)}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function buildQuoteTemplateConfig(quote, settings = {}) {
  const customer = quote.customerId || {};
  const billingInfo = settings.billingInfo || {};
  const companyName = settings.companyName || billingInfo.legalCompanyName || 'OneDesk';
  const subtotal = Number(quote.subtotal || 0);
  const vatTotal = Number(quote.vatTotal || 0);
  const totalQuantity = (quote.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const adamGun = totalQuantity > 0 ? totalQuantity : 1;
  const birimFiyat = adamGun > 0 ? Math.round(subtotal / adamGun) : subtotal;
  const kdvOrani = subtotal > 0 ? Math.round((vatTotal / subtotal) * 100) : 20;
  const firstItem = quote.items?.[0];
  const projectTitle = firstItem?.description || 'Yazılım Geliştirme Projesi';

  return {
    sirket: {
      ad: companyName,
      web: settings.website || '',
      eposta: billingInfo.billingEmail || '',
      telefon: billingInfo.phone || '',
      logo: settings.logoUrl || makeSvgDataUrl(companyName.slice(0, 2).toUpperCase('tr-TR')),
      logoBg: '#0F0425'
    },
    teklif: {
      musteri: customer.companyName || '-',
      baslik: projectTitle,
      altBaslik: quote.notes || `${customer.companyName || 'Müşteri'} için hazırlanan proje teklifidir.`,
      no: quote.number,
      tarih: formatDate(quote.createdAt),
      gecerlilik: formatDate(quote.validUntil)
    },
    ozet: {
      aciklama: `${projectTitle} kapsamında ihtiyaç duyulan analiz, geliştirme, test ve teslim süreçleri için hazırlanan teklif özetidir.`,
      efor: `${adamGun}`,
      sure: 'Planlama sonrası netleşir',
      deneyim: 'Kurumsal proje deneyimi',
      nedenBiz: `${companyName}, modern yazılım geliştirme yaklaşımı, sürdürülebilir mimari ve uçtan uca teslimat deneyimiyle projeyi güvenli şekilde hayata geçirmeyi hedefler.`
    },
    yaklasim: [
      { no: '01', baslik: 'Analiz', aciklama: 'İhtiyaçların netleştirilmesi, kapsamın doğrulanması ve teslimat planının çıkarılması.' },
      { no: '02', baslik: 'Tasarım', aciklama: 'Kullanıcı deneyimi, teknik mimari ve veri akışlarının tasarlanması.' },
      { no: '03', baslik: 'Geliştirme', aciklama: 'Frontend, backend ve entegrasyon geliştirmelerinin iteratif olarak tamamlanması.' },
      { no: '04', baslik: 'Teslim', aciklama: 'Test, canlıya alma ve operasyonel devrin kontrollü şekilde gerçekleştirilmesi.' }
    ],
    teknolojiler: [
      { ad: 'React', logo: makeSvgDataUrl('R', '#2563EB') },
      { ad: 'Node.js', logo: makeSvgDataUrl('N', '#16A34A') },
      { ad: 'MongoDB', logo: makeSvgDataUrl('M', '#15803D') },
      { ad: 'Azure', logo: makeSvgDataUrl('A', '#0284C7') },
      { ad: 'API', logo: makeSvgDataUrl('API', '#7C3AED') }
    ],
    kapsam: {
      hedef: `${customer.companyName || 'Müşteri'} için teklif kapsamındaki modüllerin kaliteli, ölçeklenebilir ve sürdürülebilir şekilde geliştirilmesi.`,
      altyapi: [
        { kod: 'FE', baslik: 'Frontend', aciklama: 'Modern, hızlı ve kullanıcı dostu web arayüzleri.' },
        { kod: 'BE', baslik: 'Backend', aciklama: 'Güvenli API, iş kuralları ve servis katmanı.' },
        { kod: 'DB', baslik: 'Veri', aciklama: 'MongoDB üzerinde sürdürülebilir veri modeli.' },
        { kod: 'QA', baslik: 'Test', aciklama: 'Fonksiyonel kontrol ve teslim öncesi doğrulama.' }
      ]
    },
    referanslar: (settings.companyReferences || [])
      .filter((reference) => reference.logoUrl)
      .map((reference) => ({ ad: reference.name || 'Referans', logo: reference.logoUrl })),
    projeler: [],
    moduller: (quote.items || []).map((item, index) => ({
      no: String(index + 1).padStart(2, '0'),
      ad: item.description,
      madde: 1,
      fe: Number(item.quantity || 0),
      be: 0
    })),
    fiyat: {
      adamGun,
      birimFiyat,
      kdvOrani
    }
  };
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(500, 'Teklif HTML şablonu okunamadı.');
  }
  return response.text();
}

function injectQuoteConfig(templateHtml, config) {
  const overrideScript = `<script>
const ONEDESK_CONFIG = ${JSON.stringify(config).replace(/</g, '\\u003c')};
CONFIG.sirket = { ...(CONFIG.sirket || {}), ...(ONEDESK_CONFIG.sirket || {}) };
CONFIG.teklif = { ...(CONFIG.teklif || {}), ...(ONEDESK_CONFIG.teklif || {}) };
CONFIG.ozet = { ...(CONFIG.ozet || {}), ...(ONEDESK_CONFIG.ozet || {}) };
const ONEDESK_ORIGINAL_KAPSAM = CONFIG.kapsam || {};
CONFIG.kapsam = { ...ONEDESK_ORIGINAL_KAPSAM, ...(ONEDESK_CONFIG.kapsam || {}) };
if (Array.isArray(ONEDESK_ORIGINAL_KAPSAM.altyapi) && ONEDESK_ORIGINAL_KAPSAM.altyapi.length > 0) {
  CONFIG.kapsam.altyapi = ONEDESK_ORIGINAL_KAPSAM.altyapi;
}
CONFIG.referanslar = ONEDESK_CONFIG.referanslar || CONFIG.referanslar || [];
CONFIG.moduller = ONEDESK_CONFIG.moduller || CONFIG.moduller || [];
CONFIG.fiyat = { ...(CONFIG.fiyat || {}), ...(ONEDESK_CONFIG.fiyat || {}) };
if (!Array.isArray(CONFIG.yaklasim) || CONFIG.yaklasim.length === 0) CONFIG.yaklasim = ONEDESK_CONFIG.yaklasim || [];
if (!Array.isArray(CONFIG.teknolojiler) || CONFIG.teknolojiler.length === 0) CONFIG.teknolojiler = ONEDESK_CONFIG.teknolojiler || [];
if (!Array.isArray(CONFIG.projeler) || CONFIG.projeler.length === 0) CONFIG.projeler = ONEDESK_CONFIG.projeler || [];
</script>`;
  const nextHtml = templateHtml.replace(/(<script>\s*[\s\S]*?const\s+CONFIG\s*=\s*[\s\S]*?<\/script>)/i, `$1\n${overrideScript}`);

  if (nextHtml === templateHtml) {
    throw new ApiError(500, 'Teklif HTML şablonunda değiştirilebilir CONFIG bloğu bulunamadı.');
  }

  return nextHtml;
}

function buildQuoteHtml(quote, settings = {}) {
  const customer = quote.customerId || {};
  const billingInfo = settings.billingInfo || {};
  const companyName = settings.companyName || billingInfo.legalCompanyName || 'OneDesk';
  const references = (settings.companyReferences || []).filter((reference) => reference.logoUrl);

  const itemRows = (quote.items || []).map((item, index) => `
    <tr>
      <td class="muted">${index + 1}</td>
      <td class="description">${escapeHtml(item.description)}</td>
      <td class="numeric">${escapeHtml(item.quantity)}</td>
      <td class="numeric">${escapeHtml(formatMoney(item.unitPrice, quote.currency))}</td>
      <td class="numeric">%${escapeHtml(item.vatRate)}</td>
      <td class="numeric strong">${escapeHtml(formatMoney(item.lineTotal, quote.currency))}</td>
    </tr>
  `).join('');

  const referenceCards = references.map((reference) => `
    <article class="reference-card">
      <div class="reference-logo-wrap">
        ${imageMarkup(reference.logoUrl, reference.name || 'Referans', 'reference-logo')}
      </div>
      <div class="reference-name">${escapeHtml(reference.name || 'Referans')}</div>
    </article>
  `).join('');

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Teklif ${escapeHtml(quote.number)}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #eef2f7;
      color: #111827;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      font-size: 12px;
      line-height: 1.45;
    }
    .page {
      min-height: 297mm;
      padding: 14mm;
      background:
        radial-gradient(circle at 12% 8%, rgba(37, 99, 235, 0.13), transparent 26%),
        linear-gradient(180deg, #f8fafc 0%, #ffffff 34%, #ffffff 100%);
      page-break-after: always;
      position: relative;
    }
    .page:last-child { page-break-after: auto; }
    .hero {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 18px;
      padding: 26px;
      border-radius: 28px;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 58%, #2563eb 100%);
      color: #fff;
      overflow: hidden;
      position: relative;
    }
    .hero::after {
      content: "";
      position: absolute;
      width: 230px;
      height: 230px;
      right: -70px;
      top: -90px;
      border-radius: 999px;
      background: rgba(255,255,255,0.11);
    }
    .eyebrow {
      color: #bfdbfe;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    h1 {
      margin: 0;
      font-size: 44px;
      line-height: 0.95;
      letter-spacing: -0.055em;
    }
    .hero-company {
      margin-top: 18px;
      max-width: 370px;
      color: #dbeafe;
      font-size: 12px;
    }
    .logo-panel {
      align-self: start;
      justify-self: end;
      width: 170px;
      min-height: 86px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 22px;
      background: rgba(255,255,255,0.96);
      box-shadow: 0 20px 50px rgba(15,23,42,0.24);
      padding: 16px;
      z-index: 1;
    }
    .company-logo { max-width: 138px; max-height: 58px; object-fit: contain; }
    .logo-fallback { color: #0f172a; font-size: 20px; font-weight: 900; letter-spacing: -0.04em; }
    .quote-meta {
      margin-top: 18px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    .meta-card, .info-card, .total-card, .note-card {
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      background: rgba(255,255,255,0.92);
      box-shadow: 0 14px 34px rgba(15,23,42,0.06);
    }
    .meta-card { padding: 12px 14px; }
    .label {
      display: block;
      color: #64748b;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .value { color: #0f172a; font-weight: 800; font-size: 13px; }
    .section-title {
      margin: 26px 0 12px;
      color: #0f172a;
      font-size: 16px;
      font-weight: 900;
      letter-spacing: -0.03em;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .info-card { padding: 18px; min-height: 132px; }
    .info-card h2 {
      margin: 0 0 10px;
      color: #0f172a;
      font-size: 17px;
      letter-spacing: -0.03em;
    }
    .info-lines div { margin-top: 5px; color: #334155; }
    .info-lines span { color: #64748b; display: inline-block; min-width: 92px; font-weight: 700; }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      background: #fff;
      box-shadow: 0 14px 34px rgba(15,23,42,0.05);
    }
    thead th {
      background: #0f172a;
      color: #fff;
      padding: 11px 12px;
      font-size: 10px;
      text-align: left;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    tbody td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    tbody tr:nth-child(even) td { background: #f8fafc; }
    tbody tr:last-child td { border-bottom: 0; }
    .description { width: 38%; font-weight: 700; color: #0f172a; }
    .numeric { text-align: right; white-space: nowrap; }
    .muted { color: #64748b; }
    .strong { font-weight: 900; color: #0f172a; }
    .summary {
      margin-top: 16px;
      display: grid;
      grid-template-columns: 1fr 290px;
      gap: 18px;
      align-items: start;
    }
    .note-card { padding: 16px 18px; color: #475569; min-height: 104px; }
    .note-card h3 { margin: 0 0 8px; color: #0f172a; font-size: 13px; }
    .total-card { padding: 16px 18px; }
    .total-row {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      padding: 8px 0;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }
    .total-row.grand {
      margin-top: 6px;
      padding: 13px 14px;
      border: 0;
      border-radius: 14px;
      color: #fff;
      background: linear-gradient(135deg, #1d4ed8, #0f172a);
      font-size: 15px;
      font-weight: 900;
    }
    .footer {
      position: absolute;
      left: 14mm;
      right: 14mm;
      bottom: 9mm;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 9px;
    }
    .references-page {
      background: linear-gradient(180deg, #ffffff, #f8fafc);
    }
    .references-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 22px;
      margin-bottom: 22px;
    }
    .references-header h2 {
      margin: 0;
      color: #0f172a;
      font-size: 30px;
      letter-spacing: -0.05em;
    }
    .references-header p { margin: 8px 0 0; color: #64748b; max-width: 440px; }
    .reference-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
    .reference-card {
      min-height: 112px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 10px;
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      background: #fff;
      box-shadow: 0 16px 36px rgba(15,23,42,0.06);
      break-inside: avoid;
    }
    .reference-logo-wrap {
      height: 54px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .reference-logo { max-width: 130px; max-height: 50px; object-fit: contain; }
    .reference-name {
      text-align: center;
      color: #334155;
      font-size: 10px;
      font-weight: 800;
    }
    .references-empty {
      padding: 24px;
      border-radius: 18px;
      background: #f8fafc;
      color: #64748b;
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div>
        <div class="eyebrow">Profesyonel teklif</div>
        <h1>Teklif</h1>
        <div class="hero-company">
          <strong>${escapeHtml(companyName)}</strong><br />
          ${escapeHtml([billingInfo.legalCompanyName, billingInfo.address, settings.website].filter(Boolean).join(' • '))}
        </div>
      </div>
      <div class="logo-panel">
        ${settings.logoUrl ? imageMarkup(settings.logoUrl, companyName, 'company-logo') : `<div class="logo-fallback">${escapeHtml(companyName)}</div>`}
      </div>
    </section>

    <section class="quote-meta">
      <div class="meta-card"><span class="label">Teklif No</span><span class="value">${escapeHtml(quote.number)}</span></div>
      <div class="meta-card"><span class="label">Düzenleme</span><span class="value">${escapeHtml(formatDate(quote.createdAt))}</span></div>
      <div class="meta-card"><span class="label">Geçerlilik</span><span class="value">${escapeHtml(formatDate(quote.validUntil))}</span></div>
      <div class="meta-card"><span class="label">Para Birimi</span><span class="value">${escapeHtml(quote.currency)}</span></div>
    </section>

    <h2 class="section-title">Taraf Bilgileri</h2>
    <section class="info-grid">
      <article class="info-card">
        <span class="label">Teklif Veren</span>
        <h2>${escapeHtml(companyName)}</h2>
        <div class="info-lines">
          ${optionalLine('Yasal Unvan', billingInfo.legalCompanyName)}
          ${optionalLine('Vergi No', billingInfo.taxNumber)}
          ${optionalLine('Vergi Dairesi', billingInfo.taxOffice)}
          ${optionalLine('Adres', billingInfo.address)}
          ${optionalLine('Web', settings.website)}
        </div>
      </article>
      <article class="info-card">
        <span class="label">Alıcı Firma</span>
        <h2>${escapeHtml(customer.companyName || '-')}</h2>
        <div class="info-lines">
          ${optionalLine('Vergi No', customer.taxNumber)}
          ${optionalLine('Vergi Dairesi', customer.taxOffice)}
          ${optionalLine('Telefon', customer.phone)}
          ${optionalLine('Adres', customer.address)}
        </div>
      </article>
    </section>

    <h2 class="section-title">Teklif Kalemleri</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Açıklama</th>
          <th class="numeric">Miktar</th>
          <th class="numeric">Birim Fiyat</th>
          <th class="numeric">KDV</th>
          <th class="numeric">Toplam</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <section class="summary">
      <article class="note-card">
        <h3>Notlar</h3>
        <div>${quote.notes ? escapeHtml(quote.notes) : 'Bu teklif, belirtilen geçerlilik tarihine kadar geçerlidir.'}</div>
      </article>
      <article class="total-card">
        <div class="total-row"><span>Ara Toplam</span><strong>${escapeHtml(formatMoney(quote.subtotal, quote.currency))}</strong></div>
        <div class="total-row"><span>KDV Toplam</span><strong>${escapeHtml(formatMoney(quote.vatTotal, quote.currency))}</strong></div>
        <div class="total-row grand"><span>GENEL TOPLAM</span><span>${escapeHtml(formatMoney(quote.grandTotal, quote.currency))}</span></div>
      </article>
    </section>

    <footer class="footer">
      <span>${escapeHtml(companyName)}</span>
      <span>${escapeHtml([billingInfo.phone, billingInfo.billingEmail, settings.website].filter(Boolean).join(' • '))}</span>
    </footer>
  </main>

  <section class="page references-page">
    <div class="references-header">
      <div>
        <div class="eyebrow" style="color:#2563eb">Güven ve deneyim</div>
        <h2>Şirket Referansları</h2>
        <p>Şirket ayarlarında kayıtlı referans logoları teklifin sonunda otomatik olarak yer alır.</p>
      </div>
      <div class="logo-panel" style="width:140px;min-height:70px;box-shadow:none;border:1px solid #e2e8f0">
        ${settings.logoUrl ? imageMarkup(settings.logoUrl, companyName, 'company-logo') : `<div class="logo-fallback">${escapeHtml(companyName)}</div>`}
      </div>
    </div>
    ${referenceCards ? `<div class="reference-grid">${referenceCards}</div>` : '<div class="references-empty">Henüz şirket referansı eklenmedi.</div>'}
  </section>
</body>
</html>`;
}

async function renderHtmlToPdf(html) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page
      .waitForFunction(() => Array.from(document.images).every((image) => image.complete), null, { timeout: 5000 })
      .catch(() => {});
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

async function buildQuotePdf(quote) {
  const settings = (await CompanySettings.findOne().lean()) || {};
  if (settings.quoteTemplate?.htmlUrl) {
    const templateHtml = await fetchText(settings.quoteTemplate.htmlUrl);
    const config = buildQuoteTemplateConfig(quote, settings);
    const html = injectQuoteConfig(templateHtml, config);
    return renderHtmlToPdf(html);
  }

  const html = buildQuoteHtml(quote, settings);
  return renderHtmlToPdf(html);
}

function buildPrintHtml(doc, type) {
  const customer = doc.customerId || {};
  const title = 'TEKLİF';
  const numberLabel = 'Teklif No';
  const dateLabel = 'Geçerlilik';
  const dateValue = doc.validUntil ? new Date(doc.validUntil).toLocaleDateString('tr-TR') : '-';
  const issueDate = new Date(doc.createdAt).toLocaleDateString('tr-TR');

  const rows = (doc.items || []).map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.description}</td>
      <td>${item.quantity}</td>
      <td>${item.unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${doc.currency}</td>
      <td>%${item.vatRate}</td>
      <td>${item.lineTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${doc.currency}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"/>
<title>${title} ${doc.number}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;font-size:13px;color:#1e293b;padding:32px}
  h1{font-size:28px;font-weight:900;letter-spacing:-1px;color:#0f172a}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}
  .logo{font-size:22px;font-weight:900;color:#0f172a}
  .logo span{display:inline-block;width:36px;height:36px;background:#0f172a;color:#fff;border-radius:8px;text-align:center;line-height:36px;margin-right:8px;font-size:18px}
  .meta{text-align:right;color:#64748b;font-size:12px;line-height:1.8}
  .meta strong{color:#0f172a;font-size:14px}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px}
  .party{background:#f8fafc;border-radius:10px;padding:16px}
  .party-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;margin-bottom:8px}
  .party-name{font-size:15px;font-weight:800;color:#0f172a;margin-bottom:4px}
  table{width:100%;border-collapse:collapse;margin-bottom:24px}
  thead tr{background:#0f172a;color:#fff}
  thead th{padding:10px 12px;text-align:left;font-size:12px;font-weight:600}
  tbody tr:nth-child(even){background:#f8fafc}
  tbody td{padding:9px 12px;border-bottom:1px solid #e2e8f0;font-size:13px}
  .totals{display:flex;justify-content:flex-end}
  .totals-box{min-width:280px}
  .total-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:13px}
  .total-row.grand{font-size:16px;font-weight:900;color:#0f172a;border:none;padding-top:12px}
  .notes{margin-top:24px;color:#64748b;font-size:12px}
  .footer{margin-top:40px;text-align:center;color:#94a3b8;font-size:11px;border-top:1px solid #e2e8f0;padding-top:16px}
  @media print{body{padding:0}button{display:none}}
</style></head><body>
<div class="header">
  <div>
    <div class="logo"><span>O</span>OneDesk</div>
    <h1>${title}</h1>
  </div>
  <div class="meta">
    <div><strong>${numberLabel}: ${doc.number}</strong></div>
    <div>Düzenleme: ${issueDate}</div>
    <div>${dateLabel}: ${dateValue}</div>
  </div>
</div>
<div class="parties">
  <div class="party">
    <div class="party-label">Alıcı Firma</div>
    <div class="party-name">${customer.companyName || '-'}</div>
    ${customer.taxNumber ? `<div>Vergi No: ${customer.taxNumber}</div>` : ''}
    ${customer.taxOffice ? `<div>Vergi Dairesi: ${customer.taxOffice}</div>` : ''}
    ${customer.address ? `<div>${customer.address}</div>` : ''}
    ${customer.phone ? `<div>${customer.phone}</div>` : ''}
  </div>
  <div class="party">
    <div class="party-label">Düzenleyen</div>
    <div class="party-name">OneDesk İşletme</div>
  </div>
</div>
<table>
  <thead><tr><th>#</th><th>Açıklama</th><th>Miktar</th><th>Birim Fiyat</th><th>KDV</th><th>Toplam</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="totals">
  <div class="totals-box">
    <div class="total-row"><span>Ara Toplam</span><span>${doc.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${doc.currency}</span></div>
    <div class="total-row"><span>KDV Toplam</span><span>${doc.vatTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${doc.currency}</span></div>
    <div class="total-row grand"><span>GENEL TOPLAM</span><span>${doc.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${doc.currency}</span></div>
  </div>
</div>
${doc.notes ? `<div class="notes"><strong>Notlar:</strong> ${doc.notes}</div>` : ''}
<div class="footer">Bu belge OneDesk platformu üzerinden oluşturulmuştur.</div>
<script>window.onload=()=>window.print()</script>
</body></html>`;
}

module.exports = {
  createQuote,
  listQuotes,
  getQuoteById,
  updateQuote,
  deleteQuote,
  buildQuotePdf,
  buildPrintHtml
};
