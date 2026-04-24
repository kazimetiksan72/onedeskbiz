import { useEffect, useState } from 'react';
import { getCompanySettings, upsertCompanySettings, type CompanySettingsPayload } from '../api/companySettings.api';
import type { CompanySettings } from '../types/companySettings.types';
import { PageHeader } from '../../../components/PageHeader';
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

export function CompanySettingsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [form, setForm] = useState<Omit<CompanySettings, '_id'>>(initial);
  const [newDepartment, setNewDepartment] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    getCompanySettings().then((data) => {
      if (!data) return;
      const { _id, ...rest } = data;
      setForm({
        ...initial,
        ...rest,
        billingInfo: {
          ...initial.billingInfo,
          ...(rest.billingInfo || {}),
          bankAccounts: rest.billingInfo?.bankAccounts || []
        }
      });
    });
  }, []);

  if (!isAdmin) {
    return <div className="page-card">Şirket ayarlarını yalnızca admin kullanıcılar yönetebilir.</div>;
  }

  const saveSection = async (payload: CompanySettingsPayload, successMessage: string) => {
    await upsertCompanySettings(payload);
    setMessage(successMessage);
  };

  const addDepartment = () => {
    const value = newDepartment.trim();
    if (!value) return;

    const exists = (form.departments || []).some((item) => item.toLowerCase() === value.toLowerCase());
    if (exists) return;

    setForm({ ...form, departments: [...(form.departments || []), value] });
    setNewDepartment('');
  };

  const updateDepartment = (index: number, value: string) => {
    const next = [...(form.departments || [])];
    next[index] = value;
    setForm({ ...form, departments: next });
  };

  const removeDepartment = (index: number) => {
    const next = [...(form.departments || [])];
    next.splice(index, 1);
    setForm({ ...form, departments: next });
  };

  const addBankAccount = () => {
    const next = [...(form.billingInfo.bankAccounts || [])];
    next.push({ bankName: '', branchName: '', iban: '', swiftCode: '' });
    setForm({ ...form, billingInfo: { ...form.billingInfo, bankAccounts: next } });
  };

  const updateBankAccount = (index: number, key: 'bankName' | 'branchName' | 'iban' | 'swiftCode', value: string) => {
    const next = [...(form.billingInfo.bankAccounts || [])];
    next[index] = { ...(next[index] || {}), [key]: value };
    setForm({ ...form, billingInfo: { ...form.billingInfo, bankAccounts: next } });
  };

  const removeBankAccount = (index: number) => {
    const next = [...(form.billingInfo.bankAccounts || [])];
    next.splice(index, 1);
    setForm({ ...form, billingInfo: { ...form.billingInfo, bankAccounts: next } });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Şirket Ayarları" subtitle="Şirket, vergi, banka ve departman bilgilerini yönetin" />

      <div className="page-card space-y-3">
        <h2 className="text-base font-semibold">Genel</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            className="input"
            placeholder="Şirket adı"
            value={form.companyName || ''}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
          <input
            className="input"
            placeholder="Web sitesi"
            value={form.website || ''}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={() => saveSection({ companyName: form.companyName, website: form.website }, 'Genel bilgiler kaydedildi.')}
        >
          Kaydet
        </button>
      </div>

      <div className="page-card space-y-3">
        <h2 className="text-base font-semibold">Vergi Bilgileri</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            className="input"
            placeholder="Yasal unvan"
            value={form.billingInfo.legalCompanyName || ''}
            onChange={(e) =>
              setForm({ ...form, billingInfo: { ...form.billingInfo, legalCompanyName: e.target.value } })
            }
          />
          <input
            className="input"
            placeholder="Vergi numarası"
            value={form.billingInfo.taxNumber || ''}
            onChange={(e) => setForm({ ...form, billingInfo: { ...form.billingInfo, taxNumber: e.target.value } })}
          />
          <input
            className="input"
            placeholder="Vergi dairesi"
            value={form.billingInfo.taxOffice || ''}
            onChange={(e) => setForm({ ...form, billingInfo: { ...form.billingInfo, taxOffice: e.target.value } })}
          />
          <input
            className="input"
            placeholder="Adres"
            value={form.billingInfo.address || ''}
            onChange={(e) => setForm({ ...form, billingInfo: { ...form.billingInfo, address: e.target.value } })}
          />
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={() =>
            saveSection(
              {
                billingInfo: {
                  legalCompanyName: form.billingInfo.legalCompanyName,
                  taxNumber: form.billingInfo.taxNumber,
                  taxOffice: form.billingInfo.taxOffice,
                  address: form.billingInfo.address
                }
              },
              'Vergi bilgileri kaydedildi.'
            )
          }
        >
          Kaydet
        </button>
      </div>

      <div className="page-card space-y-3">
        <h2 className="text-base font-semibold">Banka Hesapları</h2>
        <div className="space-y-3">
          {(form.billingInfo.bankAccounts || []).map((account, index) => (
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
        <button
          className="btn-primary"
          type="button"
          onClick={() =>
            saveSection(
              { billingInfo: { bankAccounts: form.billingInfo.bankAccounts || [] } },
              'Banka hesapları kaydedildi.'
            )
          }
        >
          Kaydet
        </button>
      </div>

      <div className="page-card space-y-3">
        <h2 className="text-base font-semibold">Departmanlar</h2>
        <div className="mb-1 flex gap-2">
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
          {(form.departments || []).map((department, index) => (
            <div key={`${department}-${index}`} className="flex gap-2">
              <input className="input" value={department} onChange={(e) => updateDepartment(index, e.target.value)} />
              <button type="button" className="btn-secondary" onClick={() => removeDepartment(index)}>
                Sil
              </button>
            </div>
          ))}
          {(form.departments || []).length === 0 ? <p className="text-xs text-slate-500">Henüz departman eklenmedi.</p> : null}
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={() => saveSection({ departments: form.departments || [] }, 'Departmanlar kaydedildi.')}
        >
          Kaydet
        </button>
      </div>

      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
    </div>
  );
}
