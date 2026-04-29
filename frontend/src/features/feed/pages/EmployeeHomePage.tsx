import { useEffect, useState } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { getFeedPosts } from '../api/feed.api';
import type { FeedPost } from '../types/feed.types';

export function EmployeeHomePage() {
  const [items, setItems] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeedPosts().then(setItems).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Ana Sayfa" subtitle="Şirket duyuruları ve güncel içerikler" />
      {loading ? <div className="page-card text-sm text-slate-500">Yükleniyor...</div> : null}
      {!loading && items.length === 0 ? <div className="page-card"><EmptyState message="Henüz feed içeriği yok." /></div> : null}
      <div className="grid grid-cols-1 gap-5">
        {items.map((item) => (
          <article key={item._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <img src={item.image.webUrl} alt={item.title} className="h-64 w-full object-cover" />
            <div className="p-5">
              <h2 className="text-xl font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{item.content}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
