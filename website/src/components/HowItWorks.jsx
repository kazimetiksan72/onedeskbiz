const steps = [
  ['Demo görüşmesi yapalım', 'İşletmenizin süreçlerini anlayalım ve size uygun kullanım senaryosunu gösterelim.'],
  ['Ekibinizi tanımlayın', 'Kullanıcıları, rollerini ve temel süreçlerinizi sisteme ekleyin.'],
  ['Görev ve talepleri dijitale taşıyın', 'Görevleri, izinleri, masrafları, araç taleplerini ve evrakları tek panelden yönetin.']
];

export default function HowItWorks() {
  return (
    <section id="nasil-calisir" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">Nasıl çalışır</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-navy sm:text-4xl">3 adımda kullanmaya başlayın</h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {steps.map(([title, description], index) => (
            <article key={title} className="relative rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-xl font-black text-white shadow-lg shadow-blue-600/20">
                {index + 1}
              </div>
              <h3 className="mt-6 text-xl font-black text-navy">{title}</h3>
              <p className="mt-3 text-base leading-8 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
