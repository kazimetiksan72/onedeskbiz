import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getDashboardSummary } from '../api/dashboard.api';
import type { DashboardSummary } from '../types/dashboard.types';
import { PageHeader } from '../../../components/PageHeader';
import { Loading } from '../../../components/Loading';
import { EmptyState } from '../../../components/EmptyState';

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Panel" subtitle="İşletmenin güncel özeti ve son hareketler" />

      {loading ? <Loading /> : null}

      {!loading && data ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="Aktif Personel" value={data.metrics.employeeCount} />
            <MetricCard label="Aktif Müşteri" value={data.metrics.activeCustomerCount} />
            <MetricCard label="Bekleyen İzin Talebi" value={data.metrics.pendingLeaveCount} />
          </div>

          <div className="page-card">
            <h2 className="mb-3 text-base font-semibold">Son İzin Talepleri</h2>
            {data.recentLeaveRequests.length === 0 ? (
              <EmptyState message="Henüz izin talebi yok." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2">Personel</th>
                      <th className="pb-2">Tür</th>
                      <th className="pb-2">Tarih</th>
                      <th className="pb-2">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentLeaveRequests.map((item) => (
                      <tr key={item._id} className="border-t border-slate-100">
                        <td className="py-2">
                          {item.userId?.firstName} {item.userId?.lastName}
                        </td>
                        <td className="py-2">{translateLeaveType(item.leaveType)}</td>
                        <td className="py-2">
                          {format(new Date(item.startDate), 'dd MMM yyyy')} -{' '}
                          {format(new Date(item.endDate), 'dd MMM yyyy')}
                        </td>
                        <td className="py-2">{translateLeaveStatus(item.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function translateLeaveType(value: DashboardSummary['recentLeaveRequests'][number]['leaveType']) {
  if (value === 'SICK') return 'Hastalık';
  if (value === 'UNPAID') return 'Ücretsiz izin';
  if (value === 'OTHER') return 'Diğer';
  return 'Yıllık izin';
}

function translateLeaveStatus(value: DashboardSummary['recentLeaveRequests'][number]['status']) {
  if (value === 'APPROVED') return 'Onaylandı';
  if (value === 'REJECTED') return 'Reddedildi';
  return 'Bekliyor';
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="page-card">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-brand-700">{value}</p>
    </div>
  );
}
