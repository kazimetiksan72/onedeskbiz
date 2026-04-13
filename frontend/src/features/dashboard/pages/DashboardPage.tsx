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
      <PageHeader title="Dashboard" subtitle="Business snapshot and recent activity" />

      {loading ? <Loading /> : null}

      {!loading && data ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Active Employees" value={data.metrics.employeeCount} />
            <MetricCard label="Active Customers" value={data.metrics.activeCustomerCount} />
            <MetricCard label="Pending Leave Requests" value={data.metrics.pendingLeaveCount} />
            <MetricCard label="Attendance Logs Today" value={data.metrics.todayAttendanceCount} />
          </div>

          <div className="page-card">
            <h2 className="mb-3 text-base font-semibold">Recent Leave Requests</h2>
            {data.recentLeaveRequests.length === 0 ? (
              <EmptyState message="No leave requests yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2">Employee</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Dates</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentLeaveRequests.map((item) => (
                      <tr key={item._id} className="border-t border-slate-100">
                        <td className="py-2">
                          {item.employeeId?.firstName} {item.employeeId?.lastName}
                        </td>
                        <td className="py-2">{item.leaveType}</td>
                        <td className="py-2">
                          {format(new Date(item.startDate), 'dd MMM yyyy')} -{' '}
                          {format(new Date(item.endDate), 'dd MMM yyyy')}
                        </td>
                        <td className="py-2">{item.status}</td>
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

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="page-card">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-brand-700">{value}</p>
    </div>
  );
}
