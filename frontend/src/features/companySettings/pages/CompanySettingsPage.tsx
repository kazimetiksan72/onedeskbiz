import { useEffect, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react';
import {
  deleteCompanyReference,
  getCompanySettings,
  uploadCompanyLogo,
  uploadCompanyReferenceLogos,
  uploadQuoteTemplate,
  upsertCompanySettings,
  type CompanySettingsPayload
} from '../api/companySettings.api';
import type { CompanySettings } from '../types/companySettings.types';
import { PageHeader } from '../../../components/PageHeader';
import { ModalPortal } from '../../../components/ModalPortal';
import { useAuthStore } from '../../auth/auth.store';

const initial: Omit<CompanySettings, '_id'> = {
  companyName: '',
  website: '',
  logoUrl: '',
  timezone: 'Europe/Istanbul',
  departments: [],
  quoteTemplate: {},
  companyReferences: [],
  billingInfo: {
    legalCompanyName: '',
    taxNumber: '',
    taxOffice: '',
    billingEmail: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    bankAccounts: []
  }
};

type ModalType = 'general' | 'tax' | 'banks' | 'departments' | null;
type BankAccount = NonNullable<CompanySettings['billingInfo']['bankAccounts']>[number];

export function CompanySettingsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [settings, setSettings] = useState<Omit<CompanySettings, '_id'>>(initial);
  const [draft, setDraft] = useState<Omit<CompanySettings, '_id'>>(initial);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [newDepartment, setNewDepartment] = useState('');
  const [message, setMessage] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDragActive, setLogoDragActive] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [referenceUploading, setReferenceUploading] = useState(false);
  const [referenceDragActive, setReferenceDragActive] = useState(false);
  const [selectedReferenceFiles, setSelectedReferenceFiles] = useState<File[]>([]);
  const [referenceDeletingId, setReferenceDeletingId] = useState<string | null>(null);
  const [quoteTemplateUploading, setQuoteTemplateUploading] = useState(false);
  const [selectedQuoteTemplate, setSelectedQuoteTemplate] = useState<File | null>(null);

  useEffect(() => {
    getCompanySettings().then((data) => {
      if (!data) return;
      setSettings(normalizeSettings(data));
    });
  }, []);

  if (!isAdmin) {
    return <div className="page-card">Şirket ayarlarını yalnızca admin kullanıcılar yönetebilir.</div>;
  }

  const openModal = (type: Exclude<ModalType, null>) => {
    setDraft(cloneSettings(settings));
    setNewDepartment('');
    setMessage('');
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setNewDepartment('');
  };

  const saveSection = async (payload: CompanySettingsPayload, successMessage: string) => {
    const updated = await upsertCompanySettings(payload);
    setSettings(normalizeSettings(updated));
    setMessage(successMessage);
    closeModal();
  };

  const uploadLogoFile = async () => {
    if (!selectedLogoFile) return;

    setLogoUploading(true);
    setMessage('');
    setLogoDragActive(false);

    try {
      const updated = await uploadCompanyLogo(selectedLogoFile);
      setSettings(normalizeSettings(updated));
      setMessage('Şirket logosu yüklendi.');
      setSelectedLogoFile(null);
    } catch (requestError: any) {
      setMessage(requestError?.response?.data?.message || 'Logo yüklenemedi.');
    } finally {
      setLogoUploading(false);
    }
  };

  const onLogoSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setSelectedLogoFile(file);
    setMessage(`${file.name} seçildi. Yüklemek için Logo Yükle butonuna basın.`);
  };

  const onLogoDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setLogoDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedLogoFile(file);
    setMessage(`${file.name} seçildi. Yüklemek için Logo Yükle butonuna basın.`);
  };

  const setReferenceFiles = (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setMessage('Referans logosu için JPG, PNG veya WEBP dosyası seçin.');
      return;
    }

    setSelectedReferenceFiles(imageFiles);
    setMessage(`${imageFiles.length} referans logosu seçildi. Yüklemek için Referansları Yükle butonuna basın.`);
  };

  const onReferenceSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    event.target.value = '';
    if (!files?.length) return;
    setReferenceFiles(files);
  };

  const onReferenceDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setReferenceDragActive(false);
    const files = event.dataTransfer.files;
    if (!files?.length) return;
    setReferenceFiles(files);
  };

  const uploadReferenceFiles = async () => {
    if (selectedReferenceFiles.length === 0) return;

    setReferenceUploading(true);
    setMessage('');

    try {
      const updated = await uploadCompanyReferenceLogos(selectedReferenceFiles);
      setSettings(normalizeSettings(updated));
      setSelectedReferenceFiles([]);
      setMessage('Referans logoları yüklendi.');
    } catch (requestError: any) {
      setMessage(requestError?.response?.data?.message || 'Referans logoları yüklenemedi.');
    } finally {
      setReferenceUploading(false);
    }
  };

  const removeCompanyReference = async (referenceId: string) => {
    setReferenceDeletingId(referenceId);
    setMessage('');

    try {
      const updated = await deleteCompanyReference(referenceId);
      setSettings(normalizeSettings(updated));
      setMessage('Referans logosu silindi.');
    } catch (requestError: any) {
      setMessage(requestError?.response?.data?.message || 'Referans logosu silinemedi.');
    } finally {
      setReferenceDeletingId(null);
    }
  };

  const onQuoteTemplateSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const isHtml = file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm');
    if (!isHtml) {
      setMessage('Teklif şablonu için HTML dosyası seçin.');
      return;
    }

    setSelectedQuoteTemplate(file);
    setMessage(`${file.name} seçildi. Yüklemek için Şablonu Yükle butonuna basın.`);
  };

  const uploadSelectedQuoteTemplate = async () => {
    if (!selectedQuoteTemplate) return;

    setQuoteTemplateUploading(true);
    setMessage('');

    try {
      const updated = await uploadQuoteTemplate(selectedQuoteTemplate);
      setSettings(normalizeSettings(updated));
      setSelectedQuoteTemplate(null);
      setMessage('Teklif HTML şablonu yüklendi.');
    } catch (requestError: any) {
      setMessage(requestError?.response?.data?.message || 'Teklif şablonu yüklenemedi.');
    } finally {
      setQuoteTemplateUploading(false);
    }
  };

  const addDepartment = () => {
    const value = newDepartment.trim();
    if (!value) return;

    const exists = (draft.departments || []).some((item) => item.toLowerCase() === value.toLowerCase());
    if (exists) return;

    setDraft({ ...draft, departments: [...(draft.departments || []), value] });
    setNewDepartment('');
  };

  const updateDepartment = (index: number, value: string) => {
    const next = [...(draft.departments || [])];
    next[index] = value;
    setDraft({ ...draft, departments: next });
  };

  const removeDepartment = (index: number) => {
    const next = [...(draft.departments || [])];
    next.splice(index, 1);
    setDraft({ ...draft, departments: next });
  };

  const addBankAccount = () => {
    const next = [...(draft.billingInfo.bankAccounts || [])];
    next.push({ bankName: '', branchName: '', iban: '', swiftCode: '' });
    setDraft({ ...draft, billingInfo: { ...draft.billingInfo, bankAccounts: next } });
  };

  const updateBankAccount = (index: number, key: keyof BankAccount, value: string) => {
    const next = [...(draft.billingInfo.bankAccounts || [])];
    next[index] = { ...(next[index] || {}), [key]: value };
    setDraft({ ...draft, billingInfo: { ...draft.billingInfo, bankAccounts: next } });
  };

  const removeBankAccount = (index: number) => {
    const next = [...(draft.billingInfo.bankAccounts || [])];
    next.splice(index, 1);
    setDraft({ ...draft, billingInfo: { ...draft.billingInfo, bankAccounts: next } });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Şirket Ayarları" subtitle="Şirket, vergi, banka ve departman bilgilerini yönetin" />

      <section
        className={`page-card relative overflow-hidden space-y-4 border-2 border-dashed transition ${
          logoDragActive
            ? 'scale-[1.01] border-brand-500 bg-brand-50 shadow-lg ring-4 ring-brand-100'
            : selectedLogoFile
              ? 'border-emerald-400 bg-emerald-50/40'
              : 'border-slate-200'
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setLogoDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setLogoDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setLogoDragActive(false);
        }}
        onDrop={onLogoDrop}
      >
        {logoDragActive ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-brand-600/10 backdrop-blur-[1px]">
            <div className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 shadow-lg">
              Logoyu buraya bırakın
            </div>
          </div>
        ) : null}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Şirket logosu" className="h-full w-full object-contain p-2" />
              ) : (
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Logo</span>
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Şirket Logosu</h2>
              <p className="text-sm text-slate-500">JPG, PNG veya WEBP formatında logo yükleyin ya da bu alana sürükleyip bırakın.</p>
              {selectedLogoFile ? (
                <p className="mt-1 text-sm font-medium text-emerald-700">
                  Seçilen dosya: {selectedLogoFile.name}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="btn-secondary cursor-pointer">
              Dosya Seç
              <input
                className="hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onLogoSelected}
                disabled={logoUploading}
              />
            </label>
            <button
              type="button"
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              onClick={uploadLogoFile}
              disabled={logoUploading || !selectedLogoFile}
            >
              {logoUploading ? 'Yükleniyor...' : 'Logo Yükle'}
            </button>
          </div>
        </div>
      </section>

      <section className="page-card space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Teklif HTML Şablonu</h2>
            <p className="text-sm text-slate-500">
              Teklif PDF çıktısı için içinde <span className="font-semibold">const CONFIG</span> bloğu bulunan HTML şablonu yükleyin.
            </p>
            {settings.quoteTemplate?.fileName ? (
              <p className="mt-2 text-sm text-slate-700">
                Aktif şablon: <span className="font-semibold">{settings.quoteTemplate.fileName}</span>
                {settings.quoteTemplate.uploadedAt ? ` · ${new Date(settings.quoteTemplate.uploadedAt).toLocaleString('tr-TR')}` : ''}
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Henüz teklif şablonu yüklenmedi. Şablon yoksa sistem varsayılan tasarımı kullanır.</p>
            )}
            {selectedQuoteTemplate ? (
              <p className="mt-1 text-sm font-medium text-emerald-700">Seçilen dosya: {selectedQuoteTemplate.name}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="btn-secondary cursor-pointer">
              HTML Seç
              <input
                className="hidden"
                type="file"
                accept=".html,.htm,text/html"
                onChange={onQuoteTemplateSelected}
                disabled={quoteTemplateUploading}
              />
            </label>
            <button
              type="button"
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              onClick={uploadSelectedQuoteTemplate}
              disabled={quoteTemplateUploading || !selectedQuoteTemplate}
            >
              {quoteTemplateUploading ? 'Yükleniyor...' : 'Şablonu Yükle'}
            </button>
          </div>
        </div>
      </section>

      <section className="page-card space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Şirket Referansları</h2>
            <p className="text-sm text-slate-500">Referans firmaların logolarını toplu olarak yükleyin ve listede yönetin.</p>
          </div>
          <div className="text-sm font-medium text-slate-500">
            {(settings.companyReferences || []).length} referans
          </div>
        </div>

        <div
          className={`relative rounded-2xl border-2 border-dashed p-5 transition ${
            referenceDragActive
              ? 'border-brand-500 bg-brand-50 shadow-lg ring-4 ring-brand-100'
              : selectedReferenceFiles.length > 0
                ? 'border-emerald-400 bg-emerald-50/40'
                : 'border-slate-200 bg-slate-50/60'
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setReferenceDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setReferenceDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setReferenceDragActive(false);
          }}
          onDrop={onReferenceDrop}
        >
          {referenceDragActive ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-brand-600/10 backdrop-blur-[1px]">
              <div className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 shadow-lg">
                Referans logolarını buraya bırakın
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium text-slate-900">Toplu logo yükleme</p>
              <p className="text-sm text-slate-500">JPG, PNG veya WEBP dosyalarını seçin ya da bu alana sürükleyip bırakın.</p>
              {selectedReferenceFiles.length > 0 ? (
                <p className="mt-1 text-sm font-medium text-emerald-700">
                  {selectedReferenceFiles.length} dosya seçildi.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="btn-secondary cursor-pointer">
                Logoları Seç
                <input
                  className="hidden"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={onReferenceSelected}
                  disabled={referenceUploading}
                />
              </label>
              <button
                type="button"
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                onClick={uploadReferenceFiles}
                disabled={referenceUploading || selectedReferenceFiles.length === 0}
              >
                {referenceUploading ? 'Yükleniyor...' : 'Referansları Yükle'}
              </button>
            </div>
          </div>
        </div>

        {(settings.companyReferences || []).length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Henüz şirket referansı eklenmedi.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(settings.companyReferences || []).map((reference) => (
              <div key={reference._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex h-24 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                  <img src={reference.logoUrl} alt={reference.name} className="max-h-20 max-w-full object-contain p-2" />
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-semibold text-slate-900" title={reference.name}>
                    {reference.name || 'Referans'}
                  </p>
                  <button
                    type="button"
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => removeCompanyReference(reference._id)}
                    disabled={referenceDeletingId === reference._id}
                  >
                    {referenceDeletingId === reference._id ? 'Siliniyor...' : 'Sil'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ReadOnlyCard title="Genel" onEdit={() => openModal('general')}>
        <DetailLine label="Şirket adı" value={settings.companyName} />
        <DetailLine label="Web sitesi" value={settings.website} />
      </ReadOnlyCard>

      <ReadOnlyCard title="Vergi Bilgileri" onEdit={() => openModal('tax')}>
        <DetailLine label="Yasal unvan" value={settings.billingInfo.legalCompanyName} />
        <DetailLine label="Vergi numarası" value={settings.billingInfo.taxNumber} />
        <DetailLine label="Vergi dairesi" value={settings.billingInfo.taxOffice} />
        <DetailLine label="Adres" value={settings.billingInfo.address} />
      </ReadOnlyCard>

      <ReadOnlyCard title="Banka Hesapları" onEdit={() => openModal('banks')}>
        {(settings.billingInfo.bankAccounts || []).length === 0 ? (
          <p className="text-sm text-slate-500">Banka hesabı eklenmedi.</p>
        ) : (
          <div className="space-y-3">
            {(settings.billingInfo.bankAccounts || []).map((account, index) => (
              <div key={`${account.iban || account.bankName || 'bank'}-${index}`} className="rounded-lg border border-slate-200 p-3">
                <DetailLine label="Banka adı" value={account.bankName} />
                <DetailLine label="Şube adı" value={account.branchName} />
                <DetailLine label="IBAN" value={account.iban} />
                <DetailLine label="SWIFT" value={account.swiftCode} />
              </div>
            ))}
          </div>
        )}
      </ReadOnlyCard>

      <ReadOnlyCard title="Departmanlar" onEdit={() => openModal('departments')}>
        {(settings.departments || []).length === 0 ? (
          <p className="text-sm text-slate-500">Henüz departman eklenmedi.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(settings.departments || []).map((department) => (
              <span key={department} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {department}
              </span>
            ))}
          </div>
        )}
      </ReadOnlyCard>

      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      {activeModal === 'general' ? (
        <SettingsModal title="Genel Bilgileri Düzenle" onClose={closeModal}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className="input"
              placeholder="Şirket adı"
              value={draft.companyName || ''}
              onChange={(e) => setDraft({ ...draft, companyName: e.target.value })}
            />
            <input
              className="input"
              placeholder="Web sitesi"
              value={draft.website || ''}
              onChange={(e) => setDraft({ ...draft, website: e.target.value })}
            />
          </div>
          <ModalActions
            onCancel={closeModal}
            onSave={() => saveSection({ companyName: draft.companyName, website: draft.website }, 'Genel bilgiler kaydedildi.')}
          />
        </SettingsModal>
      ) : null}

      {activeModal === 'tax' ? (
        <SettingsModal title="Vergi Bilgilerini Düzenle" onClose={closeModal}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className="input"
              placeholder="Yasal unvan"
              value={draft.billingInfo.legalCompanyName || ''}
              onChange={(e) => setDraft({ ...draft, billingInfo: { ...draft.billingInfo, legalCompanyName: e.target.value } })}
            />
            <input
              className="input"
              placeholder="Vergi numarası"
              value={draft.billingInfo.taxNumber || ''}
              onChange={(e) => setDraft({ ...draft, billingInfo: { ...draft.billingInfo, taxNumber: e.target.value } })}
            />
            <input
              className="input"
              placeholder="Vergi dairesi"
              value={draft.billingInfo.taxOffice || ''}
              onChange={(e) => setDraft({ ...draft, billingInfo: { ...draft.billingInfo, taxOffice: e.target.value } })}
            />
            <input
              className="input"
              placeholder="Adres"
              value={draft.billingInfo.address || ''}
              onChange={(e) => setDraft({ ...draft, billingInfo: { ...draft.billingInfo, address: e.target.value } })}
            />
          </div>
          <ModalActions
            onCancel={closeModal}
            onSave={() =>
              saveSection(
                {
                  billingInfo: {
                    legalCompanyName: draft.billingInfo.legalCompanyName,
                    taxNumber: draft.billingInfo.taxNumber,
                    taxOffice: draft.billingInfo.taxOffice,
                    address: draft.billingInfo.address
                  }
                },
                'Vergi bilgileri kaydedildi.'
              )
            }
          />
        </SettingsModal>
      ) : null}

      {activeModal === 'banks' ? (
        <SettingsModal title="Banka Hesaplarını Düzenle" onClose={closeModal} wide>
          <div className="space-y-3">
            {(draft.billingInfo.bankAccounts || []).map((account, index) => (
              <div key={index} className="rounded-xl border border-slate-200 p-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    className="input"
                    placeholder="Banka adı"
                    value={account.bankName || ''}
                    onChange={(e) => updateBankAccount(index, 'bankName', e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Şube adı"
                    value={account.branchName || ''}
                    onChange={(e) => updateBankAccount(index, 'branchName', e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="IBAN"
                    value={account.iban || ''}
                    onChange={(e) => updateBankAccount(index, 'iban', e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="SWIFT"
                    value={account.swiftCode || ''}
                    onChange={(e) => updateBankAccount(index, 'swiftCode', e.target.value)}
                  />
                </div>
                <div className="mt-2">
                  <button type="button" className="btn-secondary" onClick={() => removeBankAccount(index)}>
                    Bankayı kaldır
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={addBankAccount}>
              Banka hesabı ekle
            </button>
          </div>
          <ModalActions
            onCancel={closeModal}
            onSave={() =>
              saveSection(
                { billingInfo: { bankAccounts: draft.billingInfo.bankAccounts || [] } },
                'Banka hesapları kaydedildi.'
              )
            }
          />
        </SettingsModal>
      ) : null}

      {activeModal === 'departments' ? (
        <SettingsModal title="Departmanları Düzenle" onClose={closeModal}>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Departman ekle"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
            />
            <button type="button" className="btn-secondary" onClick={addDepartment}>
              Ekle
            </button>
          </div>
          <div className="space-y-2">
            {(draft.departments || []).map((department, index) => (
              <div key={`${department}-${index}`} className="flex gap-2">
                <input className="input" value={department} onChange={(e) => updateDepartment(index, e.target.value)} />
                <button type="button" className="btn-secondary" onClick={() => removeDepartment(index)}>
                  Sil
                </button>
              </div>
            ))}
            {(draft.departments || []).length === 0 ? <p className="text-xs text-slate-500">Henüz departman eklenmedi.</p> : null}
          </div>
          <ModalActions
            onCancel={closeModal}
            onSave={() => saveSection({ departments: draft.departments || [] }, 'Departmanlar kaydedildi.')}
          />
        </SettingsModal>
      ) : null}
    </div>
  );
}

function normalizeSettings(data: CompanySettings): Omit<CompanySettings, '_id'> {
  const { _id, ...rest } = data;
  return {
    ...initial,
    ...rest,
    quoteTemplate: rest.quoteTemplate || {},
    companyReferences: rest.companyReferences || [],
    billingInfo: {
      ...initial.billingInfo,
      ...(rest.billingInfo || {}),
      bankAccounts: rest.billingInfo?.bankAccounts || []
    }
  };
}

function cloneSettings(data: Omit<CompanySettings, '_id'>): Omit<CompanySettings, '_id'> {
  return JSON.parse(JSON.stringify(data));
}

function ReadOnlyCard({ title, children, onEdit }: { title: string; children: ReactNode; onEdit: () => void }) {
  return (
    <section className="page-card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <button type="button" className="btn-primary" onClick={onEdit}>
          Düzenle
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function DetailLine({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm md:grid-cols-[180px_1fr]">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="break-words text-slate-900">{value || '-'}</span>
    </div>
  );
}

function SettingsModal({
  title,
  children,
  onClose,
  wide = false
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <ModalPortal>
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-xl ${wide ? 'max-w-3xl' : 'max-w-2xl'}`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Kapat
          </button>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </ModalPortal>
  );
}

function ModalActions({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
      <button type="button" className="btn-secondary" onClick={onCancel}>
        Vazgeç
      </button>
      <button type="button" className="btn-primary" onClick={onSave}>
        Güncelle
      </button>
    </div>
  );
}
