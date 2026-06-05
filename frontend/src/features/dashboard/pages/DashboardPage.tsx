import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardSummary } from '../api/dashboard.api';
import type { DashboardSummary } from '../types/dashboard.types';
import { PageHeader } from '../../../components/PageHeader';
import { Loading } from '../../../components/Loading';
import type { RequestStatus } from '../../requests/types/request.types';
import type { TaskStatus } from '../../tasks/types/task.types';
import type { Vehicle } from '../../vehicles/types/vehicle.types';

type VehicleStatus = Vehicle['status'];

const moduleCards = [
  {
    to: '/admin/employees',
    title: 'Personeller',
    description: 'Personel kayıtlarını, öz bilgileri ve detayları yönetin.',
    icon: 'users'
  },
  {
    to: '/admin/customers',
    title: 'Müşteriler',
    description: 'Firma müşterilerini ve kurumsal bilgileri görüntüleyin.',
    icon: 'building'
  },
  {
    to: '/admin/contacts',
    title: 'Kişiler',
    description: 'Müşteri firmalardaki kişi kayıtlarını yönetin.',
    icon: 'contact'
  },
  {
    to: '/admin/contact-actions',
    title: 'Kişi Aksiyonları',
    description: 'Arama, WhatsApp ve e-posta aksiyon kayıtlarını izleyin.',
    icon: 'activity'
  },
  {
    to: '/admin/requests',
    title: 'Talepler',
    description: 'Araç, izin, malzeme ve masraf taleplerini onaylayın.',
    icon: 'inbox'
  },
  {
    to: '/admin/tasks',
    title: 'Görevler',
    description: 'Görev atamalarını ve personel görev durumlarını takip edin.',
    icon: 'check'
  },
  {
    to: '/admin/vehicles',
    title: 'Araçlarım',
    description: 'Şirkete kayıtlı araçları ve detaylarını yönetin.',
    icon: 'car'
  },
  {
    to: '/admin/assets',
    title: 'Demirbaşlarım',
    description: 'Cihazları, zimmetleri ve geçici atamaları yönetin.',
    icon: 'inbox'
  },
  {
    to: '/admin/announcements',
    title: 'Duyuru Yönetimi',
    description: 'Personel ekranında gösterilecek duyuruları yönetin.',
    icon: 'feed'
  },
  {
    to: '/admin/department-roles',
    title: 'Roller ve Yetkiler',
    description: 'Departman rolleri, yetkiler ve rol atamalarını yapılandırın.',
    icon: 'shield'
  },
  {
    to: '/admin/company-settings',
    title: 'Şirket Ayarları',
    description: 'Şirket bilgileri, logo, referanslar ve departmanları yönetin.',
    icon: 'settings'
  }
] as const;

const taskStatusMeta: Record<TaskStatus, { label: string; color: string }> = {
  TODO: { label: 'Bekliyor', color: '#f59e0b' },
  IN_PROGRESS: { label: 'Devam ediyor', color: '#2563eb' },
  DONE: { label: 'Tamamlandı', color: '#16a34a' },
  CANCELLED: { label: 'İptal', color: '#ef4444' }
};

const requestStatusMeta: Record<RequestStatus, { label: string; color: string }> = {
  PENDING: { label: 'Bekliyor', color: '#f59e0b' },
  APPROVED: { label: 'Onaylandı', color: '#16a34a' },
  REJECTED: { label: 'Reddedildi', color: '#ef4444' }
};

const vehicleStatusMeta: Record<VehicleStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Kullanımda', color: '#16a34a' },
  INACTIVE: { label: 'Pasif', color: '#64748b' }
};

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDashboardSummary({ department: department || undefined })
      .then(setData)
      .finally(() => setLoading(false));
  }, [department]);

  return (
    <div>
      <PageHeader title="Panel" subtitle="İşletmenin güncel özeti ve son hareketler" />

      {loading ? <Loading /> : null}

      {!loading && data ? (
        <>
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">Dashboard filtresi</h2>
              <p className="mt-1 text-sm text-slate-500">Görev ve talep metriklerini departmana göre inceleyin.</p>
            </div>
            <select
              className="input sm:max-w-xs"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            >
              <option value="">Tüm departmanlar</option>
              {data.filters.departments.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="Aktif Personel" value={data.metrics.employeeCount} />
            <MetricCard label="Aktif Müşteri" value={data.metrics.activeCustomerCount} />
            <MetricCard label="Bekleyen İzin Talebi" value={data.metrics.pendingLeaveCount} />
            <MetricCard label="Geciken Görev" value={data.metrics.overdueTaskCount} tone="danger" />
            <MetricCard label="Bekleyen Talep" value={data.metrics.pendingRequestCount} tone="warning" />
            <MetricCard label="Bu Ay Açılan / Kapanan" value={`${data.metrics.openedThisMonthCount} / ${data.metrics.closedThisMonthCount}`} />
          </div>

          <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <BarListCard
              title="Departmana Göre Görevler"
              subtitle="Tüm görevlerin departman kırılımı"
              items={data.charts.tasksByDepartment.map((item) => ({ label: item.department, value: item.count }))}
            />
            <BarListCard
              title="Bekleyen Talepler"
              subtitle="Departman bazlı açık talep yoğunluğu"
              items={data.charts.pendingRequestsByDepartment.map((item) => ({ label: item.department, value: item.count }))}
            />
          </section>

          <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <StatusPieCard
              title="Görev Durumu"
              subtitle="Tüm görevlerin güncel dağılımı"
              totalLabel="Görev"
              items={data.charts.tasksByStatus.map((item) => ({
                key: item.status,
                label: taskStatusMeta[item.status].label,
                value: item.count,
                color: taskStatusMeta[item.status].color
              }))}
            />
            <StatusPieCard
              title="Talep Durumu"
              subtitle="İzin, masraf, araç ve malzeme talepleri"
              totalLabel="Talep"
              items={data.charts.requestsByStatus.map((item) => ({
                key: item.status,
                label: requestStatusMeta[item.status].label,
                value: item.count,
                color: requestStatusMeta[item.status].color
              }))}
            />
            <StatusPieCard
              title="Araç Kullanım Durumu"
              subtitle="Aktif ve pasif araç dağılımı"
              totalLabel="Araç"
              items={data.charts.vehiclesByStatus.map((item) => ({
                key: item.status,
                label: vehicleStatusMeta[item.status].label,
                value: item.count,
                color: vehicleStatusMeta[item.status].color
              }))}
            />
            <StatusPieCard
              title="Araç Talep Yoğunluğu"
              subtitle={department ? `${department} departmanı araç talepleri` : 'Tüm araç taleplerinin sonucu'}
              totalLabel="Talep"
              items={data.charts.vehicleRequestDensity.map((item) => ({
                key: item.status,
                label: requestStatusMeta[item.status].label,
                value: item.count,
                color: requestStatusMeta[item.status].color
              }))}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {moduleCards.map((card) => (
              <ModuleCard key={card.to} {...card} />
            ))}
          </section>
        </>
      ) : null}
    </div>
  );
}

