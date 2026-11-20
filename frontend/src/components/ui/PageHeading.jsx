export default function PageHeading({ eyebrow, title, description, action }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">{eyebrow}</p>}<h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[30px]">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}</div>{action}</div>
}
