import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCustomer } from '../api/customers.api';
import type { Customer } from '../types/customer.types';
import { Loading } from '../../../components/Loading';

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    getCustomer(id)
      .then(setCustomer)
      .catch(() => setError('Müşteri detay bilgileri yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;

  if (error || !customer) {
    return (
      <div className="animate-slide-in-right space-y-4">
        <button type="button" className="btn-secondary" onClick={() => navigate('/admin/customers')}>
          Geri dön
        </button>
        <div className="page-card text-sm text-red-600">{error || 'Müşteri bulunamadı.'}</div>
      </div>
    );
  }

  return (
    <div className="animate-slide-in-right space-y-5">
      <button type="button" className="btn-secondary" onClick={() => navigate('/admin/customers')}>
        Geri dön
      </button>

      <section className="page-card space-y-5">
        <div>
          <p className="text-sm font-medium text-slate-500">Müşteri Detayı</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">{customer.companyName}</h1>
          <p className="mt-1 text-sm text-slate-500">{customer.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <DetailItem label="Web Sitesi" value={customer.website} />
          <DetailItem label="Telefon" value={customer.phone} />
          <DetailItem label="Vergi Numarası" value={customer.taxNumber} />
          <DetailItem label="Vergi Dairesi" value={customer.taxOffice} />
          <DetailItem label="Adres" value={customer.address} />
          <DetailItem label="Durum" value={customer.status === 'ACTIVE' ? 'Aktif' : 'Pasif'} />
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
