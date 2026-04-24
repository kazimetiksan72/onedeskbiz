import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteContact, getContact, updateContact } from '../api/contacts.api';
import type { Contact } from '../types/contact.types';
import { getCustomers } from '../../customers/api/customers.api';
import type { Customer } from '../../customers/types/customer.types';
import { Loading } from '../../../components/Loading';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { ModalPortal } from '../../../components/ModalPortal';

interface ContactForm { customerId?: string; firstName: string; lastName: string; phone?: string; email?: string; }

export function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<ContactForm | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getContact(id), getCustomers()]).then(([contactData, customerList]) => { setContact(contactData); setCustomers(customerList); }).catch(() => setError('Kişi detay bilgileri yüklenemedi.')).finally(() => setLoading(false));
  }, [id]);

  const openEdit = () => { if (!contact) return; setForm({ customerId: contact.customerId?._id || '', firstName: contact.firstName, lastName: contact.lastName, phone: contact.phone || '', email: contact.email || '' }); setIsEditOpen(true); };
  const onSave = async (event: FormEvent) => { event.preventDefault(); if (!id || !form) return; const updated = await updateContact(id, form); setContact(updated); setIsEditOpen(false); };
  const onDelete = async () => { if (!id) return; await deleteContact(id); navigate('/admin/contacts'); };

  if (loading) return <Loading />;
  if (error || !contact) return <div className="animate-slide-in-right space-y-4"><button type="button" className="btn-secondary" onClick={() => navigate('/admin/contacts')}>Geri dön</button><div className="page-card text-sm text-red-600">{error || 'Kişi bulunamadı.'}</div></div>;

  return <div className="animate-slide-in-right space-y-5"><div className="flex items-center justify-between gap-3"><button type="button" className="btn-secondary" onClick={() => navigate('/admin/contacts')}>Geri dön</button><div className="flex gap-2"><button type="button" className="btn-secondary" onClick={openEdit}>Düzenle</button><button type="button" className="btn-danger" onClick={() => setIsDeleteOpen(true)}>Sil</button></div></div><section className="page-card space-y-5"><div><p className="text-sm font-medium text-slate-500">Kişi Detayı</p><h1 className="mt-1 text-2xl font-semibold text-slate-950">{contact.firstName} {contact.lastName}</h1><p className="mt-1 text-sm text-slate-500">{contact.customerId?.companyName || 'Firma seçilmedi'}</p></div><div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2"><DetailItem label="Firma" value={contact.customerId?.companyName} /><DetailItem label="E-posta" value={contact.email} /><DetailItem label="Telefon" value={contact.phone} /><DetailItem label="Firma Web Sitesi" value={contact.customerId?.website} /><DetailItem label="Firma Telefonu" value={contact.customerId?.phone} /><DetailItem label="Firma Adresi" value={contact.customerId?.address} /></div></section>{isEditOpen && form ? <FormModal title="Kişiyi Düzenle" onClose={() => setIsEditOpen(false)}><form onSubmit={onSave} className="space-y-3"><div className="grid grid-cols-1 gap-3 md:grid-cols-2"><input className="input" placeholder="Ad" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /><input className="input" placeholder="Soyad" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /><input className="input" placeholder="E-posta" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /><input className="input" placeholder="Telefon" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><select className="input md:col-span-2" value={form.customerId || ''} onChange={(e) => setForm({ ...form, customerId: e.target.value })}><option value="">Firma seçilmedi</option>{customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.companyName}</option>)}</select></div><div className="flex gap-2"><button className="btn-primary" type="submit">Güncelle</button><button className="btn-secondary" type="button" onClick={() => setIsEditOpen(false)}>Vazgeç</button></div></form></FormModal> : null}{isDeleteOpen ? <ConfirmDialog title="Kişiyi Sil" message="Bu kişiyi silmek istediğinize emin misiniz?" onConfirm={onDelete} onCancel={() => setIsDeleteOpen(false)} /> : null}</div>;
}
function DetailItem({ label, value }: { label: string; value?: string }) { return <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-words text-slate-900">{value || '-'}</p></div>; }
function FormModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <ModalPortal><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between gap-4"><h2 className="text-lg font-semibold text-slate-950">{title}</h2><button type="button" className="btn-secondary" onClick={onClose}>Kapat</button></div>{children}</div></ModalPortal>; }
