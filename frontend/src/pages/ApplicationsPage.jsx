import { useEffect, useState } from 'react'
import { applicationsApi, getApiErrorMessage } from '../api/services.js'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import LoadingState from '../components/ui/LoadingState.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { useToast } from '../context/useToast.js'

const statuses = ['Applied', 'Interview', 'Technical Round', 'Offer', 'Rejected']
function todayLocal() {
  const today = new Date()
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
  return today.toISOString().slice(0, 10)
}

const blankApplication = { company: '', role: '', status: 'Applied', applied_date: todayLocal(), location: '', job_url: '', salary: '', notes: '' }
const fieldClass = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

function ApplicationForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(initial || blankApplication)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true)
    const body = { ...form, salary: form.salary === '' ? null : form.salary }
    try {
      if (initial?.id) await applicationsApi.update(initial.id, body)
      else await applicationsApi.create(body)
      onSaved()
    } catch (requestError) { setError(getApiErrorMessage(requestError)) } finally { setBusy(false) }
  }
  function field(name, label, type = 'text', required = false) {
    return <label className="block text-sm font-medium text-slate-700">{label}<input className={fieldClass} name={name} type={type} required={required} min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.01' : undefined} value={form[name] ?? ''} onChange={(event) => setForm({ ...form, [name]: event.target.value })} /></label>
  }
  return <form onSubmit={submit} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-semibold text-slate-900">{initial?.id ? 'Edit application' : 'Add an application'}</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{field('company', 'Company', 'text', true)}{field('role', 'Job role', 'text', true)}<label className="block text-sm font-medium text-slate-700">Status<select className={fieldClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>{field('applied_date', 'Applied date', 'date', true)}{field('location', 'Location')}{field('job_url', 'Job URL', 'url')}{field('salary', 'Salary (optional)', 'number')}<label className="block text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">Notes<textarea className={fieldClass} rows="3" value={form.notes ?? ''} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label></div>{error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p>}<div className="mt-5 flex justify-end gap-3"><button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button><button disabled={busy} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Saving…' : 'Save application'}</button></div></form>
}

export default function ApplicationsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ search: '', status: '', location: '' })
  const [draft, setDraft] = useState(filters)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [reload, setReload] = useState(0)
  const [pendingDelete, setPendingDelete] = useState(null)
  const notify = useToast()

  useEffect(() => {
    let active = true
    applicationsApi.list({ page, page_size: 10, ...filters })
      .then((result) => { if (active) setData(result) })
      .catch((requestError) => { if (active) setError(getApiErrorMessage(requestError)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, filters, reload])

  async function editApplication(id) {
    setError('')
    try { setForm(await applicationsApi.get(id)) } catch (requestError) { setError(getApiErrorMessage(requestError)) }
  }
  async function deleteApplication(id) {
    const selected = data?.results?.find((item) => item.id === id)
    if (selected) setPendingDelete(selected)
  }
  async function confirmDelete() {
    if (!pendingDelete) return
    const id = pendingDelete.id
    setBusyId(id); setError('')
    try {
      await applicationsApi.remove(id)
      notify('Application deleted.', 'success')
      setPendingDelete(null); setLoading(true); setReload((value) => value + 1)
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(message); notify(message, 'error'); setPendingDelete(null)
    } finally { setBusyId(null) }
  }
  function applyFilters(event) { event.preventDefault(); setError(''); setLoading(true); setPage(1); setFilters({ search: draft.search.trim(), status: draft.status, location: draft.location.trim() }) }
  function changePage(nextPage) { setError(''); setLoading(true); setPage(nextPage) }
  const pageCount = data ? Math.max(1, Math.ceil(data.count / 10)) : 1

  return <>
    <PageHeading eyebrow="Your job search" title="Applications" description="Keep every opportunity, follow-up, and update in one place." action={<button type="button" onClick={() => setForm(blankApplication)} className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">+ Add application</button>} />
    {form && <ApplicationForm key={form.id || 'new'} initial={form.id ? form : null} onCancel={() => setForm(null)} onSaved={() => { notify(form.id ? 'Application updated.' : 'Application added.', 'success'); setForm(null); setLoading(true); setReload((value) => value + 1) }} />}
    <form onSubmit={applyFilters} className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto]"><label className="text-xs font-semibold text-slate-500">Search company or role<input className={fieldClass} placeholder="Company or job title" value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} /></label><label className="text-xs font-semibold text-slate-500">Status<select className={fieldClass} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}><option value="">All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label className="text-xs font-semibold text-slate-500">Location<input className={fieldClass} placeholder="Any location" value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} /></label><button className="self-end rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Apply filters</button></form>
    {error && <p className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert">{error}</p>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-busy={loading}>
      {loading ? <LoadingState label="Loading applications…" /> : data?.results?.length ? <><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><caption className="sr-only">Your job applications</caption><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th scope="col" className="px-5 py-3">Company / role</th><th scope="col" className="px-5 py-3">Status</th><th scope="col" className="px-5 py-3">Applied</th><th scope="col" className="px-5 py-3">Location</th><th scope="col" className="px-5 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{data.results.map((item) => <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold text-slate-800">{item.company}</p><p className="mt-1 text-slate-500">{item.role}</p></td><td className="px-5 py-4"><StatusBadge status={item.status} /></td><td className="px-5 py-4 text-slate-600">{item.applied_date}</td><td className="px-5 py-4 text-slate-600">{item.location || '—'}</td><td className="px-5 py-4"><div className="flex gap-3"><button type="button" onClick={() => editApplication(item.id)} className="font-medium text-blue-600 hover:underline">Edit</button><button type="button" disabled={busyId === item.id} onClick={() => deleteApplication(item.id)} className="font-medium text-rose-600 hover:underline disabled:opacity-50">Delete</button></div></td></tr>)}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500"><span>{data.count} application{data.count === 1 ? '' : 's'} · page {page} of {pageCount}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Previous</button><button type="button" disabled={page >= pageCount} onClick={() => changePage(page + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Next</button></div></div></> : <div className="p-5"><EmptyState title="No applications found" description={filters.search || filters.status || filters.location ? 'Try changing or clearing your filters.' : 'Add your first job application to start tracking your search.'} action={<button type="button" onClick={() => setForm(blankApplication)} className="font-semibold text-blue-600">Add an application</button>} /></div>}
    </section>
    {pendingDelete && <ConfirmDialog title="Delete application?" description={`Delete ${pendingDelete.role} at ${pendingDelete.company}? This action cannot be undone.`} busy={busyId === pendingDelete.id} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} />}
  </>
}
