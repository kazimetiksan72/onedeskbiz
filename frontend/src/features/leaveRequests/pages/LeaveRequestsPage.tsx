import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { createLeaveApprovalRequest, getMyRequests } from '../../requests/api/requests.api';
import type { RequestItem } from '../../requests/types/request.types';

type LeaveType = NonNullable<RequestItem['leaveType']>;

export function LeaveRequestsPage() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [leaveType, setLeaveType] = useState<LeaveType>('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const leaveRequests = useMemo(() => items.filter((item) => item.type === 'LEAVE'), [items]);

  const load = async () => {
    setError('');
    setLoading(true);

    try {
      setItems(await getMyRequests());
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'İzin talepleri yüklenemedi.');
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

    const startAt = new Date(`${startDate}T09:00:00`);
    const endAt = new Date(`${endDate}T18:00:00`);

    if (startAt.getTime() >= endAt.getTime()) {
      setError('Bitiş tarihi başlangıç tarihinden sonra olmalıdır.');
      return;
    }

    setSaving(true);

    try {
      await createLeaveApprovalRequest({
        leaveType,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        reason
      });
      setReason('');
      setMessage('İzin talebi onaya gönderildi.');
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'İzin talebi oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="İzin Talepleri" subtitle="İzin taleplerinizi oluşturun ve takip edin" />

      {error ? <div className="page-card text-sm text-red-600">{error}</div> : null}
      {message ? <div className="page-card text-sm text-emerald-700">{message}</div> : null}

      <form className="page-card space-y-3" onSubmit={submit}>
        <h2 className="text-base font-semibold text-slate-950">İzin Talebi Oluştur</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select className="input" value={leaveType} onChange={(event) => setLeaveType(event.target.value as LeaveType)}>
            <option value="ANNUAL">Yıllık izin</option>
            <option value="SICK">Hastalık</option>
            <option value="UNPAID">Ücretsiz izin</option>
            <option value="OTHER">Diğer</option>
          </select>
          <input type="date" className="input" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
          <input type="date" className="input" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
        </div>
        <textarea
          className="input min-h-24"
          placeholder="Açıklama"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={2000}
        />
        <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={saving}>
          {saving ? 'Gönderiliyor...' : 'Onaya Gönder'}
        </button>
      </form>

      <div className="page-card">
        {loading ? <p className="text-sm text-slate-500">Yükleniyor...</p> : null}
        {!loading && leaveRequests.length === 0 ? <EmptyState message="Henüz izin talebi yok." /> : null}
        {!loading && leaveRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Tür</th>
                  <th className="pb-2">Tarih</th>
                  <th className="pb-2">Açıklama</th>
                  <th className="pb-2">Durum</th>
                  <th className="pb-2">Oluşturma</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100 align-top">
                    <td className="py-2">{translateLeaveType(item.leaveType)}</td>
                    <td className="py-2">{formatDateTime(item.startAt)} - {formatDateTime(item.endAt)}</td>
                    <td className="max-w-xl py-2">{item.reason || '-'}</td>
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

function translateLeaveType(value?: RequestItem['leaveType']) {
  if (value === 'SICK') return 'Hastalık';
  if (value === 'UNPAID') return 'Ücretsiz izin';
  if (value === 'OTHER') return 'Diğer';
  return 'Yıllık izin';
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