function StatusPieCard({
  title,
  subtitle,
  totalLabel,
  items
}: {
  title: string;
  subtitle: string;
  totalLabel: string;
  items: Array<{ key: string; label: string; value: number; color: string }>;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="page-card">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          {total} {totalLabel}
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-[180px_1fr] sm:items-center">
        <DonutChart items={items} total={total} />
        <div className="space-y-3">
          {items.map((item) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;

            return (
              <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-sm font-medium text-slate-700">{item.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-slate-950">{item.value}</span>
                  <span className="ml-2 text-xs text-slate-500">%{percentage}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DonutChart({
  items,
  total
}: {
  items: Array<{ key: string; label: string; value: number; color: string }>;
  total: number;
}) {
  const radius = 58;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (total === 0) {
    return (
      <div className="relative mx-auto h-44 w-44">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160" role="img" aria-label="Veri bulunmuyor">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-slate-950">0</span>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Kayıt</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-44 w-44">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160" role="img" aria-label="Durum dağılım grafiği">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        {items.map((item) => {
          const dash = (item.value / total) * circumference;
          const circle = (
            <circle
              key={item.key}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-slate-950">{total}</span>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Toplam</span>
      </div>
    </div>
  );
}

function BarListCard({
  title,
  subtitle,
  items
}: {
  title: string;
  subtitle: string;
  items: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="page-card">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-5 space-y-4">
        {items.length === 0 ? <p className="text-sm text-slate-500">Veri bulunmuyor.</p> : null}
        {items.slice(0, 8).map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-slate-700">{item.label}</span>
              <span className="font-semibold text-slate-950">{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-600"
                style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone = 'brand' }: { label: string; value: number | string; tone?: 'brand' | 'danger' | 'warning' }) {
  const colorClass = tone === 'danger'
    ? 'text-red-600'
    : tone === 'warning'
      ? 'text-amber-600'
      : 'text-brand-700';

  return (
    <div className="page-card">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${colorClass}`}>{value}</p>
    </div>
  );
}

function ModuleCard({ to, title, description, icon }: (typeof moduleCards)[number]) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
        <DashboardIcon name={icon} />
      </div>
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </Link>
  );
}

function DashboardIcon({ name }: { name: (typeof moduleCards)[number]['icon'] }) {
  const common = {
    className: 'h-6 w-6',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  };

  if (name === 'users') {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (name === 'building') {
    return (
      <svg {...common}>
        <path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16" />
        <path d="M9 21v-5h3v5" />
        <path d="M8 7h1M12 7h1M8 11h1M12 11h1M17 9h1.5A1.5 1.5 0 0 1 20 10.5V21" />
      </svg>
    );
  }

  if (name === 'contact') {
    return (
      <svg {...common}>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2Z" />
        <path d="M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
        <path d="M4 18a5 5 0 0 1 10 0" />
        <path d="M16 8h2M16 12h2M16 16h2" />
      </svg>
    );
  }

  if (name === 'activity') {
    return (
      <svg {...common}>
        <path d="M22 12h-4l-3 8-6-16-3 8H2" />
      </svg>
    );
  }

  if (name === 'inbox') {
    return (
      <svg {...common}>
        <path d="M4 4h16l2 9v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5l2-9Z" />
        <path d="M2 13h6l2 3h4l2-3h6" />
      </svg>
    );
  }

  if (name === 'check') {
    return (
      <svg {...common}>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    );
  }

  if (name === 'car') {
    return (
      <svg {...common}>
        <path d="M5 17h14l-1.4-6.3A3 3 0 0 0 14.7 8H9.3a3 3 0 0 0-2.9 2.7L5 17Z" />
        <path d="M7 17v2M17 17v2M6.5 13h1M16.5 13h1" />
      </svg>
    );
  }

  if (name === 'feed') {
    return (
      <svg {...common}>
        <path d="M4 5h16M4 12h10M4 19h16" />
        <path d="M18 10l3 2-3 2" />
      </svg>
    );
  }

  if (name === 'shield') {
    return (
      <svg {...common}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="M9 12l2 2 4-5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 3.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 3.6 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8 3.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 3.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 8c.4.3.7.6 1 .6h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1 .4Z" />
    </svg>
  );
}
