import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { createAdvanceRequest, getMyRequests } from '../api/requests.api';
import type { RequestItem } from '../types/request.types';

const currencies = ['TRY', 'USD', 'EUR'];

export function AdvanceRequestsPage() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceCurrency, setAdvanceCurrency] = useState('TRY');
  const [advanceDescription, setAdvanceDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const advanceRequests = useMemo(() => items.filter((item) => item.type === 'ADVANCE'), [items]);

  const load = async () => {
    setError('');
    setLoading(true);

    try {
      setItems(await getMyRequests());
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Avans talepleri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      await createAdvanceRequest({
        advanceAmount: Number(advanceAmount),
        advanceCurrency,
        advanceDescription
      });
      setAdvanceAmount('');
      setAdvanceDescription('');
      setMessage('Avans talebi onaya gönderildi.');
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Avans talebi oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Avans Talepleri" subtitle="Avans taleplerinizi oluşturun ve takip edin" />

      {error ? <div className="page-card text-sm text-red-600">{error}</div> : null}
      {message ? <div className="page-card text-sm text-emerald-700">{message}</div> : null}

      <form className="page-card space-y-3" onSubmit={submit}>
        <h2 className="text-base font-semibold text-slate-950">Avans Talebi Oluştur</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_140px]">
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            placeholder="Tutar"
            value={advanceAmount}
            onChange={(event) => setAdvanceAmount(event.target.value)}
            required
          />
          <select className="input" value={advanceCurrency} onChange={(event) => setAdvanceCurrency(event.target.value)}>
            {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
          </select>
        </div>
        <textarea
          className="input min-h-32"
          placeholder="Avans talep nedeninizi yazın"
          value={advanceDescription}
          onChange={(event) => setAdvanceDescription(event.target.value)}
          required
          maxLength={2000}
        />
        <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={saving || !advanceAmount || !advanceDescription.trim()}>
          {saving ? 'Gönderiliyor...' : 'Onaya Gönder'}
        </button>
      </form>

      <div className="page-card">
        {loading ? <p className="text-sm text-slate-500">Yükleniyor...</p> : null}
        {!loading && advanceRequests.length === 0 ? <EmptyState message="Henüz avans talebi yok." /> : null}
        {!loading && advanceRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Tutar</th>
                  <th className="pb-2">Açıklama</th>
                  <th className="pb-2">Durum</th>
                  <th className="pb-2">Oluşturma</th>
                </tr>
              </thead>
              <tbody>
                {advanceRequests.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100 align-top">
                    <td className="py-2">{formatMoney(item.advanceAmount, item.advanceCurrency)}</td>
                    <td className="max-w-xl py-2">{item.advanceDescription || '-'}</td>
                    <td className="py-2">{translateStatus(item.status)}</td>
                    <td className="py-2">{formatDateTime(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function translateStatus(value: RequestItem['status']) {
  if (value === 'APPROVED') return 'Onaylandı';
  if (value === 'REJECTED') return 'Reddedildi';
  return 'Bekliyor';
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR');
}

function formatMoney(amount?: number, currency = 'TRY') {
  if (!amount) return '-';
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
}
