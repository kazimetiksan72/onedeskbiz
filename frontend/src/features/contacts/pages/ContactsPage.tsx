import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { createContact, getContacts, updateContact } from '../api/contacts.api';
import type { Contact } from '../types/contact.types';
import { getCustomers } from '../../customers/api/customers.api';
import type { Customer } from '../../customers/types/customer.types';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { useAuthStore } from '../../auth/auth.store';

interface ContactForm {
  customerId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

const initialForm: ContactForm = {
  customerId: '',
  firstName: '',
  lastName: '',
  phone: '',
  email: ''
};

export function ContactsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [items, setItems] = useState<Contact[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactForm>(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    const [contacts, customerList] = await Promise.all([getContacts(search), getCustomers()]);
    setItems(contacts);
    setCustomers(customerList);
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (selected) {
      await updateContact(selected._id, form);
    } else {
      await createContact(form);
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
        title="Kişiler"
        subtitle="Müşteri firmalardaki kişi kayıtlarını yönetin"
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
            placeholder="Kişi ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-secondary" onClick={load}>
            Ara
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyState message="Kişi bulunamadı." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Ad Soyad</th>
                  <th className="pb-2">Firma</th>
                  <th className="pb-2">E-posta</th>
                  <th className="pb-2">Telefon</th>
                  <th className="pb-2 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="py-2">{item.firstName} {item.lastName}</td>
                    <td className="py-2">{item.customerId?.companyName || '-'}</td>
                    <td className="py-2">{item.email || '-'}</td>
                    <td className="py-2">{item.phone || '-'}</td>
                    <td className="py-2">
                      <div className="flex justify-end gap-2">
                        <button className="btn-primary" onClick={() => navigate(`/admin/contacts/${item._id}`)}>
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
        <FormModal title={selected ? 'Kişiyi Güncelle' : 'Kişi Ekle'} onClose={closeForm}>
          <form onSubmit={onSave} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className="input"
              placeholder="Ad"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Soyad"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="E-posta"
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="input"
              placeholder="Telefon"
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <select
              className="input md:col-span-2"
              value={form.customerId || ''}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            >
              <option value="">Firma seçilmedi</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.companyName}
                </option>
              ))}
            </select>
          </div>
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
