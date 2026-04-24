import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteCustomer, getCustomer, updateCustomer } from '../api/customers.api';
import type { Customer } from '../types/customer.types';
import { Loading } from '../../../components/Loading';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { ModalPortal } from '../../../components/ModalPortal';

type CustomerForm = Pick<Customer, 'companyName' | 'website' | 'address' | 'phone' | 'taxNumber' | 'taxOffice' | 'status'>;

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCustomer(id).then(setCustomer).catch(() => setError('Müşteri detay bilgileri yüklenemedi.')).finally(() => setLoading(false));
  }, [id]);

  const openEdit = () => {
    if (!customer) return;
    setForm({ companyName: customer.companyName, website: customer.website || '', address: customer.address || '', phone: customer.phone || '', taxNumber: customer.taxNumber || '', taxOffice: customer.taxOffice || '', status: customer.status });
    setIsEditOpen(true);
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !form) return;
    const updated = await updateCustomer(id, form);
    setCustomer(updated);
    setIsEditOpen(false);
  };

  const onDelete = async () => {
    if (!id) return;
    setDeleteError('');
    try {
      await deleteCustomer(id);
      navigate('/admin/customers');
    } catch (requestError: any) {
      setDeleteError(requestError?.response?.data?.message || 'Müşteri silinemedi.');
    }
  };

  if (loading) return <Loading />;
  if (error || !customer) return <div className="animate-slide-in-right space-y-4"><button type="button" className="btn-secondary" onClick={() => navigate('/admin/customers')}>Geri dön</button><div className="page-card text-sm text-red-600">{error || 'Müşteri bulunamadı.'}</div></div>;

  return (
    <div className="animate-slide-in-right space-y-5">
      <div className="flex items-center justify-between gap-3"><button type="button" className="btn-secondary" onClick={() => navigate('/admin/customers')}>Geri dön</button><div className="flex gap-2"><button type="button" className="btn-secondary" onClick={openEdit}>Düzenle</button><button type="button" className="btn-danger" onClick={() => { setDeleteError(''); setIsDeleteOpen(true); }}>Sil</button></div></div>
      <section className="page-card space-y-5"><div><p className="text-sm font-medium text-slate-500">Müşteri Detayı</p><h1 className="mt-1 text-2xl font-semibold text-slate-950">{customer.companyName}</h1><p className="mt-1 text-sm text-slate-500">{customer.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}</p></div><div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2"><DetailItem label="Web Sitesi" value={customer.website} /><DetailItem label="Telefon" value={customer.phone} /><DetailItem label="Vergi Numarası" value={customer.taxNumber} /><DetailItem label="Vergi Dairesi" value={customer.taxOffice} /><DetailItem label="Adres" value={customer.address} /><DetailItem label="Durum" value={customer.status === 'ACTIVE' ? 'Aktif' : 'Pasif'} /></div></section>
      {isEditOpen && form ? <FormModal title="Müşteriyi Düzenle" onClose={() => setIsEditOpen(false)}><form onSubmit={onSave} className="space-y-3"><div className="grid grid-cols-1 gap-3 md:grid-cols-2"><input className="input" placeholder="Firma adı" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required /><input className="input" placeholder="Web sitesi" value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} /><input className="input" placeholder="Telefon" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><input className="input" placeholder="Vergi numarası" value={form.taxNumber || ''} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} /><input className="input" placeholder="Vergi dairesi" value={form.taxOffice || ''} onChange={(e) => setForm({ ...form, taxOffice: e.target.value })} /><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Customer['status'] })}><option value="ACTIVE">Aktif</option><option value="INACTIVE">Pasif</option></select></div><textarea className="input" placeholder="Adres" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /><div className="flex gap-2"><button className="btn-primary" type="submit">Güncelle</button><button className="btn-secondary" type="button" onClick={() => setIsEditOpen(false)}>Vazgeç</button></div></form></FormModal> : null}
      {isDeleteOpen ? <ConfirmDialog title="Müşteriyi Sil" message="Bu müşteriyi silmek istediğinize emin misiniz?" onConfirm={onDelete} onCancel={() => { setDeleteError(''); setIsDeleteOpen(false); }}>{deleteError ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{deleteError}</p> : null}</ConfirmDialog> : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value?: string }) { return <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-words text-slate-900">{value || '-'}</p></div>; }
function FormModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <ModalPortal><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between gap-4"><h2 className="text-lg font-semibold text-slate-950">{title}</h2><button type="button" className="btn-secondary" onClick={onClose}>Kapat</button></div>{children}</div></ModalPortal>; }
