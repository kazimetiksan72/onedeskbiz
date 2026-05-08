import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { Loading } from '../../../components/Loading';
import { ModalPortal } from '../../../components/ModalPortal';
import { getQuotes, createQuote } from '../api/quotes.api';
import { getCustomers } from '../../customers/api/customers.api';
import type { Quote, LineItemForm } from '../types/quote.types';
import type { Customer } from '../../customers/types/customer.types';

const VAT_RATES = [0, 8, 10, 18, 20];

const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  ACCEPTED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  EXPIRED: 'Süresi Doldu'
};

const QUOTE_STATUS_CLASSES: Record<string, string> = {
  DRAFT: 'status-badge status-pending',
  SENT: 'status-badge status-info',
  ACCEPTED: 'status-badge status-approved',
  REJECTED: 'status-badge status-rejected',
  EXPIRED: 'status-badge status-rejected'
};

const emptyItem = (): LineItemForm => ({ description: '', quantity: 1, unitPrice: 0, vatRate: 18 });

export function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItemForm[]>([emptyItem()]);

  const load = async () => {
    setLoading(true);
    try {
      const [q, c] = await Promise.all([getQuotes(), getCustomers()]);
      setQuotes(q.items);
      setCustomers(c);
    } catch {
      setError('Veriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setCustomerId('');
    setValidUntil('');
    setNotes('');
    setItems([emptyItem()]);
    setError('');
  };

  const openModal = () => { resetForm(); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);

  const calcTotals = () => {
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const vatTotal = items.reduce((s, i) => s + (i.quantity * i.unitPrice * (i.vatRate / 100)), 0);
    return { subtotal, vatTotal, grandTotal: subtotal + vatTotal };
  };

  const updateItem = (idx: number, field: keyof LineItemForm, value: string | number) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!customerId) { setError('Müşteri seçiniz.'); return; }
    if (items.some((i) => !i.description.trim())) { setError('Tüm kalemlere açıklama giriniz.'); return; }

    setSaving(true);
    try {
      await createQuote({
        customerId,
        items,
        validUntil: validUntil || null,
        notes
      });
      closeModal();
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Teklif oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  const { subtotal, vatTotal, grandTotal } = calcTotals();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teklifler"
        subtitle="Müşteri tekliflerini oluşturun ve yönetin"
        action={<button className="btn-primary" onClick={openModal}>+ Yeni Teklif</button>}
      />

      {loading ? (
        <Loading />
      ) : (
        <div className="page-card">
          {quotes.length === 0 ? (
            <EmptyState message="Henüz teklif oluşturulmadı." />
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Teklif No</th>
                    <th>Müşteri</th>
                    <th>Tutar</th>
                    <th>Durum</th>
                    <th>Geçerlilik</th>
                    <th>Tarih</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr key={q._id}>
                      <td className="font-mono font-semibold">{q.number}</td>
                      <td>{q.customerId?.companyName || '-'}</td>
                      <td className="font-semibold">
                        {q.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {q.currency}
                      </td>
                      <td>
                        <span className={QUOTE_STATUS_CLASSES[q.status]}>
                          {QUOTE_STATUS_LABELS[q.status]}
                        </span>
                      </td>
                      <td>{q.validUntil ? new Date(q.validUntil).toLocaleDateString('tr-TR') : '-'}</td>
                      <td>{new Date(q.createdAt).toLocaleDateString('tr-TR')}</td>
                      <td>
                        <Link to={`/admin/quotes/${q._id}`} className="btn-secondary btn-sm">Detay</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <ModalPortal>
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-box modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Yeni Teklif</h2>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              <form onSubmit={onSubmit} className="modal-body space-y-5">
                {error && <div className="form-error">{error}</div>}

                <div className="form-row">
                  <div className="form-group">
                    <label>Müşteri *</label>
                    <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                      <option value="">Müşteri seçiniz</option>
                      {customers.map((c) => (
                        <option key={c._id} value={c._id}>{c.companyName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Geçerlilik Tarihi</label>
                    <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Notlar</label>
                  <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ödeme koşulları, teslimat notları..." />
                </div>

                {/* Line Items */}
                <div>
                  <div className="flex-between mb-2">
                    <label className="font-semibold">Kalemler</label>
                    <button type="button" className="btn-secondary btn-sm" onClick={addItem}>+ Kalem Ekle</button>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="line-item-row">
                        <input
                          className="flex-1"
                          placeholder="Açıklama"
                          value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          required
                        />
                        <input
                          type="number" min="0.01" step="0.01" placeholder="Adet"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          style={{ width: 72 }}
                        />
                        <input
                          type="number" min="0" step="0.01" placeholder="Birim Fiyat"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          style={{ width: 110 }}
                        />
                        <select
                          value={item.vatRate}
                          onChange={(e) => updateItem(idx, 'vatRate', parseInt(e.target.value))}
                          style={{ width: 80 }}
                        >
                          {VAT_RATES.map((r) => <option key={r} value={r}>%{r}</option>)}
                        </select>
                        <span className="line-total">
                          {(item.quantity * item.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </span>
                        {items.length > 1 && (
                          <button type="button" className="btn-danger btn-sm" onClick={() => removeItem(idx)}>×</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="totals-summary">
                    <span>Ara: {subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                    <span>KDV: {vatTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                    <span className="grand-total">Toplam: {grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={closeModal}>İptal</button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Kaydediliyor...' : 'Teklif Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
