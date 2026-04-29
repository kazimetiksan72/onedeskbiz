import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { createFeedPost, deleteFeedPost, getAdminFeedPosts } from '../api/feed.api';
import type { FeedPost } from '../types/feed.types';

export function AdminFeedPage() {
  const [items, setItems] = useState<FeedPost[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setItems(await getAdminFeedPosts());
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!image) return;
    setSaving(true);
    setError('');
    try {
      await createFeedPost({ title, content, image, status });
      setTitle('');
      setContent('');
      setStatus('PUBLISHED');
      setImage(null);
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Feed içeriği oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Bu feed içeriğini silmek istediğinize emin misiniz?')) return;
    await deleteFeedPost(id);
    await load();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Feed Yönetimi" subtitle="Mobil ve web ana sayfalarında gösterilecek içerikleri yönetin" />
      {error ? <div className="page-card text-sm text-red-600">{error}</div> : null}

      <form className="page-card space-y-3" onSubmit={submit}>
        <h2 className="text-base font-semibold text-slate-950">Yeni Feed İçeriği</h2>
        <input className="input" placeholder="Başlık" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} />
        <textarea className="input min-h-32" placeholder="İçerik metni" value={content} onChange={(event) => setContent(event.target.value)} required maxLength={4000} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
          <input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] || null)} required />
          <select className="input" value={status} onChange={(event) => setStatus(event.target.value as 'PUBLISHED' | 'DRAFT')}>
            <option value="PUBLISHED">Yayında</option>
            <option value="DRAFT">Taslak</option>
          </select>
        </div>
        <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-70" disabled={saving || !title.trim() || !content.trim() || !image}>
          {saving ? 'Oluşturuluyor...' : 'Oluştur'}
        </button>
      </form>

      <div className="page-card">
        {items.length === 0 ? <EmptyState message="Feed içeriği yok." /> : null}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <article key={item._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img src={item.image.webUrl} alt={item.title} className="h-48 w-full object-cover" />
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-950">{item.title}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{item.status === 'PUBLISHED' ? 'Yayında' : 'Taslak'}</span>
                </div>
                <p className="line-clamp-3 text-sm text-slate-600">{item.content}</p>
                <button className="btn-danger" type="button" onClick={() => remove(item._id)}>Sil</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
