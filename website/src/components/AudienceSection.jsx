const audiences = [
  ['Oto servisler', 'Araç planlama, görev dağıtımı ve servis operasyonlarını tek ekranda takip edin.'],
  ['Üretim atölyeleri', 'Usta, ekip ve vardiya bazlı görevleri görünür hale getirin.'],
  ['Lojistik ve servis firmaları', 'Saha ekiplerinin görevlerini, taleplerini ve araç kullanımını düzenleyin.'],
  ['Temizlik ve güvenlik şirketleri', 'Lokasyon bazlı ekip takibi ve personel taleplerini sadeleştirin.'],
  ['Ajanslar', 'İç görevleri, müşteri işleri ve ekip sorumluluklarını düzenli takip edin.'],
  ['İnşaat ve taşeron ekipleri', 'Saha talepleri, malzeme ihtiyaçları ve görev akışlarını kaydedin.'],
  ['Küçük ve orta ölçekli işletmeler', 'Excel, WhatsApp ve klasörlerle yürüyen süreçleri tek sisteme alın.'],
  ['İnsan kaynakları ekipleri', 'İzinler, personel belgeleri ve çalışan talepleri için düzenli bir yapı kurun.']
];

export default function AudienceSection() {
  return (
    <section id="kimler-icin" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">Kimler için</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-navy sm:text-4xl">
            Özellikle saha ve operasyon ağırlıklı ekipler için tasarlandı
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map(([title, description]) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
              <h3 className="text-lg font-black text-navy">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
