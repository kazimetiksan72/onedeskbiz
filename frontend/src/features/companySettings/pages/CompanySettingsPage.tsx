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
    return <div className="page-card">Only admin can manage company settings.</div>;
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
      <PageHeader title="Company Settings" subtitle="Manage company details and financial configuration" />

      <div className="page-card space-y-3">
        <h2 className="text-base font-semibold">General</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            className="input"
            placeholder="Company name"
            value={form.companyName || ''}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
          <input
            className="input"
            placeholder="Web Site"
            value={form.website || ''}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={() => saveSection({ companyName: form.companyName, website: form.website }, 'General settings saved.')}
        >
          Save
        </button>
      </div>

      <div className="page-card space-y-3">
        <h2 className="text-base font-semibold">Tax Information</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            className="input"
            placeholder="Legal name"
            value={form.billingInfo.legalCompanyName || ''}
            onChange={(e) =>
              setForm({ ...form, billingInfo: { ...form.billingInfo, legalCompanyName: e.target.value } })
            }
          />
          <input
            className="input"
            placeholder="Tax number"
            value={form.billingInfo.taxNumber || ''}
            onChange={(e) => setForm({ ...form, billingInfo: { ...form.billingInfo, taxNumber: e.target.value } })}
          />
          <input
            className="input"
            placeholder="Tax office"
            value={form.billingInfo.taxOffice || ''}
            onChange={(e) => setForm({ ...form, billingInfo: { ...form.billingInfo, taxOffice: e.target.value } })}
          />
          <input
            className="input"
            placeholder="Address"
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
              'Tax information saved.'
            )
          }
        >
          Save
        </button>
      </div>

      <div className="page-card space-y-3">
        <h2 className="text-base font-semibold">Bank Accounts</h2>
        <div className="space-y-3">
          {(form.billingInfo.bankAccounts || []).map((account, index) => (
            <div key={index} className="rounded-xl border border-slate-200 p-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  className="input"
                  placeholder="Bank name"
                  value={account.bankName || ''}
                  onChange={(e) => updateBankAccount(index, 'bankName', e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Branch name"
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
                  Remove bank
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={addBankAccount}>
            Add bank account
          </button>
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={() =>
            saveSection(
              { billingInfo: { bankAccounts: form.billingInfo.bankAccounts || [] } },
              'Bank accounts saved.'
            )
          }
        >
          Save
        </button>
      </div>

      <div className="page-card space-y-3">
        <h2 className="text-base font-semibold">Departments</h2>
        <div className="mb-1 flex gap-2">
          <input
            className="input"
            placeholder="Add department"
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
          />
          <button type="button" className="btn-secondary" onClick={addDepartment}>
            Add
          </button>
        </div>
        <div className="space-y-2">
          {(form.departments || []).map((department, index) => (
            <div key={`${department}-${index}`} className="flex gap-2">
              <input className="input" value={department} onChange={(e) => updateDepartment(index, e.target.value)} />
              <button type="button" className="btn-secondary" onClick={() => removeDepartment(index)}>
                Delete
              </button>
            </div>
          ))}
          {(form.departments || []).length === 0 ? <p className="text-xs text-slate-500">No departments added yet.</p> : null}
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={() => saveSection({ departments: form.departments || [] }, 'Departments saved.')}
        >
          Save
        </button>
      </div>

      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
    </div>
  );
}
