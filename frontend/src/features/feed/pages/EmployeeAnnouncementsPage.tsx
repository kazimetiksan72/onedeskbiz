import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../../components/EmptyState';
import { Loading } from '../../../components/Loading';
import { PageHeader } from '../../../components/PageHeader';
import { getFeedPosts } from '../api/feed.api';
import type { FeedPost } from '../types/feed.types';

export function EmployeeAnnouncementsPage() {
  const [items, setItems] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeedPosts()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Duyurular" subtitle="Şirket duyurularını ve güncel bilgilendirmeleri görüntüleyin" />

      {loading ? <Loading /> : null}
      {!loading && items.length === 0 ? (
        <div className="page-card">
          <EmptyState message="Henüz duyuru yok." />
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item._id}
            to={`/announcements/${item._id}`}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
          >
            <img src={item.image.webUrl} alt={item.title} className="h-52 w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                {formatDate(item.publishedAt || item.createdAt)}
              </p>
              <h2 className="mt-2 text-lg font-bold text-slate-950">{item.title}</h2>
              <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-600">{item.content}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('tr-TR');
}
