import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { getFeedPosts } from '../api/feed.api';
import type { FeedPost } from '../types/feed.types';

const homeCards = [
  {
    to: '/employee-documents',
    title: 'Özlük Belgelerim',
    description: 'Personel belgelerinizi yükleyin ve takip edin.',
    icon: DocumentIcon,
    accent: 'from-sky-500 to-blue-700'
  },
  {
    to: '/leave-requests',
    title: 'İzin Talepleri',
    description: 'İzin talebi oluşturun ve durumunu görün.',
    icon: CalendarIcon,
    accent: 'from-emerald-500 to-teal-700'
  },
  {
    to: '/vehicle-requests',
    title: 'Araç Talepleri',
    description: 'Şirket araçları için talep gönderin.',
    icon: VehicleIcon,
    accent: 'from-orange-500 to-red-600'
  },
  {
    to: '/material-requests',
    title: 'Malzeme Talepleri',
    description: 'İhtiyaç duyduğunuz malzemeleri bildirin.',
    icon: BoxIcon,
    accent: 'from-amber-500 to-yellow-700'
  },
  {
    to: '/expense-requests',
    title: 'Masraf Talepleri',
    description: 'Masraf fişlerinizi ve taleplerinizi iletin.',
    icon: ReceiptIcon,
    accent: 'from-fuchsia-500 to-rose-700'
  },
  {
    to: '/tasks',
    title: 'Görevlerim',
    description: 'Size atanan görevleri ve son tarihleri takip edin.',
    icon: TaskIcon,
    accent: 'from-indigo-500 to-slate-800'
  },
  {
    to: '/contact-actions',
    title: 'Kişi Aksiyonları',
    description: 'Müşteri kişi aksiyonlarınızı ve notlarınızı görün.',
    icon: ActionIcon,
    accent: 'from-cyan-500 to-slate-700'
  }
];

export function EmployeeHomePage() {
  const [items, setItems] = useState<FeedPost[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeedPosts().then(setItems).finally(() => setLoading(false));
  }, []);

  const activeFeed = items[activeIndex] || null;

  const goPrevious = () => {
    setActiveIndex((current) => (current === 0 ? items.length - 1 : current - 1));
  };

  const goNext = () => {
    setActiveIndex((current) => (current + 1 >= items.length ? 0 : current + 1));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Ana Sayfa" subtitle="Şirket duyuruları ve güncel içerikler" />

      {loading ? <div className="page-card text-sm text-slate-500">Yükleniyor...</div> : null}
      {!loading && items.length === 0 ? <div className="page-card"><EmptyState message="Henüz feed içeriği yok." /></div> : null}
      {activeFeed ? (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <Link to={`/feed/${activeFeed._id}`} className="grid min-h-[224px] grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative h-52 overflow-hidden lg:h-auto">
              <img src={activeFeed.image.webUrl} alt={activeFeed.title} className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/10 to-transparent" />
            </div>
            <div className="flex flex-col justify-center p-5 md:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                Duyuru
              </p>
              <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
                {activeFeed.title}
              </h2>
              <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                {activeFeed.content}
              </p>
              <span className="mt-4 text-sm font-semibold text-brand-700">
                Detayı görüntüle
              </span>
            </div>
          </Link>

          {items.length > 1 ? (
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
              <div className="flex gap-2">
                {items.map((item, index) => (
                  <button
                    key={item._id}
                    type="button"
                    aria-label={`${index + 1}. feed içeriğini göster`}
                    onClick={() => setActiveIndex(index)}
                    className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-brand-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary btn-sm" type="button" onClick={goPrevious}>
                  Önceki
                </button>
                <button className="btn-secondary btn-sm" type="button" onClick={goNext}>
                  Sonraki
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {homeCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.to}
              to={card.to}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-white shadow-sm`}>
                  <Icon />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-950 transition group-hover:text-brand-700">
                    {card.title}
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-slate-500">{card.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function DocumentIcon() {
  return <IconBase><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6" /><path d="M9 17h4" /></IconBase>;
}

function CalendarIcon() {
  return <IconBase><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /></IconBase>;
}

function VehicleIcon() {
  return <IconBase><path d="M5 17h14" /><path d="M7 17v2" /><path d="M17 17v2" /><path d="M5 17l1.5-6h11L19 17" /><path d="M8 11l1.5-4h5L16 11" /></IconBase>;
}

function BoxIcon() {
  return <IconBase><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></IconBase>;
}

function ReceiptIcon() {
  return <IconBase><path d="M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1z" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h4" /></IconBase>;
}

function TaskIcon() {
  return <IconBase><path d="m9 11 2 2 4-5" /><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" /></IconBase>;
}


function ActionIcon() {
  return <IconBase><path d="M7 7h10v10" /><path d="M7 17 17 7" /><path d="M5 5h.01" /><path d="M19 19h.01" /></IconBase>;
}
