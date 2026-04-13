import { useEffect, useState, type FormEvent } from 'react';
import { createCustomer, deleteCustomer, getCustomers, updateCustomer } from '../api/customers.api';
import type { Customer } from '../types/customer.types';
import { getEmployees } from '../../employees/api/employees.api';
import type { Employee } from '../../employees/types/employee.types';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { useAuthStore } from '../../auth/auth.store';

interface CustomerForm {
  companyName: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  notes?: string;
  ownerEmployeeId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

const initialForm: CustomerForm = {
  companyName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  notes: '',
  status: 'ACTIVE'
};

export function CustomersPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [items, setItems] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(initialForm);

  const load = async () => {
    const [customers, employeeList] = await Promise.all([getCustomers(), getEmployees()]);
    setItems(customers);
    setEmployees(employeeList);
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (selected) {
      await updateCustomer(selected._id, form as Partial<Customer>);
    } else {
      await createCustomer(form as Partial<Customer>);
    }

    setSelected(null);
    setForm(initialForm);
    await load();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" subtitle="Track customer contacts and ownership" />

      <div className="page-card">
        {items.length === 0 ? (
          <EmptyState message="No customers found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Company</th>
                  <th className="pb-2">Contact</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Owner</th>
                  <th className="pb-2">Status</th>
                  {isAdmin ? <th className="pb-2">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="py-2">{item.companyName}</td>
                    <td className="py-2">{item.contactName}</td>
                    <td className="py-2">{item.contactEmail || '-'}</td>
                    <td className="py-2">
                      {item.ownerEmployeeId
                        ? `${item.ownerEmployeeId.firstName} ${item.ownerEmployeeId.lastName}`
                        : '-'}
                    </td>
                    <td className="py-2">{item.status}</td>
                    {isAdmin ? (
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button
                            className="btn-secondary"
                            onClick={() => {
                              setSelected(item);
                              setForm({
                                companyName: item.companyName,
                                contactName: item.contactName,
                                contactEmail: item.contactEmail,
                                contactPhone: item.contactPhone,
                                address: item.address,
                                notes: item.notes,
                                status: item.status,
                                ownerEmployeeId: item.ownerEmployeeId?._id
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={async () => {
                              await deleteCustomer(item._id);
                              await load();
                            }}
                          >
                            Delete
                          </button>
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
          <h2 className="text-base font-semibold">{selected ? 'Update Customer' : 'Add Customer'}</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className="input"
              placeholder="Company name"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Contact name"
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Contact email"
              value={form.contactEmail || ''}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
            <input
              className="input"
              placeholder="Contact phone"
              value={form.contactPhone || ''}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
            <input
              className="input"
              placeholder="Address"
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <select
              className="input"
              value={form.ownerEmployeeId || ''}
              onChange={(e) => setForm({ ...form, ownerEmployeeId: e.target.value || undefined })}
            >
              <option value="">No owner</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="input"
            placeholder="Notes"
            value={form.notes || ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex gap-2">
            <button className="btn-primary" type="submit">
              {selected ? 'Update' : 'Create'}
            </button>
            {selected ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSelected(null);
                  setForm(initialForm);
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
