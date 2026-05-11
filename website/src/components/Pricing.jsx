const plans = [
  {
    name: 'Başlangıç',
    note: 'Demo sonrası teklif',
    features: ['10 kullanıcıya kadar', 'Görev takibi', 'İzin talepleri', 'Temel raporlar'],
    cta: 'Demo Talep Et'
  },
  {
    name: 'Profesyonel',
    note: 'Size özel fiyatlandırma',
    featured: true,
    features: ['50 kullanıcıya kadar', 'Görev takibi', 'İzin & masraf yönetimi', 'Araç talepleri', 'Personel evrakları', 'Gelişmiş raporlar'],
    cta: 'Demo Talep Et'
  },
  {
    name: 'Kurumsal',
    note: 'Özel teklif',
    features: ['Özel kullanıcı limiti', 'Özel süreç uyarlamaları', 'Yetkilendirme', 'Öncelikli destek'],
    cta: 'Teklif Al'
  }
];

export default function Pricing() {
  return (
    <section id="fiyatlandirma" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">Fiyatlandırma</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-navy sm:text-4xl">İhtiyacınıza göre ölçeklenen paketler</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Net fiyatı demo sonrası kullanım senaryonuza, kullanıcı sayınıza ve modül kapsamınıza göre birlikte belirleyelim.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-[2rem] border p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-soft ${
                plan.featured ? 'border-primary bg-navy text-white shadow-panel' : 'border-slate-200 bg-white text-navy'
              }`}
            >
              {plan.featured ? <div className="mb-5 inline-flex rounded-full bg-action px-4 py-2 text-xs font-black text-white">En çok tercih edilen</div> : null}
              <h3 className="text-2xl font-black">{plan.name}</h3>
              <p className={`mt-2 text-sm font-bold ${plan.featured ? 'text-blue-100' : 'text-primary'}`}>{plan.note}</p>
              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className={`flex gap-3 text-sm font-semibold ${plan.featured ? 'text-slate-200' : 'text-slate-600'}`}>
                    <span className="text-action">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="#demo"
                className={`mt-8 inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-black transition ${
                  plan.featured ? 'bg-action text-white hover:bg-green-500' : 'bg-primary text-white hover:bg-blue-500'
                }`}
              >
                {plan.cta}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
