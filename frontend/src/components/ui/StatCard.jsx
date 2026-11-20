import NavIcon from '../layout/NavIcon.jsx'

const tones = { blue: 'bg-blue-50 text-blue-700', violet: 'bg-violet-50 text-violet-700', amber: 'bg-amber-50 text-amber-700', emerald: 'bg-emerald-50 text-emerald-700' }

export default function StatCard({ label, value, change, icon, tone }) {
  return <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-6"><div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><NavIcon name={icon} /></span></div><p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-2 text-xs text-slate-500">{change}</p></article>
}
