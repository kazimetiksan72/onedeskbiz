const stats = [
  { label: 'Toplam Görev', value: '128', trend: '+18 bu hafta' },
  { label: 'Bekleyen İzin', value: '7', trend: '3 acil' },
  { label: 'Masraf Talebi', value: '14', trend: '₺42.600' },
  { label: 'Araç Talebi', value: '5', trend: '2 bugün' }
];

const trustItems = ['Kolay kurulum', 'Mobil destek', 'Güvenli altyapı', 'Anlık bildirimler'];

function DashboardPreview() {
  return (
    <div className="relative rounded-[2rem] border border-white/20 bg-white p-4 shadow-panel">
      <div className="absolute -right-5 -top-5 hidden rounded-3xl bg-action px-5 py-3 text-sm font-bold text-white shadow-xl shadow-green-700/20 sm:block">
        Canlı takip
      </div>
      <div className="rounded-[1.5rem] bg-slate-950 p-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Yönetici Paneli</p>
            <h3 className="mt-1 text-lg font-bold text-white">Bugünkü operasyon özeti</h3>
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">09:42</div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {stats.map((item) => (
            <div key={item.label} className="rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold text-slate-500">{item.label}</p>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-2xl font-black text-navy">{item.value}</span>
                <span className="text-[11px] font-bold text-action">{item.trend}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-bold text-navy">Onay bekleyen talepler</h4>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-primary">12 kayıt</span>
            </div>
            {['İzin talebi - Mert Kaya', 'Masraf talebi - Selin Arı', 'Araç talebi - Operasyon'].map((item) => (
              <div key={item} className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 last:mb-0">
                <span className="text-sm font-semibold text-slate-700">{item}</span>
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-white p-4">
            <h4 className="font-bold text-navy">Aylık talep grafiği</h4>
            <div className="mt-5 flex h-28 items-end gap-2">
              {[34, 56, 42, 80, 62, 95, 74].map((height, index) => (
                <span key={index} className="flex-1 rounded-t-xl bg-blue-500/80" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-4">
          <h4 className="font-bold text-navy">Son aktiviteler</h4>
          <div className="mt-3 space-y-2">
            {['Yeni görev üretim ekibine atandı', 'İzin talebi onaylandı', 'Personel evrakı yüklendi'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-600">
                <span className="h-2 w-2 rounded-full bg-action" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(180deg,#ffffff,#f8fafc)] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-primary">
            Küçük işletme yönetim yazılımı
          </div>
          <h1 className="mt-7 max-w-4xl text-4xl font-black tracking-tight text-navy sm:text-5xl lg:text-6xl">
            Görevleri, Talepleri ve Personel Süreçlerini Tek Panelden Yönetin
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            10-50 çalışanlı işletmeler için görev takibi, izin/masraf/araç talepleri ve personel evraklarını tek sistemde toplayan mobil destekli yönetim platformu.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#demo" className="inline-flex items-center justify-center rounded-full bg-action px-7 py-4 text-base font-bold text-white shadow-xl shadow-green-700/20 transition hover:bg-green-500">
              Ücretsiz Demo Talep Et
            </a>
            <a href="#ozellikler" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-4 text-base font-bold text-navy shadow-sm transition hover:border-primary hover:text-primary">
              Özellikleri İncele
            </a>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {trustItems.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-bold text-slate-700 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
        <DashboardPreview />
      </div>
    </section>
  );
}
