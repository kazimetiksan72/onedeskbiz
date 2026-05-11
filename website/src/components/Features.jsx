const features = [
  ['Görev Takibi', 'Görev oluşturun, sorumlu atayın, teslim tarihlerini belirleyin ve tamamlanma durumunu takip edin.'],
  ['İzin Talep Yönetimi', 'Personel izin taleplerini dijital olarak alın, yöneticiler tarafından onaylayın veya reddedin.'],
  ['Masraf Talep Yönetimi', 'Masraf taleplerini kayıt altına alın, belge ekleyin ve onay akışına dahil edin.'],
  ['Araç Talep Yönetimi', 'Şirket araçlarının kullanım taleplerini planlayın, kimin ne zaman araç kullanacağını net takip edin.'],
  ['Personel Evrak Yönetimi', 'Kimlik, sözleşme, sertifika ve diğer personel belgelerini düzenli ve güvenli şekilde saklayın.'],
  ['Onay Akışları', 'İzin, masraf ve araç taleplerini yöneticilerin hızlıca onaylayabileceği kontrollü süreçlere dönüştürün.'],
  ['Bildirimler', 'Yeni görevler, bekleyen talepler ve onay durumları için kullanıcılara anlık bildirimler gönderin.'],
  ['Raporlama', 'Görev performansı, talep yoğunluğu ve operasyonel süreçler hakkında anlaşılır raporlar sunun.']
];

export default function Features() {
  return (
    <section id="ozellikler" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">Özellikler</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-navy sm:text-4xl">
            Tüm operasyonel ihtiyaçlarınız için tek platform
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Görev takip programı, izin talep sistemi, masraf talep sistemi, araç talep yönetimi ve personel evrak yönetimi tek arayüzde birleşir.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map(([title, description], index) => (
            <article key={title} className="group rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-soft">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-sm font-black text-primary transition group-hover:bg-primary group-hover:text-white">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="mt-5 text-lg font-black text-navy">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
