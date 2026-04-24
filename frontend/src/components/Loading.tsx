export function Loading({ label = 'Yükleniyor...' }: { label?: string }) {
  return <p className="text-sm text-slate-500">{label}</p>;
}
