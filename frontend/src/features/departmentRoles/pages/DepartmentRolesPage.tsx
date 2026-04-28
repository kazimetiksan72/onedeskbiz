import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { getEmployees } from '../../employees/api/employees.api';
import type { Employee } from '../../employees/types/employee.types';
import { getCompanySettings } from '../../companySettings/api/companySettings.api';
import {
  assignDepartmentRole,
  createDepartmentRole,
  deleteDepartmentRole,
  getDepartmentRoles,
  updateDepartmentRole
} from '../api/departmentRoles.api';
import type { DepartmentRole, RolePermission } from '../types/departmentRole.types';

const permissions: Array<{ value: RolePermission; label: string }> = [
  { value: 'VEHICLE_APPROVAL', label: 'Araç onay' },
  { value: 'LEAVE_APPROVAL', label: 'İzin onay' },
  { value: 'MATERIAL_APPROVAL', label: 'Malzeme onay' }
];

const initialForm = { department: '', name: '', permissions: [] as RolePermission[] };

export function DepartmentRolesPage() {
  const [roles, setRoles] = useState<DepartmentRole[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState<DepartmentRole | null>(null);
  const [roleAssignments, setRoleAssignments] = useState<Record<string, string>>({});
  const [roleToDelete, setRoleToDelete] = useState<DepartmentRole | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [roleItems, employeeItems, settings] = await Promise.all([
      getDepartmentRoles(),
      getEmployees(''),
      getCompanySettings()
    ]);
    setRoles(roleItems);
    setEmployees(employeeItems);
    setDepartments(settings?.departments || []);
    setRoleAssignments(Object.fromEntries(employeeItems.map((employee) => [employee._id, employee.departmentRoleId?._id || ''])));
  };

  useEffect(() => {
    load().catch(() => setError('Rol bilgileri yüklenemedi.'));
  }, []);

  const groupedRoles = useMemo(() => {
    return roles.reduce<Record<string, DepartmentRole[]>>((acc, role) => {
      acc[role.department] = acc[role.department] || [];
      acc[role.department].push(role);
      return acc;
    }, {});
  }, [roles]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (editing) {
      await updateDepartmentRole(editing._id, form);
    } else {
      await createDepartmentRole(form);
    }
    setForm(initialForm);
    setEditing(null);
    await load();
  };

  const startEdit = (role: DepartmentRole) => {
    setEditing(role);
    setForm({ department: role.department, name: role.name, permissions: role.permissions });
  };

  const togglePermission = (permission: RolePermission) => {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission]
    }));
  };

  const removeRole = async () => {
    if (!roleToDelete) return;

    setDeleteError('');

    try {
      await deleteDepartmentRole(roleToDelete._id);
      setRoleToDelete(null);
      await load();
    } catch (requestError: any) {
      setDeleteError(requestError?.response?.data?.message || 'Rol silinemedi.');
    }
  };

  const saveAssignments = async () => {
    await Promise.all(
      employees
        .filter((employee) => (employee.departmentRoleId?._id || '') !== (roleAssignments[employee._id] || ''))
        .map((employee) => assignDepartmentRole(employee._id, roleAssignments[employee._id] || null))
    );
    await load();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Roller ve Yetkiler" subtitle="Departman bazlı rol, yetki ve personel rol atamalarını yönetin" />
      {error ? <div className="page-card text-sm text-red-600">{error}</div> : null}

      <section className="page-card space-y-4">
        <h2 className="text-lg font-semibold text-slate-950">{editing ? 'Rolü Düzenle' : 'Yeni Rol'}</h2>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required>
              <option value="">Departman seçin</option>
              {departments.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
            <input className="input" placeholder="Rol adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <label key={permission.value} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <input type="checkbox" checked={form.permissions.includes(permission.value)} onChange={() => togglePermission(permission.value)} />
                {permission.label}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" type="submit">{editing ? 'Güncelle' : 'Oluştur'}</button>
            {editing ? <button className="btn-secondary" type="button" onClick={() => { setEditing(null); setForm(initialForm); }}>Vazgeç</button> : null}
          </div>
        </form>
      </section>

      <section className="page-card space-y-4">
        <h2 className="text-lg font-semibold text-slate-950">Tanımlı Roller</h2>
        {roles.length === 0 ? <EmptyState message="Rol bulunamadı." /> : Object.entries(groupedRoles).map(([department, items]) => (
          <div key={department} className="space-y-2">
            <h3 className="font-semibold text-slate-700">{department}</h3>
            {items.map((role) => (
              <div key={role._id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-950">{role.name}</p>
                  <p className="text-sm text-slate-500">{role.permissions.map((p) => permissions.find((item) => item.value === p)?.label || p).join(', ') || 'Yetki yok'}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" type="button" onClick={() => startEdit(role)}>Düzenle</button>
                  <button className="btn-danger" type="button" onClick={() => { setDeleteError(''); setRoleToDelete(role); }}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className="page-card space-y-4">
        <h2 className="text-lg font-semibold text-slate-950">Personele Rol Ata</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left text-slate-500"><th className="pb-2">Personel</th><th className="pb-2">Departman</th><th className="pb-2">Rol</th></tr></thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee._id} className="border-t border-slate-100">
                  <td className="py-2">{employee.firstName} {employee.lastName}</td>
                  <td className="py-2">{employee.department || '-'}</td>
                  <td className="py-2">
                    <select
                      className="input"
                      value={roleAssignments[employee._id] || ''}
                      onChange={(e) => setRoleAssignments((current) => ({ ...current, [employee._id]: e.target.value }))}
                    >
                      <option value="">Rol yok</option>
                      {roles.filter((role) => !employee.department || role.department === employee.department).map((role) => (
                        <option key={role._id} value={role._id}>{role.department} / {role.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-start">
          <button className="btn-primary" type="button" onClick={saveAssignments}>Kaydet</button>
        </div>
      </section>

      {roleToDelete ? (
        <ConfirmDialog
          title="Rolü Sil"
          message={`${roleToDelete.department} / ${roleToDelete.name} rolünü silmek istediğinize emin misiniz?`}
          onConfirm={removeRole}
          onCancel={() => { setDeleteError(''); setRoleToDelete(null); }}
        >
          {deleteError ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{deleteError}</p> : null}
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
