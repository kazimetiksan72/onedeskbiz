import { useEffect, useState, type FormEvent } from 'react';
import { createEmployee, deleteEmployee, getEmployees, updateEmployee } from '../api/employees.api';
import type { Employee } from '../types/employee.types';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { useAuthStore } from '../../auth/auth.store';

const initialForm: Partial<Employee> = {
  firstName: '',
  lastName: '',
  workEmail: '',
  department: '',
  title: '',
  startDate: new Date().toISOString(),
  status: 'ACTIVE',
  employmentType: 'FULL_TIME'
};

export function EmployeesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [items, setItems] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [form, setForm] = useState<Partial<Employee>>(initialForm);
  const [search, setSearch] = useState('');

  const load = async () => {
    const result = await getEmployees(search);
    setItems(result);
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const payload = {
      ...form,
      startDate: form.startDate || new Date().toISOString()
    };

    if (selected) {
      await updateEmployee(selected._id, payload);
    } else {
      await createEmployee(payload);
    }

    setSelected(null);
    setForm(initialForm);
    await load();
  };

  const onEdit = (item: Employee) => {
    setSelected(item);
    setForm(item);
  };

  const onDelete = async (id: string) => {
    if (!isAdmin) return;
    await deleteEmployee(id);
    await load();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Employee Directory" subtitle="Manage employees and organization structure" />

      <div className="page-card">
        <div className="mb-3 flex gap-2">
          <input
            className="input"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-secondary" onClick={load}>
            Search
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyState message="No employees found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Department</th>
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Status</th>
                  {isAdmin ? <th className="pb-2">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="py-2">{item.firstName} {item.lastName}</td>
                    <td className="py-2">{item.workEmail}</td>
                    <td className="py-2">{item.department || '-'}</td>
                    <td className="py-2">{item.title || '-'}</td>
                    <td className="py-2">{item.status}</td>
                    {isAdmin ? (
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button className="btn-secondary" onClick={() => onEdit(item)}>Edit</button>
                          <button className="btn-secondary" onClick={() => onDelete(item._id)}>Delete</button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAdmin ? (
        <form onSubmit={onSave} className="page-card space-y-3">
          <h2 className="text-base font-semibold">{selected ? 'Update Employee' : 'Add Employee'}</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input className="input" placeholder="First name" value={form.firstName || ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <input className="input" placeholder="Last name" value={form.lastName || ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            <input className="input" placeholder="Work email" value={form.workEmail || ''} onChange={(e) => setForm({ ...form, workEmail: e.target.value })} required />
            <input className="input" placeholder="Department" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <input className="input" placeholder="Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="input" type="date" value={(form.startDate || '').slice(0, 10)} onChange={(e) => setForm({ ...form, startDate: new Date(e.target.value).toISOString() })} required />
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" type="submit">{selected ? 'Update' : 'Create'}</button>
            {selected ? (
              <button type="button" className="btn-secondary" onClick={() => {
                setSelected(null);
                setForm(initialForm);
              }}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
