import { useEffect, useState, type ReactNode } from 'react';
import { getCompanySettings, upsertCompanySettings, type CompanySettingsPayload } from '../api/companySettings.api';
import type { CompanySettings } from '../types/companySettings.types';
import { PageHeader } from '../../../components/PageHeader';
import { ModalPortal } from '../../../components/ModalPortal';
import { useAuthStore } from '../../auth/auth.store';

const initial: Omit<CompanySettings, '_id'> = {
  companyName: '',
  website: '',
  timezone: 'Europe/Istanbul',
  departments: [],
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
