import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { createLeaveRequest, getLeaveRequests } from '../api/leaveRequests.api';
import type { LeaveRequest } from '../types/leaveRequest.types';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';

export function LeaveRequestsPage() {
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [leaveType, setLeaveType] = useState<'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'>('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const load = async () => {
    const data = await getLeaveRequests();
    setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="İzin Talepleri" subtitle="İzin taleplerinizi oluşturun ve takip edin" />

      <form
        className="page-card space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          await createLeaveRequest({
            leaveType,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            reason
          });
          setReason('');
          await load();
        }}
      >
        <h2 className="text-base font-semibold">İzin Talebi Oluştur</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select className="input" value={leaveType} onChange={(e) => setLeaveType(e.target.value as any)}>
            <option value="ANNUAL">Yıllık izin</option>
            <option value="SICK">Hastalık</option>
            <option value="UNPAID">Ücretsiz izin</option>
            <option value="OTHER">Diğer</option>
          </select>
          <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
        <textarea className="input" placeholder="Açıklama" value={reason} onChange={(e) => setReason(e.target.value)} />
        <button className="btn-primary" type="submit">Talep Gönder</button>
      </form>

      <div className="page-card">
        {items.length === 0 ? (
          <EmptyState message="Henüz izin talebi yok." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Personel</th>
                  <th className="pb-2">Tür</th>
                  <th className="pb-2">Tarih</th>
                  <th className="pb-2">Gün</th>
                  <th className="pb-2">Durum</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="py-2">{item.userId?.firstName} {item.userId?.lastName}</td>
                    <td className="py-2">{translateLeaveType(item.leaveType)}</td>
                    <td className="py-2">{format(new Date(item.startDate), 'dd MMM yyyy')} - {format(new Date(item.endDate), 'dd MMM yyyy')}</td>
                    <td className="py-2">{item.days}</td>
                    <td className="py-2">{translateLeaveStatus(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function translateLeaveType(value: LeaveRequest['leaveType']) {
  if (value === 'SICK') return 'Hastalık';
  if (value === 'UNPAID') return 'Ücretsiz izin';
  if (value === 'OTHER') return 'Diğer';
  return 'Yıllık izin';
}

function translateLeaveStatus(value: LeaveRequest['status']) {
  if (value === 'APPROVED') return 'Onaylandı';
  if (value === 'REJECTED') return 'Reddedildi';
  return 'Bekliyor';
}
