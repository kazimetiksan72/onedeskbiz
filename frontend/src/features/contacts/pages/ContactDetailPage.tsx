import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getContact } from '../api/contacts.api';
import type { Contact } from '../types/contact.types';
import { Loading } from '../../../components/Loading';

export function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    getContact(id)
      .then(setContact)
      .catch(() => setError('Kişi detay bilgileri yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;

  if (error || !contact) {
    return (
      <div className="animate-slide-in-right space-y-4">
        <button type="button" className="btn-secondary" onClick={() => navigate('/admin/contacts')}>
          Geri dön
        </button>
        <div className="page-card text-sm text-red-600">{error || 'Kişi bulunamadı.'}</div>
      </div>
    );
  }

  return (
    <div className="animate-slide-in-right space-y-5">
      <button type="button" className="btn-secondary" onClick={() => navigate('/admin/contacts')}>
        Geri dön
      </button>

      <section className="page-card space-y-5">
        <div>
          <p className="text-sm font-medium text-slate-500">Kişi Detayı</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            {contact.firstName} {contact.lastName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{contact.customerId?.companyName || 'Firma seçilmedi'}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <DetailItem label="Firma" value={contact.customerId?.companyName} />
          <DetailItem label="E-posta" value={contact.email} />
          <DetailItem label="Telefon" value={contact.phone} />
          <DetailItem label="Firma Web Sitesi" value={contact.customerId?.website} />
          <DetailItem label="Firma Telefonu" value={contact.customerId?.phone} />
          <DetailItem label="Firma Adresi" value={contact.customerId?.address} />
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
