import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardSummary } from '../api/dashboard.api';
import type { DashboardSummary } from '../types/dashboard.types';
import { PageHeader } from '../../../components/PageHeader';
import { Loading } from '../../../components/Loading';

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
    to: '/admin/quotes',
    title: 'Teklifler',
    description: 'Müşteri tekliflerini oluşturun ve PDF olarak indirin.',
    icon: 'document'
  },
  {
    to: '/admin/feed',
    title: 'Feed Yönetimi',
    description: 'Web ve mobil duyuru/feed içeriklerini yönetin.',
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
    description: 'Şirket bilgileri, logo, referanslar ve şablonları yönetin.',
    icon: 'settings'
  }
] as const;

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Panel" subtitle="İşletmenin güncel özeti ve son hareketler" />

      {loading ? <Loading /> : null}

      {!loading && data ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="Aktif Personel" value={data.metrics.employeeCount} />
            <MetricCard label="Aktif Müşteri" value={data.metrics.activeCustomerCount} />
            <MetricCard label="Bekleyen İzin Talebi" value={data.metrics.pendingLeaveCount} />
          </div>

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

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="page-card">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-brand-700">{value}</p>
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

  if (name === 'document') {
    return (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8M8 17h5" />
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
