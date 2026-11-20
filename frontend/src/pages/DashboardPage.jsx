import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { dashboardApi, getApiErrorMessage } from '../api/services.js'
import { useAppContext } from '../context/useAppContext.js'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import NavIcon from '../components/layout/NavIcon.jsx'
import LoadingState from '../components/ui/LoadingState.jsx'

const statDefinitions = [
  ['total_applications', 'Total applications', 'briefcase', 'blue'],
  ['applied_count', 'Applied', 'arrow', 'amber'],
  ['interview_count', 'Interview', 'chart', 'violet'],
  ['technical_round_count', 'Technical Round', 'chart', 'amber'],
  ['offer_count', 'Offers', 'arrow', 'emerald'],
  ['rejected_count', 'Rejected', 'briefcase', 'blue'],
]

export default function DashboardPage() {
  const { state } = useAppContext()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    dashboardApi.summary().then((data) => { if (active) setSummary(data) })
      .catch((requestError) => { if (active) setError(getApiErrorMessage(requestError)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const firstName = state.auth.user?.username || 'there'
  return <>
    <PageHeading eyebrow="Your job search" title={`Welcome, ${firstName}`} description="Here’s a clear view of your job search and latest activity." action={<Link to="/applications" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"><NavIcon name="plus" className="h-[18px] w-[18px]" />Add application</Link>} />
    {error && <p className="mb-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert">{error}</p>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Job search summary" aria-busy={loading}>
      {loading ? <div className="col-span-full rounded-2xl bg-white"><LoadingState label="Loading your dashboard…" /></div> : statDefinitions.map(([key, label, icon, tone]) => <StatCard key={key} label={label} value={summary?.[key] ?? 0} change="Your current application pipeline" icon={icon} tone={tone} />)}
    </section>
    {!loading && <section className="mt-7 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold text-slate-900">Recent applications</h2><p className="mt-1 text-sm text-slate-500">Your latest job search activity</p></div><Link to="/applications" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</Link></div>
        {summary?.recent_applications?.length ? <div className="mt-5 divide-y divide-slate-100">{summary.recent_applications.map((application) => <div key={application.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium text-slate-800">{application.role}</p><p className="mt-1 text-sm text-slate-500">{application.company}{application.location ? ` · ${application.location}` : ''}</p></div><div className="flex items-center gap-3"><StatusBadge status={application.status} /><time className="text-xs text-slate-500">{application.applied_date}</time></div></div>)}</div> : <div className="mt-5"><EmptyState title="Your list is ready when you are" description="Add your first application to keep company details and progress together." action={<Link to="/applications" className="text-sm font-semibold text-blue-600">Add your first application</Link>} /></div>}
      </div>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div><h2 className="font-semibold text-slate-900">Application pipeline</h2><p className="mt-1 text-sm text-slate-500">At a glance by stage</p></div><div className="mt-6 space-y-4">{['Applied', 'Interview', 'Technical Round', 'Offer', 'Rejected'].map((status, index) => { const key = ['applied_count', 'interview_count', 'technical_round_count', 'offer_count', 'rejected_count'][index]; return <div key={status} className="flex items-center justify-between"><StatusBadge status={status} /><span className="text-sm font-semibold tabular-nums text-slate-700">{summary?.[key] ?? 0}</span></div> })}</div><p className="mt-6 rounded-xl bg-blue-50/70 p-4 text-sm text-slate-600">{summary?.total_applications ? 'Keep your application details up to date to see your progress clearly.' : 'Add an application to start seeing your progress take shape.'}</p></div>
    </section>}
  </>
}
