import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { createAttendanceLog, getAttendanceLogs } from '../api/attendance.api';
import type { AttendanceLog } from '../types/attendance.types';
import { getEmployees } from '../../employees/api/employees.api';
import type { Employee } from '../../employees/types/employee.types';
import { useAuthStore } from '../../auth/auth.store';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';

export function AttendancePage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [items, setItems] = useState<AttendanceLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [note, setNote] = useState('');

  const load = async () => {
    const logs = await getAttendanceLogs();
    setItems(logs);
  };

  useEffect(() => {
    load();
    if (isAdmin) {
      getEmployees().then(setEmployees);
    }
  }, []);

  const clock = async (type: 'CLOCK_IN' | 'CLOCK_OUT') => {
    await createAttendanceLog({
      type,
      employeeId: isAdmin && employeeId ? employeeId : undefined,
      note,
      source: isAdmin ? 'MANUAL' : 'WEB'
    });
    setNote('');
    await load();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="Clock in/out and review logs" />

      <div className="page-card">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {isAdmin ? (
            <select className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option value={emp._id} key={emp._id}>{emp.firstName} {emp.lastName}</option>
              ))}
            </select>
          ) : null}
          <input className="input md:col-span-2" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="mt-3 flex gap-2">
          <button className="btn-primary" onClick={() => clock('CLOCK_IN')}>Clock In</button>
          <button className="btn-secondary" onClick={() => clock('CLOCK_OUT')}>Clock Out</button>
        </div>
      </div>

      <div className="page-card">
        {items.length === 0 ? (
          <EmptyState message="No attendance logs found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Employee</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Source</th>
                  <th className="pb-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="py-2">{item.employeeId?.firstName} {item.employeeId?.lastName}</td>
                    <td className="py-2">{item.type}</td>
                    <td className="py-2">{format(new Date(item.timestamp), 'dd MMM yyyy HH:mm')}</td>
                    <td className="py-2">{item.source}</td>
                    <td className="py-2">{item.note || '-'}</td>
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
