import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loading } from '../../../components/Loading';
import { getFeedPost } from '../api/feed.api';
import type { FeedPost } from '../types/feed.types';

export function EmployeeFeedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    getFeedPost(id)
      .then(setItem)
      .catch((requestError: any) => {
        setError(requestError?.response?.data?.message || 'Feed içeriği yüklenemedi.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;

  if (!item) {
    return (
      <div className="page-card space-y-4">
        <button className="btn-secondary" type="button" onClick={() => navigate('/home')}>
          Geri dön
        </button>
        <p className="text-sm text-red-600">{error || 'Feed içeriği bulunamadı.'}</p>
      </div>
    );
  }

  return (
    <article className="animate-slide-in-right space-y-5">
      <button className="btn-secondary" type="button" onClick={() => navigate('/home')}>
        Geri dön
      </button>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <img src={item.image.webUrl} alt={item.title} className="h-80 w-full object-cover" />
        <div className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            {formatDate(item.publishedAt || item.createdAt)}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{item.title}</h1>
          <p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-700">{item.content}</p>
        </div>
      </div>
    </article>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('tr-TR');
}
