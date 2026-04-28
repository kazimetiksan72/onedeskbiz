import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { getVehicles } from '../../vehicles/api/vehicles.api';
import type { Vehicle } from '../../vehicles/types/vehicle.types';
import { createVehicleRequest, getMyRequests } from '../api/requests.api';
import type { RequestItem } from '../types/request.types';

export function VehicleRequestsPage() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const vehicleRequests = useMemo(() => items.filter((item) => item.type === 'VEHICLE'), [items]);
  const activeVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.status !== 'INACTIVE'), [vehicles]);

  const load = async () => {
    setError('');
    setLoading(true);

    try {
      const [requestItems, vehicleItems] = await Promise.all([getMyRequests(), getVehicles('')]);
      setItems(requestItems);
      setVehicles(vehicleItems);
      setVehicleId((current) => current || vehicleItems.find((vehicle) => vehicle.status !== 'INACTIVE')?._id || '');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Araç talepleri yüklenemedi.');
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

    if (new Date(startAt).getTime() >= new Date(endAt).getTime()) {
      setError('Bitiş tarihi başlangıç tarihinden sonra olmalıdır.');
      return;
    }

    setSaving(true);

    try {
      await createVehicleRequest({
        vehicleId,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString()
      });
      setStartAt('');
      setEndAt('');
      setMessage('Araç talebi onaya gönderildi.');
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Araç talebi oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Araç Talepleri" subtitle="Araç kullanım taleplerinizi oluşturun ve takip edin" />

      {error ? <div className="page-card text-sm text-red-600">{error}</div> : null}
      {message ? <div className="page-card text-sm text-emerald-700">{message}</div> : null}

      <form className="page-card space-y-3" onSubmit={submit}>
        <h2 className="text-base font-semibold text-slate-950">Araç Talebi Oluştur</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select className="input" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} required>
            <option value="">Araç seçin</option>
            {activeVehicles.map((vehicle) => (
              <option key={vehicle._id} value={vehicle._id}>{vehicle.plate} - {vehicle.brand} {vehicle.model}</option>
            ))}
          </select>
          <input className="input" type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} required />
          <input className="input" type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} required />
        </div>
        <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={saving || activeVehicles.length === 0}>
          {saving ? 'Gönderiliyor...' : 'Onaya Gönder'}
        </button>
      </form>

      <div className="page-card">
        {loading ? <p className="text-sm text-slate-500">Yükleniyor...</p> : null}
        {!loading && vehicleRequests.length === 0 ? <EmptyState message="Henüz araç talebi yok." /> : null}
        {!loading && vehicleRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Araç</th>
                  <th className="pb-2">Tarih Aralığı</th>
                  <th className="pb-2">Durum</th>
                  <th className="pb-2">Oluşturma</th>
                </tr>
              </thead>
              <tbody>
                {vehicleRequests.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="py-2">{item.vehicleId ? `${item.vehicleId.plate} - ${item.vehicleId.brand} ${item.vehicleId.model}` : '-'}</td>
                    <td className="py-2">{formatDateTime(item.startAt)} - {formatDateTime(item.endAt)}</td>
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
