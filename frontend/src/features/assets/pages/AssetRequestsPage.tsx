import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { createAssetRequest, getMyRequests } from '../../requests/api/requests.api';
import type { RequestItem } from '../../requests/types/request.types';
import { getAssets } from '../api/assets.api';
import type { Asset, AssetAssignmentType } from '../types/asset.types';

export function AssetRequestsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [assetId, setAssetId] = useState('');
  const [assignmentType, setAssignmentType] = useState<AssetAssignmentType>('PERMANENT');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const assetRequests = useMemo(() => requests.filter((item) => item.type === 'ASSET'), [requests]);
  const activeAssets = useMemo(() => assets.filter((asset) => asset.status === 'ACTIVE'), [assets]);

  const load = async () => {
    setError('');
    setLoading(true);

    try {
      const [assetItems, requestItems] = await Promise.all([
        getAssets(''),
        getMyRequests()
      ]);
      setAssets(assetItems);
      setRequests(requestItems);
      setAssetId((current) => current || assetItems.find((asset) => asset.status === 'ACTIVE')?._id || '');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Demirbaş talepleri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (assignmentType === 'TEMPORARY' && new Date(startAt).getTime() >= new Date(endAt).getTime()) {
      setError('Bitiş tarihi başlangıç tarihinden sonra olmalıdır.');
      return;
    }

    setSaving(true);

    try {
      await createAssetRequest({
        assetId,
        assetAssignmentType: assignmentType,
        startAt: assignmentType === 'TEMPORARY' ? new Date(startAt).toISOString() : undefined,
        endAt: assignmentType === 'TEMPORARY' ? new Date(endAt).toISOString() : undefined
      });
      setAssignmentType('PERMANENT');
      setStartAt('');
      setEndAt('');
      setMessage('Demirbaş talebi onaya gönderildi.');
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Demirbaş talebi oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Demirbaş Talepleri" subtitle="Kalıcı veya geçici demirbaş taleplerinizi oluşturun ve takip edin" />

      {error ? <div className="page-card text-sm text-red-600">{error}</div> : null}
      {message ? <div className="page-card text-sm text-emerald-700">{message}</div> : null}

      <form className="page-card space-y-3" onSubmit={submit}>
        <h2 className="text-base font-semibold text-slate-950">Demirbaş Talebi Oluştur</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <select className="input" value={assetId} onChange={(event) => setAssetId(event.target.value)} required>
            <option value="">Demirbaş seçin</option>
            {activeAssets.map((asset) => (
              <option key={asset._id} value={asset._id}>{asset.name} - {asset.category}</option>
            ))}
          </select>
          <select className="input" value={assignmentType} onChange={(event) => setAssignmentType(event.target.value as AssetAssignmentType)}>
            <option value="PERMANENT">Kalıcı</option>
            <option value="TEMPORARY">Geçici</option>
          </select>
          {assignmentType === 'TEMPORARY' ? (
            <>
              <input className="input" type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} required />
              <input className="input" type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} required />
            </>
          ) : null}
        </div>
        <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={saving || activeAssets.length === 0}>
          {saving ? 'Gönderiliyor...' : 'Onaya Gönder'}
        </button>
      </form>

      <section className="page-card">
        {loading ? <p className="text-sm text-slate-500">Yükleniyor...</p> : null}
        {!loading && assetRequests.length === 0 ? <EmptyState message="Henüz demirbaş talebi yok." /> : null}
        {!loading && assetRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Demirbaş</th>
                  <th className="pb-2">Atama Tipi</th>
                  <th className="pb-2">Tarih Aralığı</th>
                  <th className="pb-2">Durum</th>
                  <th className="pb-2">Oluşturma</th>
                </tr>
              </thead>
              <tbody>
                {assetRequests.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="py-2">{item.assetId ? `${item.assetId.name} - ${item.assetId.category}` : '-'}</td>
                    <td className="py-2">{item.assetAssignmentType === 'TEMPORARY' ? 'Geçici' : 'Kalıcı'}</td>
                    <td className="py-2">{item.assetAssignmentType === 'TEMPORARY' ? `${formatDate(item.startAt)} - ${formatDate(item.endAt)}` : '-'}</td>
                    <td className="py-2">{translateStatus(item.status)}</td>
                    <td className="py-2">{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function translateStatus(value: RequestItem['status']) {
  if (value === 'APPROVED') return 'Onaylandı';
  if (value === 'REJECTED') return 'Reddedildi';
  return 'Bekliyor';
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR');
}
