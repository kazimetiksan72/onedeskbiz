import { useEffect, useState, type FormEvent } from 'react';
import { createVehicle, deleteVehicle, getVehicles, updateVehicle } from '../api/vehicles.api';
import type { Vehicle } from '../types/vehicle.types';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { useAuthStore } from '../../auth/auth.store';

interface VehicleForm {
  plate: string;
  brand: string;
  model: string;
  modelYear: string;
  kilometer: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const initialForm: VehicleForm = {
  plate: '',
  brand: '',
  model: '',
  modelYear: '',
  kilometer: '',
  status: 'ACTIVE'
};

export function VehiclesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [items, setItems] = useState<Vehicle[]>([]);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleForm>(initialForm);
  const [search, setSearch] = useState('');

  const load = async () => {
    const vehicles = await getVehicles(search);
    setItems(vehicles);
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const payload = {
      plate: form.plate,
      brand: form.brand,
      model: form.model,
      modelYear: Number(form.modelYear),
      kilometer: Number(form.kilometer),
      status: form.status
    };

    if (selected) {
      await updateVehicle(selected._id, payload);
    } else {
      await createVehicle(payload);
    }

    setSelected(null);
    setForm(initialForm);
    await load();
  };

  const fillForm = (item: Vehicle) => {
    setSelected(item);
    setForm({
      plate: item.plate,
      brand: item.brand,
      model: item.model,
      modelYear: String(item.modelYear),
      kilometer: String(item.kilometer),
      status: item.status
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Araçlarım" subtitle="Şirkete kayıtlı araçları yönetin" />

      <div className="page-card">
        <div className="mb-3 flex gap-2">
          <input
            className="input"
            placeholder="Araç ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-secondary" onClick={load}>
            Ara
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyState message="Araç bulunamadı." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Plaka</th>
                  <th className="pb-2">Marka</th>
                  <th className="pb-2">Model</th>
                  <th className="pb-2">Model Yılı</th>
                  <th className="pb-2">Kilometre</th>
                  <th className="pb-2">Durum</th>
                  {isAdmin ? <th className="pb-2 text-right">İşlemler</th> : null}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="py-2 font-medium text-slate-900">{item.plate}</td>
                    <td className="py-2">{item.brand}</td>
                    <td className="py-2">{item.model}</td>
                    <td className="py-2">{item.modelYear}</td>
                    <td className="py-2">{item.kilometer.toLocaleString('tr-TR')} km</td>
                    <td className="py-2">{item.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}</td>
                    {isAdmin ? (
                      <td className="py-2">
                        <div className="flex justify-end gap-2">
                          <button className="btn-secondary" onClick={() => fillForm(item)}>
                            Düzenle
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={async () => {
                              await deleteVehicle(item._id);
                              await load();
                            }}
                          >
                            Sil
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
          <h2 className="text-base font-semibold">{selected ? 'Aracı Güncelle' : 'Araç Ekle'}</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className="input"
              placeholder="Plaka"
              value={form.plate}
              onChange={(e) => setForm({ ...form, plate: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Marka"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Model"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Model yılı"
              type="number"
              min="1900"
              max="2100"
              value={form.modelYear}
              onChange={(e) => setForm({ ...form, modelYear: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Kilometre"
              type="number"
              min="0"
              value={form.kilometer}
              onChange={(e) => setForm({ ...form, kilometer: e.target.value })}
              required
            />
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as VehicleForm['status'] })}
            >
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Pasif</option>
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
                onClick={() => {
                  setSelected(null);
                  setForm(initialForm);
                }}
              >
                Vazgeç
              </button>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
