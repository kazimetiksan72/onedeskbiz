import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { getMyEmployeeDocuments, uploadMyEmployeeDocument } from '../api/employeeDocuments.api';
import type { EmployeeDocument, EmployeeDocumentType } from '../types/employeeDocument.types';

const documentTypes: Array<{ type: EmployeeDocumentType; title: string; description: string; accept: string }> = [
  {
    type: 'POPULATION_REGISTRY',
    title: 'Nüfus Kayıt Örneği',
    description: 'PDF belge yükleyin.',
    accept: 'application/pdf'
  },
  {
    type: 'RESIDENCE_CERTIFICATE',
    title: 'İkametgah Belgesi',
    description: 'PDF belge yükleyin.',
    accept: 'application/pdf'
  },
  {
    type: 'ID_CARD_FRONT',
    title: 'TC Kimlik Kartı Ön Yüz',
    description: 'JPG veya PNG görsel yükleyin.',
    accept: 'image/jpeg,image/png'
  },
  {
    type: 'ID_CARD_BACK',
    title: 'TC Kimlik Kartı Arka Yüz',
    description: 'JPG veya PNG görsel yükleyin.',
    accept: 'image/jpeg,image/png'
  }
];

export function EmployeeDocumentsPage() {
  const [items, setItems] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<EmployeeDocumentType | ''>('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const latestByType = useMemo(() => {
    return items.reduce<Record<string, EmployeeDocument>>((acc, item) => {
      if (!acc[item.type]) acc[item.type] = item;
      return acc;
    }, {});
  }, [items]);

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      setItems(await getMyEmployeeDocuments());
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Özlük belgeleri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onUpload = async (type: EmployeeDocumentType, file?: File) => {
    if (!file) return;
    setMessage('');
    setError('');
    setSavingType(type);
    try {
      await uploadMyEmployeeDocument(type, file);
      setMessage('Belge yüklendi.');
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Belge yüklenemedi.');
    } finally {
      setSavingType('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Özlük Belgeleri" subtitle="Nüfus, ikametgah ve kimlik belgelerinizi yükleyin" />

      {error ? <div className="page-card text-sm text-red-600">{error}</div> : null}
      {message ? <div className="page-card text-sm text-emerald-700">{message}</div> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {documentTypes.map((item) => {
          const latest = latestByType[item.type];
          return (
            <div key={item.type} className="page-card space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-950">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
              </div>

              {latest ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="font-medium text-slate-800">Son yüklenen belge</p>
                  <p className="mt-1 text-slate-500">{latest.originalName || latest.fileName || '-'}</p>
                  <p className="text-slate-500">{new Date(latest.createdAt).toLocaleString('tr-TR')}</p>
                  <a className="mt-2 inline-block font-semibold text-brand-700" href={latest.url} target="_blank" rel="noreferrer">
                    Belgeyi Aç
                  </a>
                </div>
              ) : (
                <EmptyState message="Henüz belge yüklenmedi." />
              )}

              <label className="btn-secondary inline-flex w-fit cursor-pointer">
                {savingType === item.type ? 'Yükleniyor...' : 'Belge Yükle'}
                <input
                  className="hidden"
                  type="file"
                  accept={item.accept}
                  disabled={savingType === item.type}
                  onChange={(event) => onUpload(item.type, event.target.files?.[0])}
                />
              </label>
            </div>
          );
        })}
      </div>

      {loading ? <div className="page-card text-sm text-slate-500">Yükleniyor...</div> : null}
    </div>
  );
}
