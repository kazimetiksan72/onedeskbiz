import { useEffect, useMemo, useRef, useState } from 'react';
import PhoneInputImport from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { getEmployees } from '../../employees/api/employees.api';
import { updateBusinessCard } from '../api/digitalCards.api';
import type { Employee } from '../../employees/types/employee.types';
import { useAuthStore } from '../../auth/auth.store';
import { PageHeader } from '../../../components/PageHeader';

const PhoneInput =
  (PhoneInputImport as unknown as { default?: any }).default ?? (PhoneInputImport as any);

export function BusinessCardPage() {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState({
    displayName: '',
    title: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    bio: '',
    publicSlug: '',
    isPublic: true
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    getEmployees().then((employees) => {
      const target =
        user?.role === 'ADMIN'
          ? employees[0]
          : employees.find((item) => item._id === user?.employeeId);

      if (!target) return;
      setEmployee(target);
      setForm({
        displayName: target.businessCard?.displayName || `${target.firstName} ${target.lastName}`,
        title: target.businessCard?.title || target.title || '',
        phone: target.businessCard?.phone || target.phone || '',
        email: target.businessCard?.email || target.workEmail,
        website: target.businessCard?.website || '',
        address: target.businessCard?.address || '',
        bio: target.businessCard?.bio || '',
        publicSlug:
          target.businessCard?.publicSlug || `${target.firstName.toLowerCase()}-${target.lastName.toLowerCase()}`,
        isPublic: target.businessCard?.isPublic ?? true
      });
    });
  }, [user?.employeeId]);

  const avatarSrc = useMemo(() => {
    if (avatar) {
      return URL.createObjectURL(avatar);
    }

    if (employee?.businessCard?.avatarUrl) {
      return employee.businessCard.avatarUrl;
    }

    return null;
  }, [avatar, employee?.businessCard?.avatarUrl]);

  useEffect(() => {
    return () => {
      if (avatarSrc && avatarSrc.startsWith('blob:')) {
        URL.revokeObjectURL(avatarSrc);
      }
    };
  }, [avatarSrc]);

  if (!employee) {
    return <div className="page-card">Employee profile not found for business card.</div>;
  }

  const publicUrl = `${window.location.origin}/card/${form.publicSlug}`;
  const phoneInputValue = form.phone.replace(/\D/g, '');

  return (
    <div className="space-y-4">
      <PageHeader title="Digital Business Card" subtitle="Manage your shareable card profile" />
      <form
        className="page-card space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData();
          Object.entries(form).forEach(([key, value]) => {
            formData.append(key, String(value));
          });
          if (avatar) {
            formData.append('avatar', avatar);
          }

          const updated = await updateBusinessCard(employee._id, formData);
          setEmployee(updated);
          setSaved('Business card updated.');
        }}
      >
        <div className="flex items-start justify-start">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative h-24 w-24 overflow-hidden rounded-full border border-slate-300 bg-slate-100"
            aria-label="Select profile photo"
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="Profile avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <svg viewBox="0 0 24 24" className="h-12 w-12" fill="currentColor" aria-hidden="true">
                  <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
                </svg>
              </div>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-black/45 py-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
              Change
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => setAvatar(e.target.files?.[0] || null)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            className="input"
            placeholder="Display name"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
          <input
            className="input"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <div className="md:col-span-2">
            <PhoneInput
              country="tr"
              value={phoneInputValue}
              onChange={(value: string) => setForm({ ...form, phone: value ? `+${value}` : '' })}
              inputStyle={{ width: '100%', height: '42px', borderRadius: '0.5rem', borderColor: '#cbd5e1' }}
              buttonStyle={{
                borderColor: '#cbd5e1',
                borderTopLeftRadius: '0.5rem',
                borderBottomLeftRadius: '0.5rem'
              }}
              containerStyle={{ width: '100%' }}
              enableSearch
              countryCodeEditable={false}
              placeholder="Phone"
            />
          </div>

          <input
            className="input"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="input"
            placeholder="Website"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
          <input
            className="input"
            placeholder="Slug"
            value={form.publicSlug}
            onChange={(e) => setForm({ ...form, publicSlug: e.target.value })}
          />
          <input
            className="input md:col-span-2"
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <textarea
            className="input md:col-span-2"
            placeholder="Bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
            />
            Publicly visible
          </label>
        </div>
        {saved ? <p className="text-sm text-emerald-600">{saved}</p> : null}
        <button className="btn-primary" type="submit">
          Save Card
        </button>
      </form>

      <div className="page-card space-y-3">
        <p className="text-sm text-slate-500">Public URL</p>
        <a href={publicUrl} target="_blank" className="text-sm font-medium text-brand-600" rel="noreferrer">
          {publicUrl}
        </a>
      </div>
    </div>
  );
}
