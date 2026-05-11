const problems = [
  'Görevlerin kime atandığı belirsiz kalır',
  'İzin ve masraf talepleri mesajlarda kaybolur',
  'Araç talepleri manuel takip edilir',
  'Personel evrakları dağınık tutulur',
  'Yöneticiler rapor almakta zorlanır'
];

export default function ProblemSection() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-red-500">Operasyonel dağınıklık</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-navy sm:text-4xl">
            İşler WhatsApp’ta, evraklar klasörde, talepler unutuluyor mu?
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {problems.map((problem, index) => (
            <div key={problem} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-lg font-black text-red-600">
                {index + 1}
              </div>
              <p className="mt-5 text-base font-bold leading-7 text-navy">{problem}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
