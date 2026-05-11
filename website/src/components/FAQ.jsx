import { useState } from 'react';

const faqs = [
  ['Bu sistem hangi işletmeler için uygun?', '10-50 çalışanlı, görev, talep, onay ve personel evrak süreçlerini daha düzenli yönetmek isteyen küçük ve orta ölçekli işletmeler için uygundur.'],
  ['Mobil cihazlardan kullanılabilir mi?', 'Evet. Platform web paneli ve mobil uygulama desteğiyle çalışır. Personel görevleri ve talepleri mobil cihazından takip edebilir.'],
  ['Personel evrakları güvenli şekilde saklanır mı?', 'Evraklar yetkilendirilmiş kullanıcıların erişebileceği şekilde dijital ortamda saklanır. Rol bazlı erişimle gereksiz görünürlük azaltılır.'],
  ['İzin ve masraf taleplerinde onay süreci var mı?', 'Evet. İzin, masraf ve araç talepleri yöneticilerin onaylayabileceği kontrollü akışlara dönüştürülebilir.'],
  ['Kurulum ne kadar sürer?', 'Temel kurulum genellikle kısa bir demo ve süreç analizi sonrası hızlıca yapılır. Kullanıcı, rol ve modül kapsamına göre süre netleşir.'],
  ['Mevcut süreçlerimize göre uyarlanabilir mi?', 'Evet. Rol, departman, talep türleri ve kullanım akışları işletmenizin mevcut operasyonuna göre kurgulanabilir.'],
  ['Demo görüşmesi ücretli mi?', 'Hayır. Demo görüşmesi ücretsizdir ve yaklaşık 20 dakika sürer.']
];

export default function FAQ() {
  const [active, setActive] = useState(0);

  return (
    <section id="sss" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">SSS</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-navy sm:text-4xl">Sık sorulan sorular</h2>
        </div>
        <div className="mt-10 space-y-4">
          {faqs.map(([question, answer], index) => (
            <div key={question} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
                onClick={() => setActive(active === index ? -1 : index)}
              >
                <span className="text-base font-black text-navy">{question}</span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-lg font-black text-primary">
                  {active === index ? '−' : '+'}
                </span>
              </button>
              {active === index ? <p className="px-6 pb-6 text-sm leading-7 text-slate-600">{answer}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
