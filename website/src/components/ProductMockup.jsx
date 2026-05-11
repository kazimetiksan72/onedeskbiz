const menuItems = ['Görevler', 'Talepler', 'İzin & Masraf', 'Araç Talepleri', 'Personel Evrakları', 'Raporlar', 'Ayarlar'];
const tasks = [
  ['Servis kabul alanı kontrolü', 'Devam ediyor', 'Bugün'],
  ['Personel sözleşmesi yükleme', 'Bekliyor', 'Yarın'],
  ['Araç bakım talebi inceleme', 'Tamamlandı', 'Dün']
];
const approvals = ['İzin talebi - 2 gün', 'Masraf talebi - ₺3.450', 'Araç talebi - 14:00'];

export default function ProductMockup() {
  return (
    <section className="bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-200">Ürün ekranları</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Gerçek uygulama hissi veren sade yönetim paneli</h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            İş takip programı mantığıyla günlük operasyonu, onayları ve raporları aynı panelden yönetin.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-panel">
          <div className="grid min-h-[640px] lg:grid-cols-[260px_1fr]">
            <aside className="bg-navy p-6 text-white">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary font-black">O</span>
                <span className="font-black">OneDesk</span>
              </div>
              <div className="mt-8 space-y-2">
                {menuItems.map((item, index) => (
                  <div key={item} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${index === 0 ? 'bg-white text-navy' : 'text-slate-300'}`}>
                    {item}
                  </div>
                ))}
              </div>
            </aside>
            <div className="bg-slate-50 p-5 text-navy sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-primary">Operasyon paneli</p>
                  <h3 className="text-2xl font-black">Bugünkü iş akışı</h3>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white">Yeni Görev</button>
                  <button className="rounded-full bg-action px-4 py-2 text-sm font-bold text-white">Talep Oluştur</button>
                </div>
              </div>

              <div className="mt-8 grid gap-5 lg:grid-cols-3">
                {['Tamamlanan görev', 'Bekleyen onay', 'Eksik evrak'].map((item, index) => (
                  <div key={item} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-bold text-slate-500">{item}</p>
                    <p className="mt-2 text-3xl font-black text-navy">{[42, 9, 6][index]}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="text-lg font-black">Görev listesi</h4>
                  <div className="mt-5 space-y-3">
                    {tasks.map(([title, status, date]) => (
                      <div key={title} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                        <span className="font-bold">{title}</span>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-primary">{status}</span>
                        <span className="text-sm font-semibold text-slate-500">{date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="text-lg font-black">Bekleyen onaylar</h4>
                  <div className="mt-5 space-y-3">
                    {approvals.map((item) => (
                      <div key={item} className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
                        <span className="text-sm font-bold text-amber-900">{item}</span>
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="text-lg font-black">Aylık talep grafiği</h4>
                  <div className="mt-6 flex h-36 items-end gap-3">
                    {[45, 70, 55, 86, 63, 92, 78].map((height, index) => (
                      <span key={index} className="flex-1 rounded-t-xl bg-primary" style={{ height: `${height}%` }} />
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="text-lg font-black">Son aktiviteler</h4>
                  <div className="mt-5 space-y-4">
                    {['Masraf talebi onaylandı', 'Yeni görev saha ekibine atandı', 'Personel evrakı sisteme eklendi', 'Araç talebi planlandı'].map((item) => (
                      <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full bg-action" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
