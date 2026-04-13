import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { createLeaveRequest, getLeaveRequests, reviewLeaveRequest } from '../api/leaveRequests.api';
import type { LeaveRequest } from '../types/leaveRequest.types';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { useAuthStore } from '../../auth/auth.store';

export function LeaveRequestsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
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
      <PageHeader title="Leave Requests" subtitle="Submit and review time-off requests" />

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
        <h2 className="text-base font-semibold">Create Leave Request</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select className="input" value={leaveType} onChange={(e) => setLeaveType(e.target.value as any)}>
            <option value="ANNUAL">Annual</option>
            <option value="SICK">Sick</option>
            <option value="UNPAID">Unpaid</option>
            <option value="OTHER">Other</option>
          </select>
          <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
        <textarea className="input" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        <button className="btn-primary" type="submit">Submit Request</button>
      </form>

      <div className="page-card">
        {items.length === 0 ? (
          <EmptyState message="No leave requests yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Employee</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Dates</th>
                  <th className="pb-2">Days</th>
                  <th className="pb-2">Status</th>
                  {isAdmin ? <th className="pb-2">Review</th> : null}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="py-2">{item.employeeId?.firstName} {item.employeeId?.lastName}</td>
                    <td className="py-2">{item.leaveType}</td>
                    <td className="py-2">{format(new Date(item.startDate), 'dd MMM yyyy')} - {format(new Date(item.endDate), 'dd MMM yyyy')}</td>
                    <td className="py-2">{item.days}</td>
                    <td className="py-2">{item.status}</td>
                    {isAdmin ? (
                      <td className="py-2">
                        {item.status === 'PENDING' ? (
                          <div className="flex gap-2">
                            <button className="btn-secondary" onClick={async () => {
                              await reviewLeaveRequest(item._id, { status: 'APPROVED' });
                              await load();
                            }}>
                              Approve
                            </button>
                            <button className="btn-secondary" onClick={async () => {
                              await reviewLeaveRequest(item._id, { status: 'REJECTED' });
                              await load();
                            }}>
                              Reject
                            </button>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    ) : null}
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
