const benefits = [
  'Daha az takip karmaşası',
  'Daha hızlı onay süreçleri',
  'Daha düzenli personel evrak yönetimi',
  'Mobil erişim',
  'Yönetici raporları',
  'Şeffaf görev ve talep geçmişi'
];

export default function SolutionSection() {
  return (
    <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">Çözüm</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-navy sm:text-4xl">Dağınık operasyonu tek ekranda toplayın</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Görev, talep, onay ve evrak süreçlerini dijitalleştirerek işletmenizin günlük operasyonlarını daha düzenli, takip edilebilir ve ölçülebilir hale getirin.
          </p>
          <a href="#demo" className="mt-8 inline-flex rounded-full bg-action px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-700/20 transition hover:bg-green-500">
            Süreçlerinizi dijitale taşıyın
          </a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {benefits.map((item) => (
            <div key={item} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 h-2 w-12 rounded-full bg-action" />
              <h3 className="text-lg font-black text-navy">{item}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Günlük iş akışlarını görünür hale getirir ve ekipler arasında ortak bir takip dili oluşturur.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
