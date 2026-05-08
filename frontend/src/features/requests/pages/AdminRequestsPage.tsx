import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { approveRequest, getApprovalRequests, rejectRequest } from '../api/requests.api';
import type { RequestItem, RequestStatus, RequestType } from '../types/request.types';

const typeFilterOptions: Array<{ value: RequestType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Tüm Tipler' },
  { value: 'VEHICLE', label: 'Araç' },
  { value: 'LEAVE', label: 'İzin' },
  { value: 'MATERIAL', label: 'Malzeme' },
  { value: 'EXPENSE', label: 'Masraf' }
];

export function AdminRequestsPage() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [status, setStatus] = useState<RequestStatus | 'ALL'>('PENDING');
  const [type, setType] = useState<RequestType | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const filteredItems = useMemo(
    () => items.filter((item) => type === 'ALL' || item.type === type),
    [items, type]
  );

  const load = async () => {
    setError('');
    setLoading(true);

    try {
      setItems(await getApprovalRequests(status));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Talepler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const act = async (item: RequestItem, action: 'APPROVE' | 'REJECT') => {
    setMessage('');
    setError('');
    setActingId(item._id);

    try {
      if (action === 'APPROVE') {
        await approveRequest(item._id);
        setMessage('Talep onaylandı.');
      } else {
        await rejectRequest(item._id);
        setMessage('Talep reddedildi.');
      }
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Talep güncellenemedi.');
    } finally {
      setActingId('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Talepler" subtitle="Araç, izin, malzeme ve masraf taleplerini görüntüleyin ve onaylayın" />

      {error ? <div className="page-card text-sm text-red-600">{error}</div> : null}
      {message ? <div className="page-card text-sm text-emerald-700">{message}</div> : null}

      <div className="page-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <select className="input sm:w-48" value={status} onChange={(event) => setStatus(event.target.value as RequestStatus | 'ALL')}>
            <option value="PENDING">Bekleyen</option>
            <option value="ALL">Tümü</option>
            <option value="APPROVED">Onaylanan</option>
            <option value="REJECTED">Reddedilen</option>
          </select>
          <select className="input sm:w-48" value={type} onChange={(event) => setType(event.target.value as RequestType | 'ALL')}>
            {typeFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <button className="btn-secondary" onClick={load} disabled={loading}>
          {loading ? 'Yükleniyor...' : 'Yenile'}
        </button>
      </div>

      <div className="page-card">
        {loading ? <p className="text-sm text-slate-500">Yükleniyor...</p> : null}
        {!loading && filteredItems.length === 0 ? <EmptyState message="Talep bulunamadı." /> : null}
        {!loading && filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Talep Eden</th>
                  <th className="pb-2">Tip</th>
                  <th className="pb-2">Detay</th>
                  <th className="pb-2">Durum</th>
                  <th className="pb-2">Tarih</th>
                  <th className="pb-2 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100 align-top">
                    <td className="py-3">
                      <div className="font-medium text-slate-900">{formatUser(item.requesterUserId)}</div>
                      <div className="text-xs text-slate-500">{item.requesterDepartment || item.requesterUserId?.department || '-'}</div>
                    </td>
                    <td className="py-3">{requestTypeLabel(item.type)}</td>
                    <td className="max-w-md py-3 text-slate-700">
                      <div>{requestDetail(item)}</div>
                      {item.expenseAttachments?.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.expenseAttachments.map((attachment, index) => (
                            <a
                              key={`${attachment.url}-${index}`}
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                            >
                              Belge {index + 1}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3">{requestStatusLabel(item.status)}</td>
                    <td className="py-3">{formatDateTime(item.createdAt)}</td>
                    <td className="py-3 text-right">
                      {item.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => act(item, 'APPROVE')}
                            disabled={actingId === item._id}
                          >
                            Onayla
                          </button>
                          <button
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => act(item, 'REJECT')}
                            disabled={actingId === item._id}
                          >
                            Reddet
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">{approvalText(item)}</span>
                      )}
                    </td>
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

function requestDetail(item: RequestItem) {
  if (item.type === 'VEHICLE') {
    const vehicle = item.vehicleId ? `${item.vehicleId.plate} - ${item.vehicleId.brand} ${item.vehicleId.model}` : 'Araç';
    return `${vehicle} | ${formatDateTime(item.startAt)} - ${formatDateTime(item.endAt)}`;
  }

  if (item.type === 'LEAVE') {
    return `${leaveTypeLabel(item.leaveType)} | ${formatDateTime(item.startAt)} - ${formatDateTime(item.endAt)}${item.reason ? ` | ${item.reason}` : ''}`;
  }

  if (item.type === 'MATERIAL') {
    return item.materialText || '-';
  }

  return `${formatMoney(item.expenseAmount, item.expenseCurrency)} | ${item.expenseDescription || '-'}`;
}

function formatUser(user?: RequestItem['requesterUserId']) {
  if (!user) return '-';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.workEmail || '-';
}

function approvalText(item: RequestItem) {
  if (!item.approvalAction) return '-';
  const actor = formatUser(item.approvalAction.actorUserId);
  return `${item.approvalAction.action === 'APPROVE' ? 'Onaylayan' : 'Reddeden'}: ${actor}`;
}

function requestTypeLabel(value: RequestType) {
  if (value === 'VEHICLE') return 'Araç Talebi';
  if (value === 'LEAVE') return 'İzin Talebi';
  if (value === 'MATERIAL') return 'Malzeme Talebi';
  return 'Masraf Talebi';
}

function requestStatusLabel(value: RequestStatus) {
  if (value === 'APPROVED') return 'Onaylandı';
  if (value === 'REJECTED') return 'Reddedildi';
  return 'Bekliyor';
}

function leaveTypeLabel(value?: RequestItem['leaveType']) {
  if (value === 'SICK') return 'Hastalık';
  if (value === 'UNPAID') return 'Ücretsiz izin';
  if (value === 'OTHER') return 'Diğer';
  return 'Yıllık izin';
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR');
}

function formatMoney(amount?: number, currency = 'TRY') {
  if (!amount) return '-';
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
}
