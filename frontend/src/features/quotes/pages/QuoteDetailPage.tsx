import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loading } from '../../../components/Loading';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { getQuote, updateQuote, deleteQuote, downloadQuotePdf } from '../api/quotes.api';
import type { Quote, QuoteStatus } from '../types/quote.types';

const STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  ACCEPTED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  EXPIRED: 'Süresi Doldu'
};

const STATUS_NEXT: Partial<Record<QuoteStatus, QuoteStatus[]>> = {
  DRAFT: ['SENT'],
  SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED']
};

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setQuote(await getQuote(id));
    } catch {
      setError('Teklif yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const onStatusChange = async (status: QuoteStatus) => {
    if (!id) return;
    setUpdatingStatus(true);
    try {
      setQuote(await updateQuote(id, { status }));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Durum güncellenemedi.');
    } finally {
      setUpdatingStatus(false);
    }
  };


  const onDelete = async () => {
    if (!id) return;
    try {
      await deleteQuote(id);
      navigate('/admin/quotes');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Silinemedi.');
      setIsDeleteOpen(false);
    }
  };

  const onDownload = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      const blob = await downloadQuotePdf(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quote?.number || 'teklif'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'PDF indirilemedi.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Loading />;
  if (!quote) return <div className="page-card"><p>{error || 'Teklif bulunamadı.'}</p></div>;

  const customer = quote.customerId;
  const nextStatuses = STATUS_NEXT[quote.status] || [];

  return (
    <div className="animate-slide-in-right space-y-5">
      {/* Header */}
      <div className="flex-between flex-wrap gap-3">
        <div className="flex gap-3 items-center">
          <button className="btn-secondary" onClick={() => navigate('/admin/quotes')}>← Teklifler</button>
          <div>
            <div className="page-title">{quote.number}</div>
            <div className="page-subtitle">{customer?.companyName}</div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {nextStatuses.map((s) => (
            <button key={s} className="btn-secondary" disabled={updatingStatus} onClick={() => onStatusChange(s)}>
              → {STATUS_LABELS[s]}
            </button>
          ))}
          <button className="btn-secondary" onClick={onDownload} disabled={downloading}>
            {downloading ? 'Hazırlanıyor...' : 'İndir'}
          </button>
          {quote.status === 'DRAFT' && (
            <button className="btn-danger" onClick={() => setIsDeleteOpen(true)}>Sil</button>
          )}
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {/* Info */}
      <div className="page-card space-y-4">
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Teklif No</span>
            <span className="detail-value font-mono">{quote.number}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Durum</span>
            <span className={`status-badge status-${quote.status.toLowerCase()}`}>{STATUS_LABELS[quote.status]}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Müşteri</span>
            <span className="detail-value">{customer?.companyName}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Vergi No</span>
            <span className="detail-value">{customer?.taxNumber || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Vergi Dairesi</span>
            <span className="detail-value">{customer?.taxOffice || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Geçerlilik Tarihi</span>
            <span className="detail-value">
              {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('tr-TR') : '-'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Oluşturulma</span>
            <span className="detail-value">{new Date(quote.createdAt).toLocaleString('tr-TR')}</span>
          </div>
          {quote.notes && (
            <div className="detail-item col-span-2">
              <span className="detail-label">Notlar</span>
              <span className="detail-value">{quote.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="page-card">
        <h3 className="section-subtitle mb-4">Kalemler</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Açıklama</th>
                <th className="text-right">Miktar</th>
                <th className="text-right">Birim Fiyat</th>
                <th className="text-right">KDV</th>
                <th className="text-right">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{item.description}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{item.unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {quote.currency}</td>
                  <td className="text-right">%{item.vatRate}</td>
                  <td className="text-right font-semibold">{item.lineTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {quote.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="totals-block">
          <div className="total-row"><span>Ara Toplam</span><span>{quote.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {quote.currency}</span></div>
          <div className="total-row"><span>KDV Toplam</span><span>{quote.vatTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {quote.currency}</span></div>
          <div className="total-row total-grand"><span>GENEL TOPLAM</span><span>{quote.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {quote.currency}</span></div>
        </div>
      </div>

      {isDeleteOpen && (
        <ConfirmDialog
          title="Teklifi Sil"
          message={`"${quote.number}" numaralı teklifi silmek istediğinize emin misiniz?`}
          onConfirm={onDelete}
          onCancel={() => setIsDeleteOpen(false)}
        />
      )}
    </div>
  );
}
