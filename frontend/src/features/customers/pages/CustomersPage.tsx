import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCustomer, getCustomers, updateCustomer } from '../api/customers.api';
import type { Customer } from '../types/customer.types';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { useAuthStore } from '../../auth/auth.store';

interface CustomerForm {
  companyName: string;
  website?: string;
  address?: string;
  phone?: string;
  taxNumber?: string;
  taxOffice?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

const initialForm: CustomerForm = {
  companyName: '',
  website: '',
  address: '',
  phone: '',
  taxNumber: '',
  taxOffice: '',
  status: 'ACTIVE'
};

export function CustomersPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [items, setItems] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    const customers = await getCustomers(search);
    setItems(customers);
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
    setIsFormOpen(false);
    await load();
  };

  const onCreate = () => {
    setSelected(null);
    setForm(initialForm);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setSelected(null);
    setForm(initialForm);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Müşteriler"
        subtitle="Firma bilgilerini yönetin"
        action={
          isAdmin ? (
            <button className="btn-primary" type="button" onClick={onCreate}>
              Yeni Ekle
            </button>
          ) : null
        }
      />

      <div className="page-card">
        <div className="mb-3 flex gap-2">
          <input
            className="input"
            placeholder="Firma ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-secondary" onClick={load}>
            Ara
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyState message="Müşteri bulunamadı." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Firma</th>
                  <th className="pb-2">Web Sitesi</th>
                  <th className="pb-2">Telefon</th>
                  <th className="pb-2">Vergi No</th>
                  <th className="pb-2">Durum</th>
                  <th className="pb-2 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="py-2">{item.companyName}</td>
                    <td className="py-2">{item.website || '-'}</td>
                    <td className="py-2">{item.phone || '-'}</td>
                    <td className="py-2">{item.taxNumber || '-'}</td>
                    <td className="py-2">{item.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}</td>
                    <td className="py-2">
                      <div className="flex justify-end gap-2">
                        <button className="btn-primary" onClick={() => navigate(`/admin/customers/${item._id}`)}>
                          Detay
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAdmin && isFormOpen ? (
        <FormModal title={selected ? 'Müşteriyi Güncelle' : 'Müşteri Ekle'} onClose={closeForm}>
          <form onSubmit={onSave} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className="input"
              placeholder="Firma adı"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Web sitesi"
              value={form.website || ''}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
            <input
              className="input"
              placeholder="Telefon"
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              className="input"
              placeholder="Vergi numarası"
              value={form.taxNumber || ''}
              onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
            />
            <input
              className="input"
              placeholder="Vergi dairesi"
              value={form.taxOffice || ''}
              onChange={(e) => setForm({ ...form, taxOffice: e.target.value })}
            />
            <select
              className="input"
              value={form.status || 'ACTIVE'}
              onChange={(e) => setForm({ ...form, status: e.target.value as CustomerForm['status'] })}
            >
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Pasif</option>
            </select>
          </div>
          <textarea
            className="input"
            placeholder="Adres"
            value={form.address || ''}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="flex gap-2">
            <button className="btn-primary" type="submit">
              {selected ? 'Güncelle' : 'Oluştur'}
            </button>
            {selected ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={closeForm}
              >
                Vazgeç
              </button>
            ) : null}
          </div>
        </form>
        </FormModal>
      ) : null}
    </div>
  );
}

function FormModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Kapat
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
