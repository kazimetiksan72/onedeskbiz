import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { fetchMe } from '../../auth/api/auth.api';
import { useAuthStore } from '../../auth/auth.store';
import { uploadProfilePhoto } from '../api/profile.api';

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMe().then(setUser).catch(() => undefined);
  }, [setUser]);

  const displayName = useMemo(() => {
    const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    return fullName || user?.email || 'Kullanıcı';
  }, [user]);

  const initials = useMemo(() => {
    const value = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toLocaleUpperCase('tr-TR');
    return value || 'U';
  }, [user]);

  const avatarUrl = user?.businessCard?.avatarPublicUrl || user?.businessCard?.avatarUrl || '';

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('');
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const selectFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Lütfen JPG, PNG veya WEBP formatında bir görsel seçin.');
      return;
    }

    setError('');
    setSuccess('');
    setSelectedFile(file);
  };

  const onPhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    selectFile(file);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  const closeModal = () => {
    if (uploading) return;
    setModalOpen(false);
    setDragActive(false);
    setSelectedFile(null);
  };

  const submitPhoto = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const result = await uploadProfilePhoto(selectedFile);
      setUser(result.user);
      setSuccess('Profil fotoğrafınız güncellendi.');
      setModalOpen(false);
      setSelectedFile(null);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Fotoğraf yüklenemedi.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Profilim" subtitle="Profil bilgilerinizi görüntüleyin ve fotoğrafınızı güncelleyin" />

      {error ? <div className="page-card text-sm text-red-600">{error}</div> : null}
      {success ? <div className="page-card text-sm text-emerald-700">{success}</div> : null}

      <section className="page-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-28 w-28 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-brand-100 text-3xl font-semibold text-brand-700">
              {initials}
            </div>
          )}

          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-950">{displayName}</h2>
            <p className="mt-1 text-sm text-slate-500">{user?.title || user?.department || 'Personel'}</p>
            <button className="btn-secondary mt-4" type="button" onClick={() => setModalOpen(true)}>
              Fotoğraf Güncelle
            </button>
          </div>
        </div>
      </section>

      <section className="page-card">
        <h2 className="text-base font-semibold text-slate-950">Bilgilerim</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <DetailItem label="Ad Soyad" value={displayName} />
          <DetailItem label="E-posta" value={user?.workEmail || user?.email} />
          <DetailItem label="Telefon" value={user?.phone} />
          <DetailItem label="Departman" value={user?.department} />
          <DetailItem label="Unvan" value={user?.title} />
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Profil Fotoğrafı</h2>
                <p className="mt-1 text-sm text-slate-500">Fotoğrafı sürükleyip bırakın veya bilgisayarınızdan seçin.</p>
              </div>
              <button className="rounded-lg px-2 py-1 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700" type="button" onClick={closeModal}>
                ×
              </button>
            </div>

            <label
              className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                dragActive ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/50'
              }`}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragActive(false);
              }}
              onDrop={onDrop}
            >
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onPhotoChange}
                disabled={uploading}
              />
              {previewUrl ? (
                <img src={previewUrl} alt="Seçilen profil fotoğrafı" className="h-36 w-36 rounded-2xl object-cover shadow-sm" />
              ) : (
                <div className="flex h-36 w-36 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-500 shadow-sm">
                  Fotoğraf
                </div>
              )}
              <p className="mt-4 text-sm font-semibold text-slate-900">
                {selectedFile ? selectedFile.name : 'Dosyayı buraya bırakın'}
              </p>
              <p className="mt-1 text-xs text-slate-500">JPG, PNG veya WEBP</p>
            </label>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button className="btn-secondary" type="button" onClick={closeModal} disabled={uploading}>
                Vazgeç
              </button>
              <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-70" type="button" onClick={submitPhoto} disabled={!selectedFile || uploading}>
                {uploading ? 'Yükleniyor...' : 'Fotoğrafı Kaydet'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value || '-'}</p>
    </div>
  );
}
