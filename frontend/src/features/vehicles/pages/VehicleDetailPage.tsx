import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteVehicle, getVehicle, updateVehicle } from '../api/vehicles.api';
import type { Vehicle } from '../types/vehicle.types';
import { Loading } from '../../../components/Loading';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { ModalPortal } from '../../../components/ModalPortal';

interface VehicleForm { plate: string; brand: string; model: string; modelYear: string; kilometer: string; status: 'ACTIVE' | 'INACTIVE'; }

export function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleForm | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { if (!id) return; setLoading(true); getVehicle(id).then(setVehicle).catch(() => setError('Araç detay bilgileri yüklenemedi.')).finally(() => setLoading(false)); }, [id]);
  const openEdit = () => { if (!vehicle) return; setForm({ plate: vehicle.plate, brand: vehicle.brand, model: vehicle.model, modelYear: String(vehicle.modelYear), kilometer: String(vehicle.kilometer), status: vehicle.status }); setIsEditOpen(true); };
  const onSave = async (event: FormEvent) => { event.preventDefault(); if (!id || !form) return; const updated = await updateVehicle(id, { ...form, modelYear: Number(form.modelYear), kilometer: Number(form.kilometer) }); setVehicle(updated); setIsEditOpen(false); };
  const onDelete = async () => { if (!id) return; await deleteVehicle(id); navigate('/admin/vehicles'); };

  if (loading) return <Loading />;
  if (error || !vehicle) return <div className="animate-slide-in-right space-y-4"><button type="button" className="btn-secondary" onClick={() => navigate('/admin/vehicles')}>Geri dön</button><div className="page-card text-sm text-red-600">{error || 'Araç bulunamadı.'}</div></div>;

  return <div className="animate-slide-in-right space-y-5"><div className="flex items-center justify-between gap-3"><button type="button" className="btn-secondary" onClick={() => navigate('/admin/vehicles')}>Geri dön</button><div className="flex gap-2"><button type="button" className="btn-secondary" onClick={openEdit}>Düzenle</button><button type="button" className="btn-danger" onClick={() => setIsDeleteOpen(true)}>Sil</button></div></div><section className="page-card space-y-5"><div><p className="text-sm font-medium text-slate-500">Araç Detayı</p><h1 className="mt-1 text-2xl font-semibold text-slate-950">{vehicle.plate}</h1><p className="mt-1 text-sm text-slate-500">{vehicle.brand} {vehicle.model}</p></div><div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2"><DetailItem label="Plaka" value={vehicle.plate} /><DetailItem label="Marka" value={vehicle.brand} /><DetailItem label="Model" value={vehicle.model} /><DetailItem label="Model Yılı" value={String(vehicle.modelYear)} /><DetailItem label="Kilometre" value={`${vehicle.kilometer.toLocaleString('tr-TR')} km`} /><DetailItem label="Durum" value={vehicle.status === 'ACTIVE' ? 'Aktif' : 'Pasif'} /></div></section>{isEditOpen && form ? <FormModal title="Aracı Düzenle" onClose={() => setIsEditOpen(false)}><form onSubmit={onSave} className="space-y-3"><div className="grid grid-cols-1 gap-3 md:grid-cols-2"><input className="input" placeholder="Plaka" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} required /><input className="input" placeholder="Marka" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required /><input className="input" placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required /><input className="input" type="number" placeholder="Model yılı" value={form.modelYear} onChange={(e) => setForm({ ...form, modelYear: e.target.value })} required /><input className="input" type="number" placeholder="Kilometre" value={form.kilometer} onChange={(e) => setForm({ ...form, kilometer: e.target.value })} required /><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Vehicle['status'] })}><option value="ACTIVE">Aktif</option><option value="INACTIVE">Pasif</option></select></div><div className="flex gap-2"><button className="btn-primary" type="submit">Güncelle</button><button className="btn-secondary" type="button" onClick={() => setIsEditOpen(false)}>Vazgeç</button></div></form></FormModal> : null}{isDeleteOpen ? <ConfirmDialog title="Aracı Sil" message="Bu aracı silmek istediğinize emin misiniz?" onConfirm={onDelete} onCancel={() => setIsDeleteOpen(false)} /> : null}</div>;
}
function DetailItem({ label, value }: { label: string; value?: string }) { return <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-words text-slate-900">{value || '-'}</p></div>; }
function FormModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <ModalPortal><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between gap-4"><h2 className="text-lg font-semibold text-slate-950">{title}</h2><button type="button" className="btn-secondary" onClick={onClose}>Kapat</button></div>{children}</div></ModalPortal>; }
