import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteEmployee, getEmployee, updateEmployee } from '../api/employees.api';
import type { Employee } from '../types/employee.types';
import { getCompanySettings } from '../../companySettings/api/companySettings.api';
import { Loading } from '../../../components/Loading';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { ModalPortal } from '../../../components/ModalPortal';

type EmployeeForm = Partial<Pick<Employee, 'firstName' | 'lastName' | 'workEmail' | 'phone' | 'department' | 'title' | 'startDate' | 'status' | 'employmentType'>>;

export function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [form, setForm] = useState<EmployeeForm | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getEmployee(id), getCompanySettings()])
      .then(([employeeData, settings]) => {
        setEmployee(employeeData);
        setDepartments(settings?.departments || []);
      })
      .catch(() => setError('Personel detay bilgileri yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [id]);

  const openEdit = () => {
    if (!employee) return;
    setForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      workEmail: employee.workEmail,
      phone: employee.phone || '',
      department: employee.department || '',
      title: employee.title || '',
      startDate: employee.startDate,
      status: employee.status,
      employmentType: employee.employmentType
    });
    setIsEditOpen(true);
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !form) return;
    const updated = await updateEmployee(id, form);
    setEmployee(updated);
    setIsEditOpen(false);
  };

  const onDelete = async () => {
    if (!id) return;
    await deleteEmployee(id);
    navigate('/admin/employees');
  };

  if (loading) return <Loading />;

  if (error || !employee) {
    return (
      <div className="animate-slide-in-right space-y-4">
        <button type="button" className="btn-secondary" onClick={() => navigate('/admin/employees')}>Geri dön</button>
        <div className="page-card text-sm text-red-600">{error || 'Personel bulunamadı.'}</div>
      </div>
    );
  }

  const avatarUrl = employee.businessCard?.avatarPublicUrl || employee.businessCard?.avatarUrl || '';
  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase() || 'P';

  return (
    <div className="animate-slide-in-right space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button type="button" className="btn-secondary" onClick={() => navigate('/admin/employees')}>Geri dön</button>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={openEdit}>Düzenle</button>
          <button type="button" className="btn-danger" onClick={() => setIsDeleteOpen(true)}>Sil</button>
        </div>
      </div>

      <section className="page-card space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {avatarUrl ? <img src={avatarUrl} alt={`${employee.firstName} ${employee.lastName}`} className="h-28 w-28 rounded-2xl object-cover" /> : <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-slate-200 text-3xl font-semibold text-slate-500">{initials}</div>}
          <div>
            <p className="text-sm font-medium text-slate-500">Personel Detayı</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">{employee.firstName} {employee.lastName}</h1>
            <p className="mt-1 text-sm text-slate-500">{employee.title || 'Ünvan yok'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <DetailItem label="E-posta" value={employee.workEmail} />
          <DetailItem label="Telefon" value={employee.phone} />
          <DetailItem label="Departman" value={employee.department} />
          <DetailItem label="Çalışma Tipi" value={translateEmploymentType(employee.employmentType)} />
          <DetailItem label="İşe Başlangıç" value={employee.startDate ? employee.startDate.slice(0, 10) : undefined} />
          <DetailItem label="Durum" value={employee.status === 'ACTIVE' ? 'Aktif' : 'Pasif'} />
          <DetailItem label="Kartvizit Adı" value={employee.businessCard?.displayName} />
          <DetailItem label="Kartvizit E-postası" value={employee.businessCard?.email} />
        </div>
      </section>

      {isEditOpen && form ? (
        <FormModal title="Personeli Düzenle" onClose={() => setIsEditOpen(false)}>
          <form onSubmit={onSave} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input className="input" placeholder="Ad" value={form.firstName || ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              <input className="input" placeholder="Soyad" value={form.lastName || ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              <input className="input" placeholder="E-posta" value={form.workEmail || ''} onChange={(e) => setForm({ ...form, workEmail: e.target.value })} required />
              <input className="input" placeholder="Telefon" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <select className="input" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                <option value="">Departman seçin</option>
                {departments.map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
              <input className="input" placeholder="Ünvan" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input className="input" type="date" value={(form.startDate || '').slice(0, 10)} onChange={(e) => setForm({ ...form, startDate: new Date(e.target.value).toISOString() })} />
              <select className="input" value={form.status || 'ACTIVE'} onChange={(e) => setForm({ ...form, status: e.target.value as Employee['status'] })}>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Pasif</option>
              </select>
            </div>
            <div className="flex gap-2"><button className="btn-primary" type="submit">Güncelle</button><button className="btn-secondary" type="button" onClick={() => setIsEditOpen(false)}>Vazgeç</button></div>
          </form>
        </FormModal>
      ) : null}

      {isDeleteOpen ? <ConfirmDialog title="Personeli Sil" message="Bu personeli silmek istediğinize emin misiniz?" onConfirm={onDelete} onCancel={() => setIsDeleteOpen(false)} /> : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  return <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-words text-slate-900">{value || '-'}</p></div>;
}

function translateEmploymentType(value: Employee['employmentType']) {
  if (value === 'PART_TIME') return 'Yarı zamanlı';
  if (value === 'CONTRACTOR') return 'Sözleşmeli';
  return 'Tam zamanlı';
}

function FormModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <ModalPortal><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between gap-4"><h2 className="text-lg font-semibold text-slate-950">{title}</h2><button type="button" className="btn-secondary" onClick={onClose}>Kapat</button></div>{children}</div></ModalPortal>;
}
