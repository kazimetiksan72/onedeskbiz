import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { ModalPortal } from '../../../components/ModalPortal';
import { useAuthStore } from '../../auth/auth.store';
import { getCompanySettings } from '../../companySettings/api/companySettings.api';
import { getEmployees } from '../../employees/api/employees.api';
import type { Employee } from '../../employees/types/employee.types';
import { assignAsset, createAsset, getAssetAssignments, getAssets, returnAssetAssignment, updateAsset } from '../api/assets.api';
import type { Asset, AssetAssignment, AssetAssignmentType } from '../types/asset.types';

const initialAssetForm = {
  name: '',
  category: 'Bilgisayar',
  brand: '',
  model: '',
  serialNumber: '',
  inventoryCode: '',
  department: '',
  status: 'ACTIVE' as Asset['status'],
  notes: ''
};

const initialAssignmentForm = {
  assetId: '',
  assignedUserId: '',
  type: 'PERMANENT' as AssetAssignmentType,
  startAt: '',
  endAt: '',
  notes: ''
};

export function AssetsPage() {
  const { user } = useAuthStore();
  const canManageAssets = user?.role === 'ADMIN' || user?.departmentRoleId?.permissions?.includes('ASSET_APPROVAL');
  const [items, setItems] = useState<Asset[]>([]);
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [assetForm, setAssetForm] = useState(initialAssetForm);
  const [assignmentForm, setAssignmentForm] = useState(initialAssignmentForm);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const managerDepartment = user?.role === 'ADMIN' ? '' : user?.department || '';
  const employeeOptions = useMemo(() => {
    if (user?.role === 'ADMIN') return employees;
    return employees.filter((employee) => !managerDepartment || employee.department === managerDepartment);
  }, [employees, managerDepartment, user?.role]);

  const load = async () => {
    setError('');
    setLoading(true);

    try {
      const [assetItems, assignmentItems, employeeItems, settings] = await Promise.all([
        getAssets(search),
        getAssetAssignments(false),
        getEmployees(''),
        getCompanySettings()
      ]);
      setItems(assetItems);
      setAssignments(assignmentItems);
      setEmployees(employeeItems);
      setDepartments(settings?.departments || []);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Demirbaş bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setSelected(null);
    setAssetForm({ ...initialAssetForm, department: managerDepartment });
    setAssetModalOpen(true);
  };

  const openEdit = (asset: Asset) => {
    setSelected(asset);
    setAssetForm({
      name: asset.name,
      category: asset.category,
      brand: asset.brand || '',
      model: asset.model || '',
      serialNumber: asset.serialNumber || '',
      inventoryCode: asset.inventoryCode || '',
      department: asset.department || '',
      status: asset.status,
      notes: asset.notes || ''
    });
    setAssetModalOpen(true);
  };

  const openAssign = (asset?: Asset) => {
    setAssignmentForm({ ...initialAssignmentForm, assetId: asset?._id || '' });
    setAssignmentModalOpen(true);
  };

  const saveAsset = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      if (selected) {
        await updateAsset(selected._id, assetForm);
        setMessage('Demirbaş güncellendi.');
      } else {
        await createAsset(assetForm);
        setMessage('Demirbaş oluşturuldu.');
      }
      setAssetModalOpen(false);
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Demirbaş kaydedilemedi.');
    }
  };

  const saveAssignment = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await assignAsset({
        assetId: assignmentForm.assetId,
        assignedUserId: assignmentForm.assignedUserId,
        type: assignmentForm.type,
        startAt: assignmentForm.startAt ? new Date(assignmentForm.startAt).toISOString() : undefined,
        endAt: assignmentForm.type === 'TEMPORARY' && assignmentForm.endAt ? new Date(assignmentForm.endAt).toISOString() : undefined,
        notes: assignmentForm.notes
      });
      setAssignmentModalOpen(false);
      setMessage('Demirbaş ataması oluşturuldu.');
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Demirbaş atanamadı.');
    }
  };

  const returnAssignment = async (id: string) => {
    setMessage('');
    setError('');
    try {
      await returnAssetAssignment(id);
      setMessage('Demirbaş iade alındı.');
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Demirbaş iade alınamadı.');
    }
  };

  if (!canManageAssets) {
    return <div className="page-card text-sm text-red-600">Demirbaş yönetim yetkiniz yok.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demirbaşlarım"
        subtitle="Bilgisayar, telefon, hard disk ve benzeri cihazları yönetin ve personele atayın"
        action={<button className="btn-primary" type="button" onClick={openCreate}>Yeni Demirbaş</button>}
      />

      {error ? <div className="page-card text-sm text-red-600">{error}</div> : null}
      {message ? <div className="page-card text-sm text-emerald-700">{message}</div> : null}

      <section className="page-card">
        <div className="mb-3 flex gap-2">
          <input className="input" placeholder="Demirbaş ara..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <button className="btn-secondary" type="button" onClick={load}>Ara</button>
        </div>

        {loading ? <p className="text-sm text-slate-500">Yükleniyor...</p> : null}
        {!loading && items.length === 0 ? <EmptyState message="Demirbaş bulunamadı." /> : null}
        {!loading && items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Demirbaş</th>
                  <th className="pb-2">Kategori</th>
                  <th className="pb-2">Seri / Kod</th>
                  <th className="pb-2">Departman</th>
                  <th className="pb-2">Durum</th>
                  <th className="pb-2 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="py-2 font-medium text-slate-900">{item.name} <span className="font-normal text-slate-500">{[item.brand, item.model].filter(Boolean).join(' ')}</span></td>
                    <td className="py-2">{item.category}</td>
                    <td className="py-2">{item.serialNumber || item.inventoryCode || '-'}</td>
                    <td className="py-2">{item.department || 'Genel'}</td>
                    <td className="py-2">{item.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}</td>
                    <td className="py-2">
                      <div className="flex justify-end gap-2">
                        <button className="btn-secondary btn-sm" type="button" onClick={() => openAssign(item)}>Ata</button>
                        <button className="btn-primary btn-sm" type="button" onClick={() => openEdit(item)}>Düzenle</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="page-card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-950">Aktif Atamalar</h2>
          <button className="btn-secondary" type="button" onClick={() => openAssign()}>Atama Yap</button>
        </div>
        {assignments.filter((item) => item.status === 'ACTIVE').length === 0 ? <EmptyState message="Aktif atama yok." /> : null}
        <div className="space-y-3">
          {assignments.filter((item) => item.status === 'ACTIVE').map((item) => (
            <div key={item._id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{item.assetId?.name || '-'}</p>
                <p className="text-sm text-slate-500">
                  {formatUser(item.assignedUserId)} · {item.type === 'PERMANENT' ? 'Kalıcı' : `Geçici: ${formatDate(item.startAt)} - ${formatDate(item.endAt)}`}
                </p>
              </div>
              <button className="btn-secondary" type="button" onClick={() => returnAssignment(item._id)}>İade Al</button>
            </div>
          ))}
        </div>
      </section>

      {assetModalOpen ? (
        <FormModal title={selected ? 'Demirbaşı Düzenle' : 'Demirbaş Ekle'} onClose={() => setAssetModalOpen(false)}>
          <form className="space-y-3" onSubmit={saveAsset}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input className="input" placeholder="Ad" value={assetForm.name} onChange={(event) => setAssetForm({ ...assetForm, name: event.target.value })} required />
              <input className="input" placeholder="Kategori" value={assetForm.category} onChange={(event) => setAssetForm({ ...assetForm, category: event.target.value })} required />
              <input className="input" placeholder="Marka" value={assetForm.brand} onChange={(event) => setAssetForm({ ...assetForm, brand: event.target.value })} />
              <input className="input" placeholder="Model" value={assetForm.model} onChange={(event) => setAssetForm({ ...assetForm, model: event.target.value })} />
              <input className="input" placeholder="Seri No" value={assetForm.serialNumber} onChange={(event) => setAssetForm({ ...assetForm, serialNumber: event.target.value })} />
              <input className="input" placeholder="Demirbaş Kodu" value={assetForm.inventoryCode} onChange={(event) => setAssetForm({ ...assetForm, inventoryCode: event.target.value })} />
              <select className="input" value={assetForm.department} onChange={(event) => setAssetForm({ ...assetForm, department: event.target.value })} disabled={user?.role !== 'ADMIN'}>
                <option value="">Genel</option>
                {departments.map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
              <select className="input" value={assetForm.status} onChange={(event) => setAssetForm({ ...assetForm, status: event.target.value as Asset['status'] })}>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Pasif</option>
              </select>
              <textarea className="input md:col-span-2" placeholder="Not" value={assetForm.notes} onChange={(event) => setAssetForm({ ...assetForm, notes: event.target.value })} />
            </div>
            <button className="btn-primary" type="submit">{selected ? 'Güncelle' : 'Oluştur'}</button>
          </form>
        </FormModal>
      ) : null}

      {assignmentModalOpen ? (
        <FormModal title="Demirbaş Ata" onClose={() => setAssignmentModalOpen(false)}>
          <form className="space-y-3" onSubmit={saveAssignment}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select className="input" value={assignmentForm.assetId} onChange={(event) => setAssignmentForm({ ...assignmentForm, assetId: event.target.value })} required>
                <option value="">Demirbaş seçin</option>
                {items.filter((item) => item.status === 'ACTIVE').map((asset) => <option key={asset._id} value={asset._id}>{asset.name} - {asset.category}</option>)}
              </select>
              <select className="input" value={assignmentForm.assignedUserId} onChange={(event) => setAssignmentForm({ ...assignmentForm, assignedUserId: event.target.value })} required>
                <option value="">Personel seçin</option>
                {employeeOptions.map((employee) => <option key={employee._id} value={employee._id}>{employee.firstName} {employee.lastName}</option>)}
              </select>
              <select className="input" value={assignmentForm.type} onChange={(event) => setAssignmentForm({ ...assignmentForm, type: event.target.value as AssetAssignmentType })}>
                <option value="PERMANENT">Kalıcı</option>
                <option value="TEMPORARY">Geçici</option>
              </select>
              <input className="input" type="datetime-local" value={assignmentForm.startAt} onChange={(event) => setAssignmentForm({ ...assignmentForm, startAt: event.target.value })} />
              {assignmentForm.type === 'TEMPORARY' ? (
                <input className="input" type="datetime-local" value={assignmentForm.endAt} onChange={(event) => setAssignmentForm({ ...assignmentForm, endAt: event.target.value })} required />
              ) : null}
              <textarea className="input md:col-span-2" placeholder="Not" value={assignmentForm.notes} onChange={(event) => setAssignmentForm({ ...assignmentForm, notes: event.target.value })} />
            </div>
            <button className="btn-primary" type="submit">Ata</button>
          </form>
        </FormModal>
      ) : null}
    </div>
  );
}

function FormModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <ModalPortal>
      <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <button className="btn-secondary" type="button" onClick={onClose}>Kapat</button>
        </div>
        {children}
      </div>
    </ModalPortal>
  );
}

function formatUser(user?: AssetAssignment['assignedUserId']) {
  if (!user) return '-';
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.workEmail || '-';
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR');
}
