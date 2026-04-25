import { useEffect, useState } from 'react';
import { getContactActionLogs } from '../api/contactActionLogs.api';
import type { ContactActionLog } from '../types/contactActionLog.types';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { Loading } from '../../../components/Loading';
import { useAuthStore } from '../../auth/auth.store';

export function ContactActionLogsPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<ContactActionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContactActionLogs()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kişi Aksiyonları"
        subtitle={user?.role === 'ADMIN' ? 'Personellerin kişi aksiyonlarını görüntüleyin' : 'Kişilere yaptığınız aksiyonları görüntüleyin'}
      />

      <div className="page-card">
        {loading ? <Loading /> : null}
        {!loading && items.length === 0 ? <EmptyState message="Aksiyon kaydı bulunamadı." /> : null}
        {!loading && items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  {user?.role === 'ADMIN' ? <th className="pb-2">Personel</th> : null}
                  <th className="pb-2">Tarih</th>
                  <th className="pb-2">Kişi</th>
                  <th className="pb-2">Firma</th>
                  <th className="pb-2">Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    {user?.role === 'ADMIN' ? <td className="py-2">{formatActor(item)}</td> : null}
                    <td className="py-2">{new Date(item.occurredAt).toLocaleString('tr-TR')}</td>
                    <td className="py-2">{formatContact(item)}</td>
                    <td className="py-2">{item.customerId?.companyName || item.contactSnapshot?.companyName || '-'}</td>
                    <td className="py-2">{translateAction(item.actionType)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatActor(item: ContactActionLog) {
  const fullName = `${item.actorUserId?.firstName || ''} ${item.actorUserId?.lastName || ''}`.trim();
  return fullName || item.actorUserId?.workEmail || item.actorUserId?.email || '-';
}

function formatContact(item: ContactActionLog) {
  const fullName = `${item.contactId?.firstName || ''} ${item.contactId?.lastName || ''}`.trim();
  return fullName || item.contactSnapshot?.fullName || '-';
}

function translateAction(value: ContactActionLog['actionType']) {
  if (value === 'CALL') return 'Arama';
  if (value === 'WHATSAPP') return 'WhatsApp';
  return 'E-posta';
}
