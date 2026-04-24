import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEmployee } from '../api/employees.api';
import type { Employee } from '../types/employee.types';
import { Loading } from '../../../components/Loading';

export function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    getEmployee(id)
      .then(setEmployee)
      .catch(() => setError('Personel detay bilgileri yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (error || !employee) {
    return (
      <div className="animate-slide-in-right space-y-4">
        <button type="button" className="btn-secondary" onClick={() => navigate('/admin/employees')}>
          Geri dön
        </button>
        <div className="page-card text-sm text-red-600">{error || 'Personel bulunamadı.'}</div>
      </div>
    );
  }

  const avatarUrl = employee.businessCard?.avatarPublicUrl || employee.businessCard?.avatarUrl || '';
  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase() || 'P';

  return (
    <div className="animate-slide-in-right space-y-5">
      <button type="button" className="btn-secondary" onClick={() => navigate('/admin/employees')}>
        Geri dön
      </button>

      <section className="page-card space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${employee.firstName} ${employee.lastName}`}
              className="h-28 w-28 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-slate-200 text-3xl font-semibold text-slate-500">
              {initials}
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-slate-500">Personel Detayı</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              {employee.firstName} {employee.lastName}
            </h1>
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
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-slate-900">{value || '-'}</p>
    </div>
  );
}

function translateEmploymentType(value: Employee['employmentType']) {
  if (value === 'PART_TIME') return 'Yarı zamanlı';
  if (value === 'CONTRACTOR') return 'Sözleşmeli';
  return 'Tam zamanlı';
}
