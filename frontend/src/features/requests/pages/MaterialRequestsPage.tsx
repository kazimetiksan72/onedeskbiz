import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { getMyRequests, createMaterialRequest } from '../api/requests.api';
import type { RequestItem } from '../types/request.types';

export function MaterialRequestsPage() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [materialText, setMaterialText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const materialRequests = useMemo(() => items.filter((item) => item.type === 'MATERIAL'), [items]);

  const load = async () => {
    setError('');
    setLoading(true);

    try {
      const requestItems = await getMyRequests();
      setItems(requestItems);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Malzeme talepleri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      await createMaterialRequest({ materialText });
      setMaterialText('');
      setMessage('Malzeme talebi onaya gönderildi.');
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Malzeme talebi oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Malzeme Talepleri" subtitle="Malzeme ihtiyaçlarınızı oluşturun ve takip edin" />

      {error ? <div className="page-card text-sm text-red-600">{error}</div> : null}
      {message ? <div className="page-card text-sm text-emerald-700">{message}</div> : null}

      <form className="page-card space-y-3" onSubmit={submit}>
        <h2 className="text-base font-semibold text-slate-950">Malzeme Talebi Oluştur</h2>
        <textarea
          className="input min-h-32"
          placeholder="Talep edilen malzemeyi ve açıklamayı yazın"
          value={materialText}
          onChange={(event) => setMaterialText(event.target.value)}
          required
          maxLength={2000}
        />
        <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={saving || !materialText.trim()}>
          {saving ? 'Gönderiliyor...' : 'Onaya Gönder'}
        </button>
      </form>

      <div className="page-card">
        {loading ? <p className="text-sm text-slate-500">Yükleniyor...</p> : null}
        {!loading && materialRequests.length === 0 ? <EmptyState message="Henüz malzeme talebi yok." /> : null}
        {!loading && materialRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Talep</th>
                  <th className="pb-2">Durum</th>
                  <th className="pb-2">Oluşturma</th>
                </tr>
              </thead>
              <tbody>
                {materialRequests.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100 align-top">
                    <td className="max-w-xl py-2">{item.materialText || '-'}</td>
                    <td className="py-2">{translateStatus(item.status)}</td>
                    <td className="py-2">{formatDateTime(item.createdAt)}</td>
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

function translateStatus(value: RequestItem['status']) {
  if (value === 'APPROVED') return 'Onaylandı';
  if (value === 'REJECTED') return 'Reddedildi';
  return 'Bekliyor';
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR');
}
