import { useState } from 'react';

const modules = ['Görev Takibi', 'İzin & Masraf', 'Araç Talepleri', 'Personel Evrakları', 'Raporlama'];

export default function DemoForm() {
  const [sent, setSent] = useState(false);
  const [selectedModules, setSelectedModules] = useState(['Görev Takibi']);

  const toggleModule = (module) => {
    setSelectedModules((current) => (
      current.includes(module) ? current.filter((item) => item !== module) : [...current, module]
    ));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <section id="demo" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">Demo talep et</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-navy sm:text-4xl">20 dakikalık kısa demo ile sistemi keşfedin</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            İşletmenizin görev, talep ve personel süreçlerini dinleyelim; size uygun kullanım senaryosunu canlı olarak gösterelim.
          </p>
          <div className="mt-8 rounded-3xl bg-blue-50 p-6">
            <h3 className="font-black text-navy">Demo görüşmesinde neleri gösteriyoruz?</h3>
            <ul className="mt-4 space-y-3 text-sm font-semibold text-slate-700">
              <li>Görev oluşturma ve mobil bildirim akışı</li>
              <li>Personel talep yönetimi ve onay ekranları</li>
              <li>Raporlama, evrak takibi ve rol bazlı yetkilendirme</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-soft sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Ad Soyad</span>
              <input required className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Şirket Adı</span>
              <input required className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">E-posta</span>
              <input required type="email" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Telefon</span>
              <input required type="tel" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-primary" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-bold text-slate-700">Çalışan Sayısı</span>
              <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-primary">
                <option>10’dan az</option>
                <option>10-25</option>
                <option>26-50</option>
                <option>50+</option>
              </select>
            </label>
          </div>

          <div className="mt-5">
            <span className="text-sm font-bold text-slate-700">İlgilendiğiniz Modüller</span>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {modules.map((module) => (
                <label key={module} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedModules.includes(module)}
                    onChange={() => toggleModule(module)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  {module}
                </label>
              ))}
            </div>
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-bold text-slate-700">Mesaj</span>
            <textarea rows="4" className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-primary" />
          </label>

          <button type="submit" className="mt-6 w-full rounded-full bg-action px-6 py-4 text-base font-black text-white shadow-lg shadow-green-700/20 transition hover:bg-green-500">
            Demo Talebimi Gönder
          </button>
          {sent ? (
            <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
              Demo talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
