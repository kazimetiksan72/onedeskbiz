import { useEffect, useState } from 'react';
import { getCompanySettings, upsertCompanySettings } from '../api/companySettings.api';
import type { CompanySettings } from '../types/companySettings.types';
import { PageHeader } from '../../../components/PageHeader';
import { useAuthStore } from '../../auth/auth.store';

const initial: Omit<CompanySettings, '_id'> = {
  companyName: '',
  domain: '',
  timezone: 'Europe/Istanbul',
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
    bankDetails: {
      bankName: '',
      accountName: '',
      iban: '',
      swiftCode: ''
    }
  }
};

export function CompanySettingsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [form, setForm] = useState<Omit<CompanySettings, '_id'>>(initial);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getCompanySettings().then((data) => {
      if (data) {
        const { _id, ...rest } = data;
        setForm(rest);
      }
    });
  }, []);

  if (!isAdmin) {
    return <div className="page-card">Only admin can manage company settings.</div>;
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Company Billing Info" subtitle="Embedded company settings and billing details" />
      <form
        className="page-card space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          await upsertCompanySettings(form);
          setMessage('Company settings saved successfully.');
        }}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input className="input" placeholder="Company name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
          <input className="input" placeholder="Domain" value={form.domain || ''} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
          <input className="input" placeholder="Legal company name" value={form.billingInfo.legalCompanyName} onChange={(e) => setForm({ ...form, billingInfo: { ...form.billingInfo, legalCompanyName: e.target.value } })} required />
          <input className="input" placeholder="Tax number" value={form.billingInfo.taxNumber} onChange={(e) => setForm({ ...form, billingInfo: { ...form.billingInfo, taxNumber: e.target.value } })} required />
          <input className="input" placeholder="Billing email" value={form.billingInfo.billingEmail || ''} onChange={(e) => setForm({ ...form, billingInfo: { ...form.billingInfo, billingEmail: e.target.value } })} />
          <input className="input" placeholder="Phone" value={form.billingInfo.phone || ''} onChange={(e) => setForm({ ...form, billingInfo: { ...form.billingInfo, phone: e.target.value } })} />
          <input className="input md:col-span-2" placeholder="Address" value={form.billingInfo.address} onChange={(e) => setForm({ ...form, billingInfo: { ...form.billingInfo, address: e.target.value } })} required />
          <input className="input" placeholder="City" value={form.billingInfo.city || ''} onChange={(e) => setForm({ ...form, billingInfo: { ...form.billingInfo, city: e.target.value } })} />
          <input className="input" placeholder="Country" value={form.billingInfo.country || ''} onChange={(e) => setForm({ ...form, billingInfo: { ...form.billingInfo, country: e.target.value } })} />
          <input className="input" placeholder="IBAN" value={form.billingInfo.bankDetails?.iban || ''} onChange={(e) => setForm({ ...form, billingInfo: { ...form.billingInfo, bankDetails: { ...(form.billingInfo.bankDetails || {}), iban: e.target.value } } })} />
          <input className="input" placeholder="SWIFT" value={form.billingInfo.bankDetails?.swiftCode || ''} onChange={(e) => setForm({ ...form, billingInfo: { ...form.billingInfo, bankDetails: { ...(form.billingInfo.bankDetails || {}), swiftCode: e.target.value } } })} />
        </div>
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        <button className="btn-primary" type="submit">Save Settings</button>
      </form>
    </div>
  );
}
