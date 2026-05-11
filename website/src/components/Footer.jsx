const links = [
  ['Özellikler', '#ozellikler'],
  ['Kimler İçin', '#kimler-icin'],
  ['Nasıl Çalışır', '#nasil-calisir'],
  ['Fiyatlandırma', '#fiyatlandirma'],
  ['SSS', '#sss']
];

export default function Footer() {
  return (
    <footer className="bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 border-t border-slate-200 pt-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary font-black text-white">O</span>
            <span className="text-lg font-black text-navy">OneDesk</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
            10-50 çalışanlı işletmeler için görev, talep, onay ve personel evrak süreçlerini tek panelden yöneten mobil destekli SaaS platformu.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Menü</h3>
          <div className="mt-4 grid gap-3">
            {links.map(([label, href]) => (
              <a key={href} href={href} className="text-sm font-semibold text-slate-600 transition hover:text-primary">
                {label}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">İletişim</h3>
          <p className="mt-4 text-sm font-semibold text-slate-600">demo@ornekdomain.com</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">linkedin.com/company/onedesk</p>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl text-sm text-slate-500">
        © 2026 OneDesk. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
