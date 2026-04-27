import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { getPublicBusinessCard } from '../api/digitalCards.api';

function escapeVCardValue(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function buildVCard(data: any) {
  const card = data.businessCard || {};
  const fullName = card.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim();
  const [firstName = '', ...rest] = fullName.split(' ');
  const lastName = rest.join(' ');

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`,
    `FN:${escapeVCardValue(fullName)}`
  ];

  if (card.title) lines.push(`TITLE:${escapeVCardValue(card.title)}`);
  if (card.phone) lines.push(`TEL;TYPE=CELL:${escapeVCardValue(card.phone)}`);
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(card.email)}`);
  if (card.website) lines.push(`URL:${escapeVCardValue(card.website)}`);
  if (card.address) lines.push(`ADR;TYPE=WORK:;;${escapeVCardValue(card.address)};;;;`);
  if (card.bio) lines.push(`NOTE:${escapeVCardValue(card.bio)}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

export function PublicBusinessCardPage() {
  const { userId } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  useEffect(() => {
    if (!userId) return;

    getPublicBusinessCard(userId)
      .then(setData)
      .catch(() => setError('Kartvizit bulunamadı'));
  }, [userId]);

  useEffect(() => {
    if (!data) return;

    const vCard = buildVCard(data);
    QRCode.toDataURL(vCard, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: 'M'
    })
      .then(setQrCodeDataUrl)
      .catch(() => setQrCodeDataUrl(''));
  }, [data]);

  if (error) {
    return <div className="flex min-h-screen items-center justify-center px-4 text-center text-slate-500">{error}</div>;
  }

  if (!data) {
    return <div className="flex min-h-screen items-center justify-center px-4 text-center text-slate-500">Yükleniyor...</div>;
  }

  const card = data.businessCard;
  const avatarUrl = card.avatarPublicUrl || card.avatarUrl || null;

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto w-full max-w-md p-1 sm:p-2">
        <div className="flex items-start gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={card.displayName}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover sm:h-24 sm:w-24"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-200 text-slate-400 sm:h-24 sm:w-24">
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor" aria-hidden="true">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
              </svg>
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-xl font-semibold leading-tight sm:text-2xl">
              {card.displayName || `${data.firstName} ${data.lastName}`}
            </h1>
            <p className="mt-1 text-sm text-slate-500 sm:text-base">{card.title}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm break-words sm:mt-5">
          {card.email ? <p>E-posta: {card.email}</p> : null}
          {card.phone ? <p>Telefon: {card.phone}</p> : null}
          {card.website ? <p>Web sitesi: {card.website}</p> : null}
          {card.address ? <p>Adres: {card.address}</p> : null}
          {card.bio ? <p className="whitespace-pre-wrap">{card.bio}</p> : null}
        </div>

        {qrCodeDataUrl ? (
          <div className="mt-6 border-t border-slate-200 pt-4 sm:mt-7">
            <img
              src={qrCodeDataUrl}
              alt="vCard QR code"
              className="mx-auto w-full max-w-[220px] rounded-lg border border-slate-200 bg-white p-2 sm:max-w-[260px]"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
