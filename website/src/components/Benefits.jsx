const benefits = [
  'Zaman kazandırır',
  'Takip karmaşasını azaltır',
  'Yönetici onaylarını hızlandırır',
  'Evrakları dijitalleştirir',
  'Mobil erişim sağlar',
  'Operasyonel görünürlük sunar',
  'Daha düzenli çalışma kültürü oluşturur',
  'Raporlanabilir süreçler sağlar'
];

export default function Benefits() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">Faydalar</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-navy sm:text-4xl">İşletmenize ne kazandırır?</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((item) => (
            <div key={item} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-soft">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-green-100 text-lg font-black text-action">✓</span>
              <h3 className="mt-5 text-lg font-black text-navy">{item}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
