import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInputImport from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import {
  createEmployee,
  generateJobDescription,
  getEmployees,
  updateEmployee,
  type EmployeePayload
} from '../api/employees.api';
import type { Employee } from '../types/employee.types';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { useAuthStore } from '../../auth/auth.store';
import { getCompanySettings } from '../../companySettings/api/companySettings.api';

const PhoneInput =
  (PhoneInputImport as unknown as { default?: any }).default ?? (PhoneInputImport as any);

const initialForm: Partial<Employee> = {
  firstName: '',
  lastName: '',
  tckn: '',
  managerUserId: '',
  workEmail: '',
  phone: '',
  department: '',
  title: '',
  jobDescription: '',
  startDate: new Date().toISOString(),
  status: 'ACTIVE',
  employmentType: 'FULL_TIME'
};

export function EmployeesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [items, setItems] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [form, setForm] = useState<Partial<Employee>>(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [search, setSearch] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [formError, setFormError] = useState('');

  const isValidTckn = (value?: string) => {
    if (!value) return true;
    if (!/^[1-9][0-9]{10}$/.test(value)) return false;

    const digits = value.split('').map(Number);
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    const tenthDigit = ((oddSum * 7) - evenSum) % 10;
    const eleventhDigit = digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0) % 10;

    return digits[9] === tenthDigit && digits[10] === eleventhDigit;
  };

  const load = async () => {
    const result = await getEmployees(search);
    setItems(result);
  };

  useEffect(() => {
    load();
    getCompanySettings().then((settings) => {
      setDepartments(settings?.departments || []);
    });
  }, []);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setFormError('');

    if (!isValidTckn(form.tckn)) {
      setFormError('Geçerli bir TCKN girin.');
      return;
    }
    if (items.length > 0 && !form.managerUserId) {
      setFormError('Yönetici seçimi zorunludur.');
      return;
    }

    const payload: EmployeePayload = {
      ...form,
      startDate: form.startDate || new Date().toISOString(),
      temporaryPassword: temporaryPassword || (selected ? undefined : '')
    };

    if (selected) {
      await updateEmployee(selected._id, payload);
    } else {
      await createEmployee(payload);
    }

    setSelected(null);
    setForm(initialForm);
    setTemporaryPassword('');
    setIsFormOpen(false);
    await load();
  };

  const onCreate = () => {
    setSelected(null);
    setForm(initialForm);
    setTemporaryPassword('');
    setAiError('');
    setFormError('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setSelected(null);
    setForm(initialForm);
    setTemporaryPassword('');
    setAiError('');
    setFormError('');
    setIsFormOpen(false);
  };

  const createJobDescriptionWithAI = async () => {
    if (!form.department) {
      setAiError('AI ile görev tanımı oluşturmak için önce departman seçin.');
      return;
    }

    setAiLoading(true);
    setAiError('');

    try {
      const jobDescription = await generateJobDescription({
        department: form.department,
        title: form.title,
        firstName: form.firstName,
        lastName: form.lastName
      });
      setForm((current) => ({ ...current, jobDescription }));
    } catch (requestError: any) {
      setAiError(requestError?.response?.data?.message || 'AI görev tanımı oluşturamadı.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personel Listesi"
        subtitle="Personel ve organizasyon bilgilerini yönetin"
        action={
          isAdmin ? (
            <button className="btn-primary" type="button" onClick={onCreate}>
              Yeni Ekle
            </button>
          ) : null
        }
      />

      <div className="page-card">
        <div className="mb-3 flex gap-2">
          <input
            className="input"
            placeholder="Personel ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-secondary" onClick={load}>
            Ara
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyState message="Personel bulunamadı." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Ad Soyad</th>
                  <th className="pb-2">E-posta</th>
                  <th className="pb-2">Departman</th>
                  <th className="pb-2">Ünvan</th>
                  <th className="pb-2">Durum</th>
                  <th className="pb-2 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="py-2">
                      {item.firstName} {item.lastName}
                    </td>
                    <td className="py-2">{item.workEmail}</td>
                    <td className="py-2">{item.department || '-'}</td>
                    <td className="py-2">{item.title || '-'}</td>
                    <td className="py-2">{item.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}</td>
                    <td className="py-2">
                      <div className="flex justify-end gap-2">
                        <button className="btn-primary" onClick={() => navigate(`/admin/employees/${item._id}`)}>
                          Detay
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAdmin && isFormOpen ? (
        <FormModal title={selected ? 'Personeli Güncelle' : 'Personel Ekle'} onClose={closeForm}>
          <form onSubmit={onSave} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className="input"
              placeholder="Ad"
              value={form.firstName || ''}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Soyad"
              value={form.lastName || ''}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
            <input
              className="input"
              inputMode="numeric"
              maxLength={11}
              placeholder="TCKN"
              value={form.tckn || ''}
              onChange={(e) => setForm({ ...form, tckn: e.target.value.replace(/\D/g, '').slice(0, 11) })}
            />
            <select
              className="input"
              value={typeof form.managerUserId === 'string' ? form.managerUserId : form.managerUserId?._id || ''}
              onChange={(e) => setForm({ ...form, managerUserId: e.target.value })}
              required={items.length > 0}
            >
              <option value="">{items.length > 0 ? 'Yönetici seçin' : 'Henüz personel yok'}</option>
              {items.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.firstName} {employee.lastName} {employee.department ? `- ${employee.department}` : ''}
                </option>
              ))}
            </select>
            <input
              className="input"
              placeholder="E-posta"
              value={form.workEmail || ''}
              onChange={(e) => setForm({ ...form, workEmail: e.target.value })}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Şifre"
              value={temporaryPassword}
              onChange={(e) => setTemporaryPassword(e.target.value)}
              required={!selected}
            />
            <div className="md:col-span-2">
              <PhoneInput
                country="tr"
                value={(form.phone || '').replace(/\D/g, '')}
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
                placeholder="Telefon"
              />
            </div>
            <select
              className="input"
              value={form.department || ''}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              required={departments.length > 0}
            >
              <option value="">{departments.length > 0 ? 'Departman seçin' : 'Departman tanımlı değil'}</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
              {form.department && !departments.includes(form.department) ? (
                <option value={form.department}>{form.department}</option>
              ) : null}
            </select>
            <input
              className="input"
              placeholder="Ünvan"
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <div className="md:col-span-2">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <label className="mb-2 block text-xs font-medium text-slate-500">Görev Tanımı</label>
                <textarea
                  className="input min-h-32 resize-y"
                  placeholder="Personelin görev ve sorumluluklarını yazın veya AI ile oluşturun."
                  value={form.jobDescription || ''}
                  onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
                  maxLength={4000}
                />
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="btn-secondary w-fit disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={createJobDescriptionWithAI}
                    disabled={aiLoading || !form.department}
                  >
                    {aiLoading ? 'AI yazıyor...' : 'AI'}
                  </button>
                  <span className="text-xs text-slate-400">{(form.jobDescription || '').length}/4000</span>
                </div>
                {aiError ? <p className="mt-2 text-xs text-red-600">{aiError}</p> : null}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">İşe başlangıç tarihi</label>
              <input
                className="input"
                type="date"
                value={(form.startDate || '').slice(0, 10)}
                onChange={(e) => setForm({ ...form, startDate: new Date(e.target.value).toISOString() })}
                required
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">Yeni personel için şifre zorunludur. Güncellemede yalnızca şifreyi değiştirmek istiyorsanız doldurun.</p>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

          <div className="flex gap-2">
            <button className="btn-primary" type="submit">
              {selected ? 'Güncelle' : 'Oluştur'}
            </button>
            {selected ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={closeForm}
              >
                Vazgeç
              </button>
            ) : null}
          </div>
        </form>
        </FormModal>
      ) : null}
    </div>
  );
}

function FormModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Kapat
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
