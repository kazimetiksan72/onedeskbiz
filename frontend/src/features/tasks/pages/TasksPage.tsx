import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { ModalPortal } from '../../../components/ModalPortal';
import { useAuthStore } from '../../auth/auth.store';
import { getEmployees } from '../../employees/api/employees.api';
import type { Employee } from '../../employees/types/employee.types';
import { createTask, deleteTask, getTasks, updateTask } from '../api/tasks.api';
import type { TaskItem, TaskStatus } from '../types/task.types';

interface TaskFormState {
  title: string;
  description: string;
  assignedUserId: string;
  dueDate: string;
  status: TaskStatus;
  notes: string;
}

const initialForm: TaskFormState = {
  title: '',
  description: '',
  assignedUserId: '',
  dueDate: '',
  status: 'TODO',
  notes: ''
};

const statusOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: 'TODO', label: 'Bekliyor' },
  { value: 'IN_PROGRESS', label: 'Devam Ediyor' },
  { value: 'DONE', label: 'Tamamlandı' },
  { value: 'CANCELLED', label: 'İptal' }
];

export function TasksPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const canAssignTasks = isAdmin || user?.departmentRoleId?.permissions?.includes('TASK_ASSIGNMENT');
  const [items, setItems] = useState<TaskItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<TaskItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskItem | null>(null);
  const [form, setForm] = useState<TaskFormState>(initialForm);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const [taskItems, employeeItems] = await Promise.all([
        getTasks(statusFilter ? { status: statusFilter } : {}),
        canAssignTasks ? getEmployees() : Promise.resolve([])
      ]);
      setItems(taskItems);
      setEmployees(isAdmin ? employeeItems : employeeItems.filter((employee) => !user?.department || employee.department === user.department));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Görevler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const openCreate = () => {
    setSelected(null);
    setForm({ ...initialForm, assignedUserId: employees[0]?._id || '' });
    setModalOpen(true);
  };

  const openEdit = (item: TaskItem) => {
    setSelected(item);
    setForm({
      title: item.title,
      description: item.description || '',
      assignedUserId: item.assignedUserId?._id || '',
      dueDate: item.dueDate ? item.dueDate.slice(0, 10) : '',
      status: item.status,
      notes: item.notes || ''
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelected(null);
    setForm(initialForm);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const dueDate = form.dueDate ? new Date(`${form.dueDate}T12:00:00`).toISOString() : null;
      const canManageSelectedTask = !selected || isAdmin || selected.createdByUserId?._id === user?._id;
      const payload = canAssignTasks && canManageSelectedTask
        ? {
            title: form.title,
            description: form.description,
            assignedUserId: form.assignedUserId,
            dueDate,
            status: form.status,
            notes: form.notes
          }
        : {
            status: form.status,
            notes: form.notes
          };

      if (selected) {
        await updateTask(selected._id, payload);
        setMessage('Görev güncellendi.');
      } else if (canAssignTasks) {
        await createTask(payload as any);
        setMessage('Görev oluşturuldu.');
      }

      closeModal();
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Görev kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError('');
    try {
      await deleteTask(deleteTarget._id);
      setDeleteTarget(null);
      setMessage('Görev silindi.');
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Görev silinemedi.');
    } finally {
      setSaving(false);
    }
  };

  const groupedCounts = useMemo(() => {
    return items.reduce<Record<TaskStatus, number>>(
      (acc, item) => {
        acc[item.status] += 1;
        return acc;
      },
      { TODO: 0, IN_PROGRESS: 0, DONE: 0, CANCELLED: 0 }
    );
  }, [items]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Görevler"
        subtitle={canAssignTasks ? 'Personellere görev atayın ve takip edin' : 'Size atanan görevleri takip edin'}
        action={
          canAssignTasks ? (
            <button className="btn-primary" type="button" onClick={openCreate}>
              Yeni Görev
            </button>
          ) : null
        }
      />

      {error ? <div className="page-card text-sm text-red-600">{error}</div> : null}
      {message ? <div className="page-card text-sm text-emerald-700">{message}</div> : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`page-card text-left transition ${statusFilter === option.value ? 'ring-2 ring-brand-500' : ''}`}
            onClick={() => setStatusFilter(statusFilter === option.value ? '' : option.value)}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{option.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{groupedCounts[option.value]}</p>
          </button>
        ))}
      </div>

      <div className="page-card">
        {loading ? <p className="text-sm text-slate-500">Yükleniyor...</p> : null}
        {!loading && items.length === 0 ? <EmptyState message="Görev bulunamadı." /> : null}
        {!loading && items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Görev</th>
                  {canAssignTasks ? <th className="pb-2">Personel</th> : null}
                  <th className="pb-2">Son Tarih</th>
                  <th className="pb-2">Durum</th>
                  <th className="pb-2 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100 align-top">
                    <td className="py-3">
                      <p className="font-semibold text-slate-950">{item.title}</p>
                      {item.description ? <p className="mt-1 max-w-xl text-slate-500">{item.description}</p> : null}
                      {item.notes ? <p className="mt-1 max-w-xl text-slate-600">Not: {item.notes}</p> : null}
                    </td>
                    {canAssignTasks ? (
                      <td className="py-3">
                        {item.assignedUserId?.firstName} {item.assignedUserId?.lastName}
                        <p className="text-xs text-slate-500">{item.assignedUserId?.department || '-'}</p>
                      </td>
                    ) : null}
                    <td className="py-3">{formatDate(item.dueDate)}</td>
                    <td className="py-3">{statusLabel(item.status)}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <button className="btn-primary" type="button" onClick={() => openEdit(item)}>
                          {canAssignTasks && item.createdByUserId?._id === user?._id ? 'Düzenle' : 'Güncelle'}
                        </button>
                        {(isAdmin || item.createdByUserId?._id === user?._id) && canAssignTasks ? (
                          <button className="btn-danger" type="button" onClick={() => setDeleteTarget(item)}>
                            Sil
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {modalOpen ? (
        <TaskModal title={selected ? 'Görevi Güncelle' : 'Yeni Görev'} onClose={closeModal}>
          <form className="space-y-3" onSubmit={submit}>
            {canAssignTasks && (!selected || isAdmin || selected.createdByUserId?._id === user?._id) ? (
              <>
                <input
                  className="input"
                  placeholder="Görev başlığı"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  required
                />
                <textarea
                  className="input min-h-28"
                  placeholder="Açıklama"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <select
                    className="input"
                    value={form.assignedUserId}
                    onChange={(event) => setForm({ ...form, assignedUserId: event.target.value })}
                    required
                  >
                    <option value="">Personel seçin</option>
                    {employees.map((employee) => (
                      <option key={employee._id} value={employee._id}>
                        {employee.firstName} {employee.lastName}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                  />
                </div>
              </>
            ) : null}
            <select
              className="input"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <textarea
              className="input min-h-28"
              placeholder="Notlar"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
            <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={saving || (canAssignTasks && (!selected || isAdmin || selected.createdByUserId?._id === user?._id) && (!form.title.trim() || !form.assignedUserId))}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </form>
        </TaskModal>
      ) : null}

      {deleteTarget ? (
        <TaskModal title="Görevi Sil" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-slate-600">Bu görevi silmek istediğinize emin misiniz?</p>
          <div className="mt-4 flex justify-end gap-2">
            <button className="btn-secondary" type="button" onClick={() => setDeleteTarget(null)}>
              Vazgeç
            </button>
            <button className="btn-danger disabled:opacity-70" type="button" onClick={confirmDelete} disabled={saving}>
              {saving ? 'Siliniyor...' : 'Sil'}
            </button>
          </div>
        </TaskModal>
      ) : null}
    </div>
  );
}

function TaskModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <button className="btn-secondary" type="button" onClick={onClose}>
              Kapat
            </button>
          </div>
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}

function statusLabel(value: TaskStatus) {
  return statusOptions.find((option) => option.value === value)?.label || value;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('tr-TR');
}
