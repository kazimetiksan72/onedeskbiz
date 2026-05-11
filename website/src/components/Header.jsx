import { useState } from 'react';

const links = [
  { href: '#ozellikler', label: 'Özellikler' },
  { href: '#kimler-icin', label: 'Kimler İçin' },
  { href: '#nasil-calisir', label: 'Nasıl Çalışır' },
  { href: '#fiyatlandirma', label: 'Fiyatlandırma' },
  { href: '#sss', label: 'SSS' }
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-3" aria-label="OneDesk ana sayfa">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-lg font-black text-white shadow-lg shadow-blue-500/20">
            O
          </span>
          <span>
            <span className="block text-lg font-bold tracking-tight text-navy">OneDesk</span>
            <span className="block text-xs font-medium text-slate-500">Operasyon yönetim platformu</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-semibold text-slate-600 transition hover:text-primary">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <a href="#demo" className="rounded-full bg-action px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-700/20 transition hover:bg-green-500">
            Demo Talep Et
          </a>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-navy shadow-sm lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Menüyü aç"
        >
          <span className="space-y-1.5">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </span>
        </button>
      </nav>

      {open ? (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-soft lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-primary"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#demo"
              className="mt-2 rounded-full bg-action px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-green-700/20"
              onClick={() => setOpen(false)}
            >
              Demo Talep Et
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
