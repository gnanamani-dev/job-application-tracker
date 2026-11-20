import NavIcon from '../layout/NavIcon.jsx'

export default function EmptyState({ title, description, action }) {
  return <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600"><NavIcon name="briefcase" /></div><h2 className="mt-4 text-base font-semibold text-slate-800">{title}</h2><p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{description}</p>{action && <div className="mt-5">{action}</div>}</div>
}
